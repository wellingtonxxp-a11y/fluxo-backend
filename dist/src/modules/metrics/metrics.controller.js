"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma = require("../../../prisma");
async function getMetrics(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Usuário não autenticado" });
        }
        const sessions = await prisma.strategySession.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
        const totalTime = sessions.reduce((sum, session) => sum + (session.totalTimeMin || 0), 0);
        const totalScore = sessions.reduce((sum, session) => sum + (session.totalScore || 0), 0);
        const averageScore = sessions.length ? totalScore / sessions.length : 0;
        const efficiency = totalTime ? totalScore / totalTime : 0;
        const performance = sessions.map((session) => ({
            id: session.id,
            status: session.status,
            totalDistance: session.totalDistance,
            totalTimeMin: session.totalTimeMin,
            totalScore: session.totalScore,
            efficiency: session.totalTimeMin ? session.totalScore / session.totalTimeMin : 0,
            startedAt: session.startedAt,
            endedAt: session.endedAt
        }));
        return res.json({
            success: true,
            data: {
                performance,
                totalTime,
                averageScore,
                efficiency
            }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message || "Falha ao carregar métricas" });
    }
}
exports.default = { getMetrics };
//# sourceMappingURL=metrics.controller.js.map