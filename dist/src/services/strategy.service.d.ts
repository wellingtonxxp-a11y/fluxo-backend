/**
 * Serviço de Estratégia de Trabalho
 * Gerencia sessões e estratégias de trabalho dos usuários
 */
export interface StrategySessionData {
    id: number;
    userId: number;
    status: string;
    totalDistance: number;
    totalTimeMin: number;
    totalScore: number;
    startedAt: Date;
    endedAt: Date | null;
}
/**
 * Inicia uma sessão de estratégia
 */
export declare function startStrategy(userId: number): Promise<StrategySessionData>;
/**
 * Atualiza uma sessão de estratégia
 */
export declare function updateStrategy(sessionId: number, data: {
    totalDistance?: number;
    totalTimeMin?: number;
    totalScore?: number;
}): Promise<StrategySessionData>;
/**
 * Finaliza uma sessão de estratégia
 */
export declare function endStrategy(sessionId: number): Promise<StrategySessionData>;
/**
 * Obtém sessão ativa de um usuário
 */
export declare function getActiveStrategy(userId: number): Promise<StrategySessionData | null>;
declare const _default: {
    startStrategy: typeof startStrategy;
    updateStrategy: typeof updateStrategy;
    endStrategy: typeof endStrategy;
    getActiveStrategy: typeof getActiveStrategy;
};
export default _default;
//# sourceMappingURL=strategy.service.d.ts.map