/**
 * Serviço de Predição de Demanda
 * Realiza análise de intensidade, tendência e instrução com base em clusters
 */

interface PredictionResult {
  score: number;
  trend: "rising" | "stable" | "falling";
  instruction: string;
}

export interface ClusterData {
  intensity: number;
  recent: number;
  growth: number;
  radius?: number;
}

export function predictPickup(cluster: ClusterData): PredictionResult {
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
  let trend: "rising" | "stable" | "falling" = "stable";
  if (cluster.growth > 2) {
    trend = "rising";
  } else if (cluster.growth < -2) {
    trend = "falling";
  }

  // Instrução baseada no score
  let instruction = "Aguardar";
  if (score > 0.8) {
    instruction = "Ir imediatamente";
  } else if (score > 0.6) {
    instruction = "Aproximar-se";
  }

  return {
    score,
    trend,
    instruction
  };
}

export function calculateTrendMomentum(currentIntensity: number, previousIntensity: number): number {
  if (!previousIntensity || previousIntensity === 0) {
    return 0;
  }
  return ((currentIntensity - previousIntensity) / previousIntensity) * 100;
}

export default {
  predictPickup,
  calculateTrendMomentum
};
