"use strict";
const express = require("express");
const router = express.Router();
const prisma = require("../../../prisma");
const auth = require("../../middlewares/auth");
// ==============================
// PREVISÃO EM TEMPO REAL
// ==============================
router.get("/prediction", auth, async (req, res) => {
    try {
        // últimos 60 minutos
        const flows = await prisma.flow.findMany({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 60 * 60 * 1000)
                }
            }
        });
        if (flows.length === 0) {
            return res.json({
                prediction: 0,
                trend: "neutro",
                confidence: "baixa"
            });
        }
        const now = Date.now();
        let recent = [];
        let past = [];
        flows.forEach(f => {
            const diff = now - new Date(f.createdAt).getTime();
            const vpm = (f.value || 0) / Math.max(f.durationMin || 1, 1);
            if (diff <= 30 * 60 * 1000) {
                recent.push(vpm);
            }
            else {
                past.push(vpm);
            }
        });
        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const recentAvg = avg(recent);
        const pastAvg = avg(past);
        // tendência
        let trend = "neutro";
        if (recentAvg > pastAvg * 1.1)
            trend = "subindo";
        if (recentAvg < pastAvg * 0.9)
            trend = "caindo";
        // confiança
        let confidence = flows.length > 10 ? "alta" :
            flows.length > 5 ? "media" : "baixa";
        // fator tendência
        const trendFactor = trend === "subindo" ? 1.15 :
            trend === "caindo" ? 0.85 : 1;
        // previsão (por hora)
        const prediction = recentAvg * 60 * trendFactor;
        res.json({
            prediction: Number(prediction.toFixed(2)),
            trend,
            confidence,
            base: Number(recentAvg.toFixed(2))
        });
    }
    catch (e) {
        res.status(500).json({ error: "Erro prediction" });
    }
});
module.exports = router;
//# sourceMappingURL=routes.js.map