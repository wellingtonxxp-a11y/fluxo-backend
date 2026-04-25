"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineDistance = haversineDistance;
exports.groupNearbyPoints = groupNearbyPoints;
exports.calculateDensityScore = calculateDensityScore;
exports.clusterHotspots = clusterHotspots;
function toRad(value) {
    return (value * Math.PI) / 180;
}
function haversineDistance(a, b) {
    const R = 6371000;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function groupNearbyPoints(points, maxDistance = 250) {
    const used = new Array(points.length).fill(false);
    const clusters = [];
    for (let i = 0; i < points.length; i += 1) {
        if (used[i])
            continue;
        used[i] = true;
        const clusterPoints = [points[i]];
        let center = { lat: points[i].lat, lng: points[i].lng };
        for (let j = i + 1; j < points.length; j += 1) {
            if (used[j])
                continue;
            if (haversineDistance(points[i], points[j]) <= maxDistance) {
                used[j] = true;
                clusterPoints.push(points[j]);
            }
        }
        const total = clusterPoints.length;
        const averageLat = clusterPoints.reduce((sum, item) => sum + item.lat, 0) / total;
        const averageLng = clusterPoints.reduce((sum, item) => sum + item.lng, 0) / total;
        center = { lat: averageLat, lng: averageLng };
        const radius = clusterPoints.reduce((max, item) => {
            const distance = haversineDistance({ lat: averageLat, lng: averageLng }, item);
            return Math.max(max, distance);
        }, 0);
        clusters.push({ points: clusterPoints, center, total, radius: Math.max(radius, 50) });
    }
    return clusters;
}
function calculateDensityScore(cluster) {
    const density = cluster.total / (Math.PI * Math.pow(cluster.radius / 2, 2) / 100000);
    return Math.round(Math.min(100, cluster.total * 12 + density * 6));
}
/**
 * Agrupa pontos em hotspots e calcula intensidade
 */
function clusterHotspots(flows) {
    if (!flows || flows.length === 0) {
        return [];
    }
    const clusters = [];
    flows.forEach((f) => {
        let found = false;
        for (let c of clusters) {
            const dist = Math.hypot(c.lat - f.lat, c.lng - f.lng);
            if (dist < 0.01) {
                c.intensity++;
                c.recent++;
                found = true;
                break;
            }
        }
        if (!found) {
            clusters.push({
                lat: f.lat,
                lng: f.lng,
                intensity: 1,
                recent: 1,
                growth: (Math.random() * 4 - 2) * 100, // -200 a 200 (em percentual)
                radius: 50
            });
        }
    });
    return clusters;
}
//# sourceMappingURL=cluster.util.js.map