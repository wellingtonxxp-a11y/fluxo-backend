/**
 * Grid Service - Simple spatial grid system
 * Defines cells with id, center lat/lng, base score
 */
export interface Cell {
    id: string;
    lat: number;
    lng: number;
    baseScore: number;
}
/**
 * Get all cells
 */
export declare function getAllCells(): Cell[];
/**
 * Get nearby cells within radius (in degrees, approx 1 degree ~ 111km)
 */
export declare function getNearbyCells(lat: number, lng: number, radiusDegrees?: number): Cell[];
/**
 * Get cell neighbors (adjacent cells)
 */
export declare function getNeighbors(cellId: string): Cell[];
//# sourceMappingURL=gridService.d.ts.map