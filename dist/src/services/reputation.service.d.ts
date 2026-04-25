/**
 * Serviço de Reputação e Antifraude
 * Calcula pesos de reputação e detecção de fraudes
 */
export interface UserReputation {
    score: number;
    weight: number;
    riskLevel: "low" | "medium" | "high";
    feedbackCount: number;
}
/**
 * Obtém ou cria reputação de um usuário
 */
declare function getOrCreateReputation(userId: number): Promise<any>;
/**
 * Calcula o peso da reputação
 */
declare function reputationWeight(reputation: any): number;
/**
 * Calcula o nível de risco baseado no score
 */
declare function calculateRiskLevel(score: number): "low" | "medium" | "high";
/**
 * Calcula o peso de um usuário (legacy support)
 */
export declare function calculateWeight(user: any): number;
/**
 * Obtém reputação completa de um usuário
 */
export declare function getUserReputation(userId: number): Promise<UserReputation>;
/**
 * Atualiza reputação baseado em feedback
 */
declare function updateReputation(userId: number, type: string, weight: number): Promise<any>;
/**
 * Atualiza score de reputação diretamente
 */
export declare function updateReputationScore(userId: number, delta: number): Promise<void>;
declare const _default: {
    getOrCreateReputation: typeof getOrCreateReputation;
    reputationWeight: typeof reputationWeight;
    updateReputation: typeof updateReputation;
    updateReputationScore: typeof updateReputationScore;
    getUserReputation: typeof getUserReputation;
    calculateWeight: typeof calculateWeight;
    calculateRiskLevel: typeof calculateRiskLevel;
    FEEDBACK_SCORE: {
        readonly GOOD: 3;
        readonly BAD: -2;
        readonly DANGER: -4;
        readonly TRAFFIC: 1;
        readonly HIGH: 2;
    };
};
export default _default;
//# sourceMappingURL=reputation.service.d.ts.map