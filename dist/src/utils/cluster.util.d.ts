export interface ClusterPoint {
    lat: number;
    lng: number;
    flowId?: number;
}
export interface Cluster {
    points: ClusterPoint[];
    center: {
        lat: number;
        lng: number;
    };
    total: number;
    radius: number;
}
export interface HotspotCluster {
    lat: number;
    lng: number;
    intensity: number;
    recent: number;
    growth: number;
    radius: number;
}
export declare function haversineDistance(a: ClusterPoint, b: ClusterPoint): number;
export declare function groupNearbyPoints(points: ClusterPoint[], maxDistance?: number): Cluster[];
export declare function calculateDensityScore(cluster: Cluster): number;
/**
 * Agrupa pontos em hotspots e calcula intensidade
 */
export declare function clusterHotspots(flows: ClusterPoint[]): HotspotCluster[];
//# sourceMappingURL=cluster.util.d.ts.map