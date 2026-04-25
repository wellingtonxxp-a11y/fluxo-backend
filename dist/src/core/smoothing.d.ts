/**
 * Smoothing Module - Apply spatial smoothing to cell scores
 */
import { Cell } from '../modules/gridService';
export interface ScoredCell extends Cell {
    score: number;
}
/**
 * Apply smoothing: average each cell's score with its neighbors
 */
export declare function smoothScores(scoredCells: ScoredCell[]): ScoredCell[];
//# sourceMappingURL=smoothing.d.ts.map