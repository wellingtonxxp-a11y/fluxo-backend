/**
 * Decision Engine - Core logic for selecting best cell
 */

import { getNearbyCells, getAllCells, Cell } from '../modules/gridService';
import { calculateCellScore, Context } from './scoring';
import { smoothScores, ScoredCell } from './smoothing';

export interface Decision {
  cell: Cell;
  score: number;
  timestamp: number;
}

export interface UserDecision {
  userId: string;
  decision: Decision;
}

// In-memory storage for user decisions (for hysteresis)
const userDecisions = new Map<string, Decision>();

/**
 * Get best cell for user location
 */
export function getBestCell(userLat: number, userLng: number, context: Context): Cell | null {
  // Get nearby cells (~2km radius, 0.02 degrees)
  const nearbyCells = getNearbyCells(userLat, userLng, 0.02);

  if (nearbyCells.length === 0) {
    return null; // Fallback will handle
  }

  // Calculate scores
  const scoredCells: ScoredCell[] = nearbyCells.map(cell => ({
    ...cell,
    score: calculateCellScore(cell, context)
  }));

  // Apply smoothing
  const smoothedCells = smoothScores(scoredCells);

  // Sort by score descending
  smoothedCells.sort((a, b) => b.score - a.score);

  // Return top 1
  return smoothedCells[0] || null;
}

/**
 * Check if should change target (hysteresis)
 */
export function shouldChangeTarget(userId: string, newCell: Cell, newScore: number): boolean {
  const currentDecision = userDecisions.get(userId);

  if (!currentDecision) {
    return true; // No previous decision, change
  }

  const now = Date.now();
  const timeDiff = now - currentDecision.timestamp;

  // Change if new score is 10+ higher OR current is older than 90 seconds
  if (newScore >= currentDecision.score + 10 || timeDiff > 90000) {
    return true;
  }

  return false;
}

/**
 * Update user decision
 */
export function updateUserDecision(userId: string, cell: Cell, score: number): void {
  const decision: Decision = {
    cell,
    score,
    timestamp: Date.now()
  };
  userDecisions.set(userId, decision);
}

/**
 * Get current decision for user
 */
export function getCurrentDecision(userId: string): Decision | null {
  return userDecisions.get(userId) || null;
}

/**
 * Make decision with hysteresis
 */
export function makeDecision(userId: string, userLat: number, userLng: number, context: Context): { cell: Cell; score: number; changed: boolean } {
  const newCell = getBestCell(userLat, userLng, context);

  if (!newCell) {
    // Fallback: return closest cell
    const allCells = getAllCells();
    if (allCells.length > 0) {
      // Find closest cell
      let closestCell = allCells[0];
      let minDistance = Number.MAX_VALUE;
      
      for (const cell of allCells) {
        const distance = Math.sqrt(
          Math.pow(cell.lat - userLat, 2) + Math.pow(cell.lng - userLng, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestCell = cell;
        }
      }
      
      // Calculate score for fallback
      const score = calculateCellScore(closestCell, context);
      return { cell: closestCell, score, changed: true };
    }
    throw new Error('No cells available');
  }

  const newScore = calculateCellScore(newCell, context);

  const shouldChange = shouldChangeTarget(userId, newCell, newScore);

  if (shouldChange) {
    updateUserDecision(userId, newCell, newScore);
    return { cell: newCell, score: newScore, changed: true };
  } else {
    // Return current decision
    const current = getCurrentDecision(userId);
    if (current) {
      return { cell: current.cell, score: current.score, changed: false };
    } else {
      // Should not happen, but fallback
      updateUserDecision(userId, newCell, newScore);
      return { cell: newCell, score: newScore, changed: true };
    }
  }
}