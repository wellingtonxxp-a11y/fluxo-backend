const prisma = require("../../config/prisma");

async function getRealtimeRecommendation(userId) {

  // últimos 60 minutos
  const flows = await prisma.flow.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000)
      }
    }
  });

  const zones = {};

  for (const f of flows) {

    if (!zones[f.zone]) {
      zones[f.zone] = {
        total: 0,
        value: 0,
        time: 0
      };
    }

    zones[f.zone].total += 1;
    zones[f.zone].value += f.value || 0;
    zones[f.zone].time += f.durationMin || 1;
  }

  let bestZone = null;
  let bestScore = 0;

  for (const zone in zones) {

    const z = zones[zone];

    const valuePerMin = z.value / z.time;
    const demand = z.total;

    const score =
      (valuePerMin * 0.6) +
      (demand * 0.4);

    if (score > bestScore) {
      bestScore = score;
      bestZone = zone;
    }
  }

  return {
    best_zone: bestZone,
    score: bestScore.toFixed(2),
    zones
  };
}

module.exports = { getRealtimeRecommendation };