function getUserPerformance(flows) {
  const map = {};

  flows.forEach(f => {
    if (!map[f.zone]) {
      map[f.zone] = {
        total: 0,
        totalValue: 0,
        totalTime: 0
      };
    }

    map[f.zone].total++;
    map[f.zone].totalValue += f.value || 0;
    map[f.zone].totalTime += f.durationMin || 1;
  });

  return Object.entries(map).map(([zone, data]) => {
    const vpm = data.totalValue / data.totalTime;

    return {
      zone,
      valuePerMin: vpm,
      total: data.total
    };
  });
}

function getTimeFactor() {
  const hour = new Date().getHours();

  // heurística simples
  if (hour >= 11 && hour <= 14) return 1.2; // almoço
  if (hour >= 18 && hour <= 22) return 1.3; // jantar
  if (hour >= 0 && hour <= 5) return 0.6;  // madrugada

  return 1;
}

function rankClustersForUser(clusters, userPerf) {
  const timeFactor = getTimeFactor();

  return clusters.map(c => {

    const perf = userPerf.find(p => p.zone === c.zone);

    const personalBoost = perf ? perf.valuePerMin : 0.5;

    const finalScore =
      c.score * 0.5 +
      c.predicted * 0.3 +
      personalBoost * 20 * 0.2;

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