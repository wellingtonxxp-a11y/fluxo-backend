/**
 * Serviço de Flows (Trajetos)
 * Gerencia criação, atualização e consulta de trajetos de usuários
 */
export interface CreateFlowDto {
    userId: number;
    lat: number;
    lng: number;
    platform?: string;
    placeName?: string;
    placeAddress?: string;
}
export interface FlowData {
    id: number;
    userId: number;
    zone: string;
    platform: string;
    placeName: string | null;
    placeAddress: string | null;
    startedAt: Date;
    createdAt: Date;
}
/**
 * Ingere um novo flow na base de dados
 */
export declare function ingestFlow(payload: CreateFlowDto): Promise<FlowData>;
/**
 * Obtém flows recentes de uma zona
 */
export declare function getRecentFlows(zoneId: number, minutes?: number): Promise<any[]>;
/**
 * Finaliza um flow
 */
export declare function finishFlow(flowId: number, durationMin: number, value: number, km: number): Promise<void>;
declare const _default: {
    ingestFlow: typeof ingestFlow;
    getRecentFlows: typeof getRecentFlows;
    finishFlow: typeof finishFlow;
};
export default _default;
//# sourceMappingURL=flow.service.d.ts.map