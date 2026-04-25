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
export declare function predictPickup(cluster: ClusterData): PredictionResult;
export declare function calculateTrendMomentum(currentIntensity: number, previousIntensity: number): number;
declare const _default: {
    predictPickup: typeof predictPickup;
    calculateTrendMomentum: typeof calculateTrendMomentum;
};
export default _default;
//# sourceMappingURL=prediction.service.d.ts.map