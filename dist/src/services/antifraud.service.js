"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma = require("../../prisma");
const blockedUsers = new Map();
async function checkFeedbackAllowed(userId) {
    const blockedUntil = blockedUsers.get(userId);
    if (blockedUntil && blockedUntil > new Date()) {
        return { allowed: false, reason: "Usuário temporariamente bloqueado por envio repetido" };
    }
    const windowStart = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await prisma.hotspotFeedback.count({
        where: {
            userId,
            createdAt: { gte: windowStart }
        }
    });
    if (recentCount >= 8) {
        blockedUsers.set(userId, new Date(Date.now() + 5 * 60 * 1000));
        return { allowed: false, reason: "Excesso de feedback detectado" };
    }
    const weightFactor = recentCount >= 4 ? 0.5 : 1;
    return { allowed: true, weightFactor };
}
exports.default = { checkFeedbackAllowed };
//# sourceMappingURL=antifraud.service.js.map