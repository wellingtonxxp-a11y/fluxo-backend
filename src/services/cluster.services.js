function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;

  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
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
    if (!flow.latitude || !flow.longitude) continue;

    let added = false;

    for (const cluster of clusters) {
      const dist = distanceInMeters(
        flow.latitude,
        flow.longitude,
        cluster.center.lat,
        cluster.center.lng
      );

      if (dist <= radius) {
        cluster.points.push(flow);

        // atualização incremental mais estável
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
        zone: flow.zone || null // 🔥 importante pra IA depois
      });
    }
  }

  return clusters;
}

// ================= SCORE =================
function scoreCluster(cluster) {
  const points = cluster.points;

  const now = Date.now();

  const total = points.length;

  const recent = points.filter(
    p => now - new Date(p.createdAt).getTime() < 10 * 60 * 1000
  ).length;

  const values = points.map(p => p.value || 0);
  const avgValue =
    values.reduce((acc, v) => acc + v, 0) / Math.max(total, 1);

  // 🔥 densidade por tempo (ritmo real)
  const oldest = Math.min(...points.map(p => new Date(p.createdAt).getTime()));
  const minutes = Math.max((now - oldest) / 60000, 1);

  const density = total / minutes;

  // 🔥 score mais inteligente
  const score =
    total * 0.4 +
    recent * 0.3 +
    avgValue * 0.2 +
    density * 0.1;

  return {
    total,
    recent,
    avgValue,
    density,
    score: Math.round(score)
  };
}

module.exports = {
  clusterFlows,
  scoreCluster
};