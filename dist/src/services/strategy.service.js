"use strict";
/**
 * Serviço de Estratégia de Trabalho
 * Gerencia sessões e estratégias de trabalho dos usuários
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.startStrategy = startStrategy;
exports.updateStrategy = updateStrategy;
exports.endStrategy = endStrategy;
exports.getActiveStrategy = getActiveStrategy;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Inicia uma sessão de estratégia
 */
async function startStrategy(userId) {
    const session = await prisma.strategySession.create({
        data: {
            userId,
            status: "ACTIVE",
            startedAt: new Date()
        }
    });
    return {
        id: session.id,
        userId: session.userId,
        status: session.status,
        totalDistance: session.totalDistance,
        totalTimeMin: session.totalTimeMin,
        totalScore: session.totalScore,
        startedAt: session.startedAt,
        endedAt: session.endedAt
    };
}
/**
 * Atualiza uma sessão de estratégia
 */
async function updateStrategy(sessionId, data) {
    const session = await prisma.strategySession.update({
        where: { id: sessionId },
        data: {
            totalDistance: data.totalDistance,
            totalTimeMin: data.totalTimeMin,
            totalScore: data.totalScore,
            updatedAt: new Date()
        }
    });
    return {
        id: session.id,
        userId: session.userId,
        status: session.status,
        totalDistance: session.totalDistance,
        totalTimeMin: session.totalTimeMin,
        totalScore: session.totalScore,
        startedAt: session.startedAt,
        endedAt: session.endedAt
    };
}
/**
 * Finaliza uma sessão de estratégia
 */
async function endStrategy(sessionId) {
    const session = await prisma.strategySession.update({
        where: { id: sessionId },
        data: {
            status: "COMPLETED",
            endedAt: new Date(),
            updatedAt: new Date()
        }
    });
    return {
        id: session.id,
        userId: session.userId,
        status: session.status,
        totalDistance: session.totalDistance,
        totalTimeMin: session.totalTimeMin,
        totalScore: session.totalScore,
        startedAt: session.startedAt,
        endedAt: session.endedAt
    };
}
/**
 * Obtém sessão ativa de um usuário
 */
async function getActiveStrategy(userId) {
    const session = await prisma.strategySession.findFirst({
        where: {
            userId,
            status: "ACTIVE"
        }
    });
    if (!session)
        return null;
    return {
        id: session.id,
        userId: session.userId,
        status: session.status,
        totalDistance: session.totalDistance,
        totalTimeMin: session.totalTimeMin,
        totalScore: session.totalScore,
        startedAt: session.startedAt,
        endedAt: session.endedAt
    };
}
exports.default = {
    startStrategy,
    updateStrategy,
    endStrategy,
    getActiveStrategy
};
//# sourceMappingURL=strategy.service.js.map