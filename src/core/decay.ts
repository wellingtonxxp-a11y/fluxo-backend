/**
 * Decay Module - Time decay calculations for hotspot scoring
 * 
 * Recent data matters more. Older data decays exponentially.
 * Formula: decayFactor = exp(-lambda * hoursSinceEvent)
 */

/**
 * Calculate decay factor for an event
 * 
 * @param eventTimestamp - Event timestamp in milliseconds
 * @param currentTime - Current time in milliseconds (default: now)
 * @param lambda - Decay rate (0.05-0.1 recommended, higher = faster decay)
 * @returns Decay factor (0-1, where 1 = no decay)
 */
export function calculateDecay(
  eventTimestamp: number,
  currentTime: number = Date.now(),
  lambda: number = 0.07
): number {
  const hoursSinceEvent = (currentTime - eventTimestamp) / (1000 * 60 * 60);
  
  if (hoursSinceEvent < 0) {
    return 1; // Future events don't decay (shouldn't happen)
  }

  const decayFactor = Math.exp(-lambda * hoursSinceEvent);
  return Math.max(0, Math.min(1, decayFactor)); // Clamp to [0, 1]
}

/**
 * Apply decay to a count
 * 
 * @param count - Original count
 * @param eventTimestamp - Event timestamp
 * @param currentTime - Current time
 * @param lambda - Decay rate
 * @returns Decayed count
 */
export function applyDecay(
  count: number,
  eventTimestamp: number,
  currentTime: number = Date.now(),
  lambda: number = 0.07
): number {
  const decay = calculateDecay(eventTimestamp, currentTime, lambda);
  return count * decay;
}

/**
 * Calculate weighted average considering time decay
 * 
 * @param events - Array of events with timestamp and value
 * @param currentTime - Current time
 * @param lambda - Decay rate
 * @returns Weighted average value
 */
export function calculateWeightedDecayedAverage(
  events: Array<{ timestamp: number; value: number }>,
  currentTime: number = Date.now(),
  lambda: number = 0.07
): number {
  if (events.length === 0) return 0;

  let totalWeight = 0;
  let totalWeightedValue = 0;

  events.forEach(({ timestamp, value }) => {
    const weight = calculateDecay(timestamp, currentTime, lambda);
    totalWeight += weight;
    totalWeightedValue += value * weight;
  });

  return totalWeight > 0 ? totalWeightedValue / totalWeight : 0;
}

/**
 * Get time decay parameters
 * 
 * @returns Recommended parameters
 */
export function getDecayParameters() {
  return {
    lambda: 0.07, // Decay rate (per hour)
    halfLife: Math.log(2) / 0.07, // Hours until value is 50%
    oneDayDecay: Math.exp(-0.07 * 24), // Factor after 24 hours
    oneWeekDecay: Math.exp(-0.07 * 24 * 7) // Factor after 7 days
  };
}

/**
 * Recency factor: boost for recent events
 * 
 * Used to emphasize very recent data (e.g., last hour)
 * 
 * @param eventTimestamp - Event timestamp
 * @param currentTime - Current time
 * @returns Recency boost (0-1+)
 */
export function getRecencyBoost(
  eventTimestamp: number,
  currentTime: number = Date.now()
): number {
  const minutesSinceEvent = (currentTime - eventTimestamp) / (1000 * 60);

  if (minutesSinceEvent < 30) return 1.5; // Strong boost
  if (minutesSinceEvent < 60) return 1.2; // Medium boost
  if (minutesSinceEvent < 180) return 1.0; // Normal
  if (minutesSinceEvent < 360) return 0.8; // Slight decay
  return 0.5; // Weak (> 6 hours)
}

/**
 * Is data considered "stale" (too old)?
 * 
 * @param eventTimestamp - Event timestamp
 * @param staleAfterHours - Threshold (default 72 hours = 3 days)
 * @param currentTime - Current time
 * @returns True if older than threshold
 */
export function isDataStale(
  eventTimestamp: number,
  staleAfterHours: number = 72,
  currentTime: number = Date.now()
): boolean {
  const hoursSinceEvent = (currentTime - eventTimestamp) / (1000 * 60 * 60);
  return hoursSinceEvent > staleAfterHours;
}
