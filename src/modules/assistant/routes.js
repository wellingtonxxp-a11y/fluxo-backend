const express = require("express");
const router = express.Router();

const prisma = require("../../../prisma");
const auth = require("../../middlewares/auth");

// =============================
// ASSISTENTE DE DECISÃO
// =============================
router.get("/assistant", auth, async (req, res) => {
  try {

    const flows = await prisma.flow.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000)
        }
      }
    });

    if (flows.length === 0) {
      return res.json({
        action: "aguardar",
        reason: "Sem dados suficientes",
        confidence: "baixa"
      });
    }

    // agrupar por zona
    const zones = {};

    flows.forEach(f => {
      const zone = f.zone;

      if (!zones[zone]) {
        zones[zone] = [];
      }

      const vpm = (f.value || 0) / Math.max(f.durationMin || 1, 1);
      zones[zone].push({
        vpm,
        createdAt: f.createdAt
      });
    });

    const now = Date.now();

    function analyzeZone(zoneFlows) {

      let recent = [];
      let past = [];

      zoneFlows.forEach(f => {
        const diff = now - new Date(f.createdAt).getTime();

        if (diff <= 30 * 60 * 1000) {
          recent.push(f.vpm);
        } else {
          past.push(f.vpm);
        }
      });

      const avg = arr =>
        arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;

      const recentAvg = avg(recent);
      const pastAvg = avg(past);

      let trend = "neutro";
      if (recentAvg > pastAvg * 1.1) trend = "subindo";
      if (recentAvg < pastAvg * 0.9) trend = "caindo";

      const confidence =
        zoneFlows.length > 8 ? "alta" :
        zoneFlows.length > 4 ? "media" : "baixa";

      const score =
        recentAvg * 0.6 +
        (trend === "subindo" ? 1 : trend === "caindo" ? -1 : 0) * 0.2 +
        (zoneFlows.length / 10) * 0.2;

      return {
        recentAvg,
        trend,
        confidence,
        score,
        expected: recentAvg * 60
      };
    }

    // calcular todas zonas
    const analyzed = Object.entries(zones).map(([zone, data]) => {
      const calc = analyzeZone(data);
      return { zone, ...calc };
    });

    // ordenar melhor zona
    analyzed.sort((a,b) => b.score - a.score);

    const best = analyzed[0];

    // decisão
    let action = "aguardar";
    let reason = "mercado fraco";

    if (best.score > 1) {
      action = "ir_agora";
      reason = "alta rentabilidade";
    }

    if (best.trend === "subindo") {
      reason += " + tendência subindo";
    }

    res.json({
      zone: best.zone,
      action,
      reason,
      confidence: best.confidence,
      expected_hourly: Number(best.expected.toFixed(2))
    });

  } catch {
    res.status(500).json({ error: "Erro assistant" });
  }
});

module.exports = router;