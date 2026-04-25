export function clusterFlows(flows: any, radius?: number): {
    center: {
        lat: any;
        lng: any;
    };
    points: any[];
    zone: any;
}[];
export function scoreCluster(cluster: any): {
    total: any;
    recent: any;
    past: any;
    avgValue: number;
    density: number;
    trend: string;
    acceleration: number;
    predicted: number;
    score: number;
};
//# sourceMappingURL=cluster.services.d.ts.map