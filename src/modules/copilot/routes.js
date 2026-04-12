const express = require("express");
const router = express.Router();

const prisma = require("../../../prisma");
const auth = require("../../middlewares/auth");

const { clusterFlows, scoreCluster, predictCluster } = require("../../services/cluster.service");
const { getHotspotPlace } = require("../../services/places.service");
const { getUserPerformance, rankClustersForUser } = require("../../services/ai.service");
const { generateInstruction } = require("../../services/decision.service");

// ================= COPILOT =================
router.get("/", auth, async (req, res) => {
  try {

    // ================= 1. FLOWS MERCADO =================
    const flows = await prisma.flow.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000)
        }
      }
    });

    const validFlows = flows.filter(f => f.latitude && f.longitude);

    if (validFlows.length === 0) {
      return res.json({ best_hotspot: null, instruction: null });
    }

    // ================= 2. CLUSTERS =================
    const clusters = clusterFlows(validFlows, 200);

    // ================= 3. SCORE + PREVISÃO =================
    const enriched = clusters.map(c => {
      const metrics = scoreCluster(c);
      const prediction = predictCluster(c);

      return {
        ...c,
        ...metrics,
        ...prediction
      };
    });

    // ================= 4. DADOS DO USUÁRIO =================
    const userFlows = await prisma.flow.findMany({
      where: { userId: req.user.id }
    });

    const userPerf = getUserPerformance(userFlows);

    // ================= 5. IA PERSONALIZADA =================
    const personalized = rankClustersForUser(enriched, userPerf);

    personalized.sort((a, b) => b.personalScore - a.personalScore);

    const best = personalized[0];

    if (!best) {
      return res.json({ best_hotspot: null, instruction: null });
    }

    // ================= 6. PLACE =================
    const { lat, lng } = best.center;

    const place = await getHotspotPlace(lat, lng);

    // ================= 7. DECISÃO =================
    const instruction = generateInstruction(best, place);

    // ================= 8. RESPONSE FINAL =================
    res.json({
      best_hotspot: {
        ...place,
        score: best.score,
        personal_score: best.personalScore,
        predicted: best.predicted,
        trend: best.trend,
        flows: best.total
      },
      instruction
    });

  } catch (err) {
    console.error("COPILOT ERROR:", err);
    res.status(500).json({ error: "Erro copiloto" });
  }
});

module.exports = router;