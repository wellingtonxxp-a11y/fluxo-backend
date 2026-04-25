"use strict";
function distanceInMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
// ================= CLUSTER =================
function clusterFlows(flows, radius = 200) {
    const clusters = [];
    for (const flow of flows) {
        if (!flow.latitude || !flow.longitude)
            continue;
        let added = false;
        for (const cluster of clusters) {
            const dist = distanceInMeters(flow.latitude, flow.longitude, cluster.center.lat, cluster.center.lng);
            if (dist <= radius) {
                cluster.points.push(flow);
                const total = cluster.points.length;
                cluster.center.lat =
                    cluster.center.lat + (flow.latitude - cluster.center.lat) / total;
                cluster.center.lng =
                    cluster.center.lng + (flow.longitude - cluster.center.lng) / total;
                added = true;
                break;
            }
        }
        if (!added) {
            clusters.push({
                center: {
                    lat: flow.latitude,
                    lng: flow.longitude
                },
                points: [flow],
                zone: flow.zone || null
            });
        }
    }
    return clusters;
}
// ================= SCORE + IA =================
function scoreCluster(cluster) {
    const points = cluster.points;
    const now = Date.now();
    const total = points.length;
    const recentPoints = points.filter(p => now - new Date(p.createdAt).getTime() < 10 * 60 * 1000);
    const pastPoints = points.filter(p => {
        const t = new Date(p.createdAt).getTime();
        return t >= now - 20 * 60 * 1000 && t < now - 10 * 60 * 1000;
    });
    const recent = recentPoints.length;
    const past = pastPoints.length;
    const values = points.map(p => p.value || 0);
    const avgValue = values.reduce((acc, v) => acc + v, 0) / Math.max(total, 1);
    const oldest = Math.min(...points.map(p => new Date(p.createdAt).getTime()));
    const minutes = Math.max((now - oldest) / 60000, 1);
    const density = total / minutes;
    // ================= TREND =================
    let trend = "stable";
    if (recent > past * 1.2)
        trend = "rising";
    else if (recent < past * 0.8)
        trend = "falling";
    // ================= ACCELERATION =================
    const acceleration = recent - past;
    // ================= PREVISÃO =================
    const predicted = recent * 0.6 +
        density * 2 +
        (trend === "rising" ? 2 : trend === "falling" ? -1 : 0);
    // ================= SCORE FINAL =================
    const score = total * 0.3 +
        recent * 0.3 +
        avgValue * 0.2 +
        density * 0.2;
    return {
        total,
        recent,
        past,
        avgValue,
        density,
        trend,
        acceleration,
        predicted: Math.max(0, Number(predicted.toFixed(2))),
        score: Math.round(score)
    };
}
module.exports = {
    clusterFlows,
    scoreCluster
};
//# sourceMappingURL=cluster.services.js.map