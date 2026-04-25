export function getDashboard(): Promise<{
    recommendation: null;
    zones: never[];
} | {
    recommendation: {
        zone: string;
        score: number;
        trend: string;
    };
    zones: {
        zone: string;
        score: number;
        trend: string;
    }[];
}>;
//# sourceMappingURL=service.d.ts.map