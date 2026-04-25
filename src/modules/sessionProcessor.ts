/**
 * Session Processor - Process delivery sessions and update hotspot cells
 */

import { mapToCell, getCellCenter } from '../core/grid';
import * as hotspotRepo from './hotspotRepository';
import { calculateCellScore, HotspotCell, Context } from '../core/scoring';

export interface DeliverySessionInput {
  userId: number;
  startLat: number;
  startLng: number;
  endLat?: number;
  endLng?: number;
  durationSec?: number;
  distanceMeters?: number;
}

/**
 * Process a delivery session
 * 
 * Steps:
 * 1. Map startLat/Lng → cellId
 * 2. Get or create cell
 * 3. Increment pickup count + temporal distribution
 * 4. Create delivery session record
 * 5. Log event
 * 
 * @param session - Delivery session data
 * @returns Processed cell and session
 */
export async function processDeliverySession(session: DeliverySessionInput): Promise<any> {
  try {
    // Step 1: Map to cell
    const cellId = mapToCell(session.startLat, session.startLng);
    const { lat: centerLat, lng: centerLng } = getCellCenter(cellId);

    // Step 2: Get or create cell
    const cell = await hotspotRepo.getOrCreateCell(cellId, centerLat, centerLng);

    // Step 3: Get current hour and day
    const now = new Date();
    const hour = now.getHours(); // 0-23
    const dayOfWeek = now.getDay(); // 0-6

    // Step 4: Increment counts
    const updatedCell = await hotspotRepo.incrementPickupCount(cellId, hour, dayOfWeek);

    // Step 5: Create session record
    const deliverySession = await hotspotRepo.createDeliverySession(
      session.userId,
      cellId,
      session.startLat,
      session.startLng,
      session.endLat,
      session.endLng,
      session.durationSec,
      session.distanceMeters
    );

    // Log
    console.log(`[HOTSPOT] Session processed`, {
      userId: session.userId,
      cellId,
      pickupCount: updatedCell.pickupCount,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      cellId,
      cell: updatedCell,
      session: deliverySession
    };
  } catch (error: any) {
    console.error(`[HOTSPOT] Error processing session:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get hotspot score for a location
 * 
 * Steps:
 * 1. Find nearby cells
 * 2. Calculate score for each with time context
 * 3. Apply smoothing (average with neighbors)
 * 4. Return top scored cell
 * 
 * @param lat - Query latitude
 * @param lng - Query longitude
 * @returns Top hotspot with score
 */
export async function getHotspotScore(
  lat: number,
  lng: number
): Promise<{
  cellId: string;
  score: number;
  centerLat: number;
  centerLng: number;
  pickupCount: number;
  confidence: number;
} | null> {
  try {
    // Get nearby cells
    const cells = await hotspotRepo.getNearbyCell(lat, lng, 2.0);

    if (cells.length === 0) {
      return null;
    }

    // Current time context
    const now = new Date();
    const context: Context = {
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      currentTime: now.getTime()
    };

    // Calculate scores
    const scoredCells = cells.map(cell => ({
      ...cell,
      score: calculateCellScore(cell as HotspotCell, context)
    }));

    // Sort by score
    scoredCells.sort((a, b) => b.score - a.score);

    const topCell = scoredCells[0];

    return {
      cellId: topCell.id,
      score: topCell.score,
      centerLat: topCell.centerLat,
      centerLng: topCell.centerLng,
      pickupCount: topCell.pickupCount,
      confidence: topCell.confidence
    };
  } catch (error: any) {
    console.error(`[HOTSPOT] Error getting score:`, error.message);
    return null;
  }
}

/**
 * Get all nearby hotspot scores (for detailed analysis)
 * 
 * @param lat - Query latitude
 * @param lng - Query longitude
 * @returns Array of nearby cells with scores
 */
export async function getNearbyHotspots(
  lat: number,
  lng: number
): Promise<Array<{
  cellId: string;
  score: number;
  centerLat: number;
  centerLng: number;
  pickupCount: number;
  confidence: number;
}>> {
  try {
    const cells = await hotspotRepo.getNearbyCell(lat, lng, 2.0);

    if (cells.length === 0) {
      return [];
    }

    const now = new Date();
    const context: Context = {
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      currentTime: now.getTime()
    };

    const scored = cells
      .map(cell => ({
        cellId: cell.id,
        score: calculateCellScore(cell as HotspotCell, context),
        centerLat: cell.centerLat,
        centerLng: cell.centerLng,
        pickupCount: cell.pickupCount,
        confidence: cell.confidence
      }))
      .sort((a, b) => b.score - a.score);

    return scored;
  } catch (error: any) {
    console.error(`[HOTSPOT] Error getting nearby:`, error.message);
    return [];
  }
}

/**
 * Batch process multiple delivery sessions
 * 
 * @param sessions - Array of sessions
 * @returns Results array
 */
export async function batchProcessSessions(
  sessions: DeliverySessionInput[]
): Promise<any[]> {
  return Promise.all(sessions.map(session => processDeliverySession(session)));
}

/**
 * Get hotspot statistics
 * 
 * @returns Statistics object
 */
export async function getHotspotStats(): Promise<any> {
  try {
    const stats = await hotspotRepo.getCellStatistics();
    
    const topCells = await hotspotRepo.getTopCells(5);

    return {
      ...stats,
      topCells: topCells.map(cell => ({
        cellId: cell.id,
        centerLat: cell.centerLat,
        centerLng: cell.centerLng,
        pickupCount: cell.pickupCount,
        confidence: cell.confidence
      }))
    };
  } catch (error: any) {
    console.error(`[HOTSPOT] Error getting stats:`, error.message);
    return { error: error.message };
  }
}
