const prisma = require("../../prisma");

async function getDashboard() {
  const flows = await prisma.flow.findMany();

  if (!flows.length) {
    return { recommendation: null, zones: [] };
  }

  // lógica simplificada (mantém estabilidade)
  const zones = {};

  flows.forEach(f => {
    if (!zones[f.zone]) zones[f.zone] = [];
    zones[f.zone].push(f);
  });

  const result = Object.entries(zones).map(([zone, list]) => {
    const total = list.length;

    const avgValue =
      list.reduce((s, f) => s + (f.value || 0), 0) / total;

    return {
      zone,
      score: Math.round(avgValue),
      trend: "neutro"
    };
  });

  result.sort((a, b) => b.score - a.score);

  return {
    recommendation: result[0],
    zones: result
  };
}

module.exports = { getDashboard };
