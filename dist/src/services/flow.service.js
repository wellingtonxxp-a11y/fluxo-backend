"use strict";
/**
 * Serviço de Flows (Trajetos)
 * Gerencia criação, atualização e consulta de trajetos de usuários
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestFlow = ingestFlow;
exports.getRecentFlows = getRecentFlows;
exports.finishFlow = finishFlow;
const client_1 = require("@prisma/client");
const zone_service_1 = require("./zone.service");
const prisma = new client_1.PrismaClient();
/**
 * Ingere um novo flow na base de dados
 */
async function ingestFlow(payload) {
    const { userId, lat, lng, platform = "ifood", placeName = null, placeAddress = null } = payload;
    // Valida coordenadas
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Latitude e longitude inválidas");
    }
    // Obtém zona
    const zone = await (0, zone_service_1.getZoneFromPoint)(lat, lng);
    // Cria flow
    const flow = await prisma.flow.create({
        data: {
            userId,
            platform: platform,
            zone: zone.name,
            zoneId: zone.id,
            placeName,
            placeAddress,
            startedAt: new Date()
        }
    });
    // Incrementa demanda da zona
    await (0, zone_service_1.incrementZoneDemand)(zone.id);
    return {
        id: flow.id,
        userId: flow.userId,
        zone: flow.zone || "unknown",
        platform: flow.platform,
        placeName: flow.placeName,
        placeAddress: flow.placeAddress,
        startedAt: flow.startedAt,
        createdAt: flow.createdAt
    };
}
/**
 * Obtém flows recentes de uma zona
 */
async function getRecentFlows(zoneId, minutes = 30) {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    const flows = await prisma.flow.findMany({
        where: {
            zoneId,
            createdAt: { gte: since }
        },
        orderBy: { createdAt: "desc" },
        take: 500
    });
    return flows;
}
/**
 * Finaliza um flow
 */
async function finishFlow(flowId, durationMin, value, km) {
    await prisma.flow.update({
        where: { id: flowId },
        data: {
            finishedAt: new Date(),
            durationMin: durationMin || 0,
            value: value || 0,
            km: km || 0
        }
    });
}
exports.default = {
    ingestFlow,
    getRecentFlows,
    finishFlow
};
//# sourceMappingURL=flow.service.js.map