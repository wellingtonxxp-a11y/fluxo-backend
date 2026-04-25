/**
 * Decision Engine - Core logic for selecting best cell
 */
import { Cell } from '../modules/gridService';
import { Context } from './scoring';
export interface Decision {
    cell: Cell;
    score: number;
    timestamp: number;
}
export interface UserDecision {
    userId: string;
    decision: Decision;
}
/**
 * Get best cell for user location
 */
export declare function getBestCell(userLat: number, userLng: number, context: Context): Cell | null;
/**
 * Check if should change target (hysteresis)
 */
export declare function shouldChangeTarget(userId: string, newCell: Cell, newScore: number): boolean;
/**
 * Update user decision
 */
export declare function updateUserDecision(userId: string, cell: Cell, score: number): void;
/**
 * Get current decision for user
 */
export declare function getCurrentDecision(userId: string): Decision | null;
/**
 * Make decision with hysteresis
 */
export declare function makeDecision(userId: string, userLat: number, userLng: number, context: Context): {
    cell: Cell;
    score: number;
    changed: boolean;
};
//# sourceMappingURL=decisionEngine.d.ts.map