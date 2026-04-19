const express = require("express");
const router = express.Router();

const prisma = require("../../../prisma");
const auth = require("../../middlewares/auth");

const {
  clusterFlows,
  scoreCluster,
  predictCluster
} = require("../../services/cluster.services");

const { getHotspotPlace } = require("../../services/places.services");
const { generateInstruction } = require("../../services/decision.service");

// ================= COPILOT MULTI HOTSPOTS =================
router.get("/", auth, async (req, res) => {
  try {

    // ================= 1. FLOWS =================
    const flows = await prisma.flow.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000)
        }
      }
    });

    const validFlows = flows.filter(f => f.latitude && f.longitude);

    if (validFlows.length === 0) {
      return res.json({ zones: [] });
    }

    // ================= 2. CLUSTERS =================
    const clusters = clusterFlows(validFlows, 200);

    // ================= 3. ENRIQUECER =================
    const enriched = clusters.map(c => {
      const metrics = scoreCluster(c);
      const prediction = predictCluster(c);

      return {
        ...c,
        ...metrics,
        ...prediction
      };
    });

    // ================= 4. AGRUPAR POR ZONA =================
    const zonesMap = {};

    enriched.forEach(c => {
      const zone = c.zone || "unknown";

      if (!zonesMap[zone]) {
        zonesMap[zone] = [];
      }

      zonesMap[zone].push(c);
    });

    // ================= 5. PROCESSAR CADA ZONA =================
    const zonesResult = [];

    for (const [zone, clusterList] of Object.entries(zonesMap)) {

      // ordenar por score
      clusterList.sort((a, b) => b.score - a.score);

      // pegar TOP 3
      const topClusters = clusterList.slice(0, 3);

      const hotspots = [];

      for (const cluster of topClusters) {

        const { lat, lng } = cluster.center;

        const place = await getHotspotPlace(lat, lng);

        const instruction = generateInstruction(cluster, place);

        hotspots.push({
          name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,

          score: cluster.score,
          predicted: cluster.predicted,
          trend: cluster.trend,
          flows: cluster.total,
          recent: cluster.recent,

          instruction
        });
      }

      zonesResult.push({
        zone,
        hotspots
      });
    }

    // ================= 6. RESPONSE =================
    res.json({
      zones: zonesResult
    });

  } catch (err) {
    console.error("COPILOT ERROR:", err);
    res.status(500).json({ error: "Erro copiloto" });
  }
});

module.exports = router;