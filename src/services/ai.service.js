function getUserPerformance(flows) {
  if (!flows || flows.length === 0) return [];

  const map = {};

  flows.forEach(f => {
    const key = f.zone || "unknown";

    if (!map[key]) {
      map[key] = {
        total: 0,
        totalValue: 0,
        totalTime: 0
      };
    }

    map[key].total++;
    map[key].totalValue += f.value || 0;
    map[key].totalTime += f.durationMin || 1;
  });

  return Object.entries(map).map(([zone, data]) => {
    const vpm = data.totalValue / Math.max(data.totalTime, 1);

    return {
      zone,
      valuePerMin: Number(vpm.toFixed(2)),
      total: data.total
    };
  });
}

// ================= TEMPO =================
function getTimeFactor() {
  const hour = new Date().getHours();

  if (hour >= 11 && hour <= 14) return 1.2; // almoço
  if (hour >= 18 && hour <= 22) return 1.3; // jantar
  if (hour >= 0 && hour <= 5) return 0.6;  // madrugada

  return 1;
}

// ================= IA PERSONALIZADA =================
function rankClustersForUser(clusters, userPerf) {
  const timeFactor = getTimeFactor();

  return clusters.map(c => {

    // fallback inteligente se não houver zona
    let perf = null;

    if (c.zone) {
      perf = userPerf.find(p => p.zone === c.zone);
    }

    const personalBoost = perf ? perf.valuePerMin : 0.6;

    // 🔥 pesos calibrados (mais equilibrado)
    const finalScore =
      (c.score * 0.4) +
      (c.predicted * 0.4) +
      (personalBoost * 15 * 0.2);

    return {
      ...c,
      personalScore: Math.round(finalScore * timeFactor)
    };
  });
}

module.exports = {
  getUserPerformance,
  rankClustersForUser
};