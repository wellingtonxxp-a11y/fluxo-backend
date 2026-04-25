"use strict";
/**
 * Smoothing Module - Apply spatial smoothing to cell scores
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.smoothScores = smoothScores;
const gridService_1 = require("../modules/gridService");
/**
 * Apply smoothing: average each cell's score with its neighbors
 */
function smoothScores(scoredCells) {
    // Create a map for quick lookup
    const scoreMap = new Map();
    scoredCells.forEach(cell => scoreMap.set(cell.id, cell.score));
    return scoredCells.map(cell => {
        const neighbors = (0, gridService_1.getNeighbors)(cell.id);
        const neighborScores = [];
        neighbors.forEach(neighbor => {
            const neighborScore = scoreMap.get(neighbor.id);
            if (neighborScore !== undefined) {
                neighborScores.push(neighborScore);
            }
        });
        if (neighborScores.length === 0) {
            return { ...cell }; // No neighbors, keep original
        }
        const avgNeighborScore = neighborScores.reduce((sum, s) => sum + s, 0) / neighborScores.length;
        const smoothedScore = (cell.score + avgNeighborScore) / 2;
        return {
            ...cell,
            score: smoothedScore
        };
    });
}
//# sourceMappingURL=smoothing.js.map