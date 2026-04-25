/**
 * Zone Service - Simplified for beta
 */

export function validateInsideSP(lat: number, lng: number): boolean {
  // Simple validation: within São Paulo bounds approx
  return lat >= -24 && lat <= -23 && lng >= -47 && lng <= -46;
}