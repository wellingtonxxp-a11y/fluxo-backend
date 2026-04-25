"use strict";
/**
 * Serviço de Predição de Demanda
 * Realiza análise de intensidade, tendência e instrução com base em clusters
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictPickup = predictPickup;
exports.calculateTrendMomentum = calculateTrendMomentum;
function predictPickup(cluster) {
    // Score base normalizado (0-1)
    let score = Math.min(cluster.intensity / 100, 1);
    // Boost se há atividade recente
    if (cluster.recent > 5) {
        score += 0.2;
    }
    // Boost se há crescimento
    if (cluster.growth > 0) {
        score += 0.2;
    }
    // Cap em 1.0
    score = Math.min(score, 1);
    // Determina tendência
    let trend = "stable";
    if (cluster.growth > 2) {
        trend = "rising";
    }
    else if (cluster.growth < -2) {
        trend = "falling";
    }
    // Instrução baseada no score
    let instruction = "Aguardar";
    if (score > 0.8) {
        instruction = "Ir imediatamente";
    }
    else if (score > 0.6) {
        instruction = "Aproximar-se";
    }
    return {
        score,
        trend,
        instruction
    };
}
function calculateTrendMomentum(currentIntensity, previousIntensity) {
    if (!previousIntensity || previousIntensity === 0) {
        return 0;
    }
    return ((currentIntensity - previousIntensity) / previousIntensity) * 100;
}
exports.default = {
    predictPickup,
    calculateTrendMomentum
};
//# sourceMappingURL=prediction.service.js.map