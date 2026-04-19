const prisma = require("../../../prisma");
const { getZoneFromPoint } = require("../../services/zone.service");
const { groupNearbyPoints, calculateDensityScore, haversineDistance } = require("../../utils/cluster.util");

function normalizeIntensity(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function clusterFeedbackBoost(cluster: any, feedbacks: any[]) {
  const radius = Math.max(cluster.radius, 120);
  const nearbyFeedback = feedbacks.filter((feedback) => {
    const distance = haversineDistance(
      { lat: feedback.latitude, lng: feedback.longitude },
      cluster.center
    );
    return distance <= radius;
  });

  if (!nearbyFeedback.length) return 1;

  const totalWeight = nearbyFeedback.reduce((sum, item) => sum + item.weight, 0);
  return 1 + Math.min(0.75, totalWeight / 20);
}

async function getCopilot(lat: number, lng: number) {
  const zone = await getZoneFromPoint(lat, lng);
  const since = new Date(Date.now() - 30 * 60 * 1000);

  const flows = await prisma.flow.findMany({
    where: {
      zoneId: zone.id,
      latitude: { not: null },
      longitude: { not: null },
      createdAt: { gte: since }
    },
    orderBy: { createdAt: "desc" },
    take: 500
  });

  const feedbacks = await prisma.hotspotFeedback.findMany({
    where: {
      zoneId: zone.id,
      createdAt: { gte: since }
    }
  });

  const clusters = groupNearbyPoints(
    flows.map((flow) => ({ lat: flow.latitude, lng: flow.longitude, flowId: flow.id })),
    200
  );

  const hotspots = clusters
    .map((cluster) => {
      const score = calculateDensityScore(cluster) * clusterFeedbackBoost(cluster, feedbacks);
      return {
        lat: cluster.center.lat,
        lng: cluster.center.lng,
        intensity: normalizeIntensity(score),
        cluster
      };
    })
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 8)
    .map(({ lat, lng, intensity }) => ({ lat, lng, intensity }));

  const zones = await prisma.zone.findMany({ orderBy: { demand: "desc" }, take: 5 });

  return {
    hotspots,
    zones: zones.map((item) => ({ id: item.id, name: item.name, demand: item.demand }))
  };
}

export default { getCopilot };
