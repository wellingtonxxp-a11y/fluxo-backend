/**
 * Scoring Module - Calculate cell scores based on context
 */
import { Cell } from '../modules/gridService';
export interface Context {
    hour: number;
    dayOfWeek: number;
}
/**
 * Calculate score for a cell
 * Formula: baseDemand + timeFactor + poiFactor
 */
export declare function calculateCellScore(cell: Cell, context: Context): number;
//# sourceMappingURL=scoring.d.ts.map