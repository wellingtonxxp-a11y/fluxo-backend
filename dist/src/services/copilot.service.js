"use strict";
/**
 * Serviço de Copiloto IA
 * Core do sistema - retorna hotspots, tendências e instruções
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCopilot = getCopilot;
exports.getCopilotWithFeedback = getCopilotWithFeedback;
const client_1 = require("@prisma/client");
const cluster_util_1 = require("../utils/cluster.util");
const zone_service_1 = require("./zone.service");
const prediction_service_1 = require("./prediction.service");
const flow_service_1 = require("./flow.service");
const prisma = new client_1.PrismaClient();
/**
 * Obtém análise de copiloto com hotspots e instrucões
 */
async function getCopilot(lat, lng) {
    // Obtém zona do usuário
    const zone = await (0, zone_service_1.getZoneFromPoint)(lat, lng);
    // Obtém flows recentes (últimos 30 minutos)
    const flows = await (0, flow_service_1.getRecentFlows)(zone.id, 30);
    // Agrupa points próximos em clusters
    const clusters = (0, cluster_util_1.clusterHotspots)(flows.map((flow) => ({
        lat: flow.latitude || 0,
        lng: flow.longitude || 0,
        flowId: flow.id
    })));
    // Mapeia clusters para hotspots com predições
    const hotspots = clusters
        .map((cluster) => {
        const prediction = (0, prediction_service_1.predictPickup)(cluster);
        return {
            lat: cluster.lat,
            lng: cluster.lng,
            intensity: cluster.intensity,
            predicted: prediction.score,
            trend: prediction.trend,
            instruction: prediction.instruction
        };
    })
        .sort((a, b) => b.intensity - a.intensity)
        .slice(0, 8); // Top 8 hotspots
    // Obtém zonas próximas
    const zones = await (0, zone_service_1.getZonesNearby)(lat, lng, 5);
    return {
        hotspots,
        zones
    };
}
/**
 * Obtém feedback com hotspots baseado em feedback dos usuários
 */
async function getCopilotWithFeedback(lat, lng) {
    const zone = await (0, zone_service_1.getZoneFromPoint)(lat, lng);
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const flows = await (0, flow_service_1.getRecentFlows)(zone.id, 30);
    // Obtém feedbacks recentes
    const feedbacks = await prisma.hotspotFeedback.findMany({
        where: {
            zoneId: zone.id,
            createdAt: { gte: since }
        }
    });
    const clusters = (0, cluster_util_1.clusterHotspots)(flows.map((flow) => ({
        lat: flow.latitude || 0,
        lng: flow.longitude || 0,
        flowId: flow.id
    })));
    // Aplica boost de feedback aos clusters
    const hotspots = clusters
        .map((cluster) => {
        let intensity = cluster.intensity;
        // Boost baseado em feedback próximo
        const nearbyFeedback = feedbacks.filter((fb) => {
            const distLat = (fb.latitude || 0) - cluster.lat;
            const distLng = (fb.longitude || 0) - cluster.lng;
            const distance = Math.sqrt(distLat * distLat + distLng * distLng);
            return distance < 0.01; // ~1km
        });
        if (nearbyFeedback.length > 0) {
            const totalWeight = nearbyFeedback.reduce((sum, fb) => sum + fb.weight, 0);
            intensity = Math.min(100, intensity * (1 + totalWeight / 20));
        }
        const prediction = (0, prediction_service_1.predictPickup)({ ...cluster, intensity });
        return {
            lat: cluster.lat,
            lng: cluster.lng,
            intensity: Math.round(intensity),
            predicted: prediction.score,
            trend: prediction.trend,
            instruction: prediction.instruction
        };
    })
        .sort((a, b) => b.intensity - a.intensity)
        .slice(0, 8);
    const zones = await (0, zone_service_1.getZonesNearby)(lat, lng, 5);
    return {
        hotspots,
        zones
    };
}
exports.default = {
    getCopilot,
    getCopilotWithFeedback
};
//# sourceMappingURL=copilot.service.js.map