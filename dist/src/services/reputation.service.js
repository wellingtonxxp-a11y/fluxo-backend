"use strict";
/**
 * Serviço de Reputação e Antifraude
 * Calcula pesos de reputação e detecção de fraudes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateWeight = calculateWeight;
exports.getUserReputation = getUserReputation;
exports.updateReputationScore = updateReputationScore;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const FEEDBACK_SCORE = {
    GOOD: 3,
    BAD: -2,
    DANGER: -4,
    TRAFFIC: 1,
    HIGH: 2
};
/**
 * Obtém ou cria reputação de um usuário
 */
async function getOrCreateReputation(userId) {
    let reputation = await prisma.userReputation.findUnique({
        where: { userId }
    });
    if (!reputation) {
        reputation = await prisma.userReputation.create({
            data: {
                userId,
                score: 0,
                feedbackCount: 0
            }
        });
    }
    return reputation;
}
/**
 * Calcula o peso da reputação
 */
function reputationWeight(reputation) {
    const base = Math.min(2, Math.max(0.5, 1 + reputation.score / 100));
    return base;
}
/**
 * Calcula o nível de risco baseado no score
 */
function calculateRiskLevel(score) {
    if (score > 50)
        return "low";
    if (score > -50)
        return "medium";
    return "high";
}
/**
 * Calcula o peso de um usuário (legacy support)
 */
function calculateWeight(user) {
    let weight = 1;
    if (user.reputation && user.reputation > 80) {
        weight += 0.5;
    }
    if (user.reportsSpam && user.reportsSpam > 5) {
        weight -= 0.5;
    }
    return Math.max(0, weight);
}
/**
 * Obtém reputação completa de um usuário
 */
async function getUserReputation(userId) {
    const reputation = await getOrCreateReputation(userId);
    const weight = reputationWeight(reputation);
    const riskLevel = calculateRiskLevel(reputation.score);
    return {
        score: reputation.score,
        weight,
        riskLevel,
        feedbackCount: reputation.feedbackCount
    };
}
/**
 * Atualiza reputação baseado em feedback
 */
async function updateReputation(userId, type, weight) {
    const reputation = await getOrCreateReputation(userId);
    const delta = (FEEDBACK_SCORE[type] ?? 0) * (weight / 10);
    const nextScore = Math.max(-100, Math.min(100, reputation.score + delta));
    return prisma.userReputation.update({
        where: { userId },
        data: {
            score: nextScore,
            feedbackCount: reputation.feedbackCount + 1
        }
    });
}
/**
 * Atualiza score de reputação diretamente
 */
async function updateReputationScore(userId, delta) {
    const existing = await getOrCreateReputation(userId);
    await prisma.userReputation.update({
        where: { userId },
        data: {
            score: Math.max(-100, Math.min(100, existing.score + delta)),
            feedbackCount: { increment: 1 }
        }
    });
}
exports.default = {
    getOrCreateReputation,
    reputationWeight,
    updateReputation,
    updateReputationScore,
    getUserReputation,
    calculateWeight,
    calculateRiskLevel,
    FEEDBACK_SCORE
};
//# sourceMappingURL=reputation.service.js.map