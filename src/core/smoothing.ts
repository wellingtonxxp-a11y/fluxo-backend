/**
 * Smoothing Module - Apply spatial smoothing to cell scores
 */

import { Cell } from '../modules/gridService';
import { getNeighbors } from '../modules/gridService';

export interface ScoredCell extends Cell {
  score: number;
}

/**
 * Apply smoothing: average each cell's score with its neighbors
 */
export function smoothScores(scoredCells: ScoredCell[]): ScoredCell[] {
  // Create a map for quick lookup
  const scoreMap = new Map<string, number>();
  scoredCells.forEach(cell => scoreMap.set(cell.id, cell.score));

  return scoredCells.map(cell => {
    const neighbors = getNeighbors(cell.id);
    const neighborScores: number[] = [];

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