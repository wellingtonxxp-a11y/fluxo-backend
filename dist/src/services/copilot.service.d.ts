/**
 * Serviço de Copiloto IA
 * Core do sistema - retorna hotspots, tendências e instruções
 */
export interface Hotspot {
    lat: number;
    lng: number;
    intensity: number;
    predicted: number;
    trend: "rising" | "stable" | "falling";
    instruction: string;
}
export interface CopilotResponse {
    hotspots: Hotspot[];
    zones: Array<{
        id: number;
        name: string;
        demand: number;
    }>;
}
/**
 * Obtém análise de copiloto com hotspots e instrucões
 */
export declare function getCopilot(lat: number, lng: number): Promise<CopilotResponse>;
/**
 * Obtém feedback com hotspots baseado em feedback dos usuários
 */
export declare function getCopilotWithFeedback(lat: number, lng: number): Promise<CopilotResponse>;
declare const _default: {
    getCopilot: typeof getCopilot;
    getCopilotWithFeedback: typeof getCopilotWithFeedback;
};
export default _default;
//# sourceMappingURL=copilot.service.d.ts.map