/**
 * Scoring Module - Calculate cell scores based on context
 */

import { Cell } from '../modules/gridService';

export interface Context {
  hour: number; // 0-23
  dayOfWeek: number; // 0-6, 0=Sunday
}

/**
 * Calculate score for a cell
 * Formula: baseDemand + timeFactor + poiFactor
 */
export function calculateCellScore(cell: Cell, context: Context): number {
  // Base demand (mock: use cell baseScore as baseDemand)
  const baseDemand = cell.baseScore;

  // Time factor: higher during peak hours
  let timeFactor = 0;
  const { hour, dayOfWeek } = context;

  // Weekday peaks: morning 7-9, evening 17-19
  // Weekend: afternoon 12-18
  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekday
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      timeFactor = 20;
    }
  } else { // Weekend
    if (hour >= 12 && hour <= 18) {
      timeFactor = 15;
    }
  }

  // POI factor (mock: add some randomness based on cell position)
  const poiFactor = Math.sin(cell.lat * 100) * 5 + Math.cos(cell.lng * 100) * 5;

  // Total score
  let score = baseDemand + timeFactor + poiFactor;

  // Normalize to 0-100
  score = Math.max(0, Math.min(100, score));

  return score;
}