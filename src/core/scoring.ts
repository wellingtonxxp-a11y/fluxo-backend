/**
 * Scoring Module - Calculate hotspot cell scores based on real delivery data
 * 
 * Components:
 * 1. baseDemand (60%) - Total pickup count with time decay
 * 2. hourlyBoost (25%) - How frequent pickups are at current hour
 * 3. dailyBoost (15%) - How frequent pickups are on current day
 */

import { calculateDecay, getRecencyBoost } from './decay';

export interface HotspotCell {
  id: string;
  pickupCount: number;
  lastUpdated: number; // timestamp
  hourlyDistribution: Record<number, number>; // hour -> count
  dailyDistribution: Record<number, number>; // day -> count
}

export interface Context {
  hour: number; // 0-23
  dayOfWeek: number; // 0-6, 0=Sunday
  currentTime?: number; // milliseconds
}

const DECAY_LAMBDA = 0.07; // Decay rate per hour
const MIN_PICKUP_THRESHOLD = 3; // Minimum pickups for confidence

/**
 * Calculate base demand with time decay
 * 
 * @param cell - Hotspot cell with pickup data
 * @param context - Time context
 * @returns Base demand score (0-100)
 */
function calculateBaseDemand(cell: HotspotCell, context: Context): number {
  const currentTime = context.currentTime || Date.now();
  
  // Apply decay to pickup count
  const decayedCount = cell.pickupCount * 
    calculateDecay(cell.lastUpdated, currentTime, DECAY_LAMBDA);

  // Normalize: assume max ~100 decayed pickups = 100 score
  // (In practice, this scales with actual data)
  const baseDemand = Math.min(100, (decayedCount / 10) * 10);

  return baseDemand;
}

/**
 * Calculate hourly boost
 * 
 * Compares current hour frequency against all hours
 * Higher if pickups are concentrated in current hour
 * 
 * @param cell - Hotspot cell
 * @param context - Time context
 * @returns Hourly boost (0-50)
 */
function calculateHourlyBoost(cell: HotspotCell, context: Context): number {
  const hourlyDist = cell.hourlyDistribution || {};
  const currentHourCount = hourlyDist[context.hour] || 0;

  // Total pickups across all hours
  const totalPickups = Object.values(hourlyDist).reduce((sum, c) => sum + c, 0);

  if (totalPickups === 0) return 0;

  // Frequency: what % of pickups occur in this hour?
  const frequency = currentHourCount / totalPickups;

  // Normalize to 0-50 scale
  // Assuming uniform distribution = 1/24 = ~4.2%
  // Current hour being 20% (5x average) = strong boost
  const avgFrequency = 1 / 24;
  const normalizedFreq = Math.min(1, frequency / (avgFrequency * 5)); // Cap at 5x average

  return normalizedFreq * 50;
}

/**
 * Calculate daily boost
 * 
 * Compares current day frequency against all days
 * Higher if pickups are concentrated on current day of week
 * 
 * @param cell - Hotspot cell
 * @param context - Time context
 * @returns Daily boost (0-30)
 */
function calculateDailyBoost(cell: HotspotCell, context: Context): number {
  const dailyDist = cell.dailyDistribution || {};
  const currentDayCount = dailyDist[context.dayOfWeek] || 0;

  // Total pickups across all days
  const totalPickups = Object.values(dailyDist).reduce((sum, c) => sum + c, 0);

  if (totalPickups === 0) return 0;

  // Frequency: what % of pickups occur on this day?
  const frequency = currentDayCount / totalPickups;

  // Normalize to 0-30 scale
  const avgFrequency = 1 / 7;
  const normalizedFreq = Math.min(1, frequency / (avgFrequency * 3)); // Cap at 3x average

  return normalizedFreq * 30;
}

/**
 * Calculate confidence factor based on data quality
 * 
 * Low pickupCount = low confidence
 * 
 * @param cell - Hotspot cell
 * @returns Confidence factor (0-1)
 */
function calculateConfidence(cell: HotspotCell): number {
  if (cell.pickupCount < 1) return 0;
  if (cell.pickupCount < MIN_PICKUP_THRESHOLD) return 0.5;
  if (cell.pickupCount < 10) return 0.7;
  if (cell.pickupCount < 50) return 0.85;
  return 1.0;
}

/**
 * Calculate total score for a cell
 * 
 * Formula:
 * score = (baseDemand * 0.6) + (hourlyBoost * 0.25) + (dailyBoost * 0.15)
 * score *= confidence factor
 * 
 * @param cell - Hotspot cell with data
 * @param context - Time context
 * @returns Final score (0-100)
 */
export function calculateCellScore(cell: HotspotCell, context: Context): number {
  const baseDemand = calculateBaseDemand(cell, context);
  const hourlyBoost = calculateHourlyBoost(cell, context);
  const dailyBoost = calculateDailyBoost(cell, context);
  const confidence = calculateConfidence(cell);

  // Weighted combination
  let score = 
    (baseDemand * 0.6) +
    (hourlyBoost * 0.25) +
    (dailyBoost * 0.15);

  // Apply confidence factor (penalize low-data cells)
  score *= confidence;

  // Ensure score is in valid range
  return Math.max(0, Math.min(100, score));
}

/**
 * Normalize scores across a set of cells
 * 
 * Scales all scores so max = 100
 * 
 * @param cells - Array of scored cells
 * @returns Normalized scores
 */
export function normalizeScores(
  scores: Array<{ cellId: string; score: number }>
): Array<{ cellId: string; score: number }> {
  const maxScore = Math.max(...scores.map(s => s.score), 1);

  return scores.map(s => ({
    cellId: s.cellId,
    score: (s.score / maxScore) * 100
  }));
}

/**
 * Filter cells by minimum confidence
 * 
 * @param cells - Array of cells
 * @param minConfidence - Minimum confidence (0-1)
 * @returns Filtered cells
 */
export function filterByConfidence(
  cells: HotspotCell[],
  minConfidence: number = 0.3
): HotspotCell[] {
  return cells.filter(cell => calculateConfidence(cell) >= minConfidence);
}