/**
 * Hotspot Repository - Database operations for hotspot cells and delivery sessions
 */

import prisma from '../lib/prisma';
import { HotspotCell } from './scoring';

/**
 * Get or create a hotspot cell
 * 
 * @param cellId - Geohash cell ID
 * @param centerLat - Cell center latitude
 * @param centerLng - Cell center longitude
 * @returns Hotspot cell record
 */
export async function getOrCreateCell(
  cellId: string,
  centerLat: number,
  centerLng: number
): Promise<any> {
  let cell = await prisma.hotspotCell.findUnique({
    where: { id: cellId }
  });

  if (!cell) {
    cell = await prisma.hotspotCell.create({
      data: {
        id: cellId,
        centerLat,
        centerLng,
        pickupCount: 0,
        hourlyDistribution: {},
        dailyDistribution: {},
        confidence: 0
      }
    });
  }

  return cell;
}

/**
 * Get cell by ID
 * 
 * @param cellId - Geohash cell ID
 * @returns Hotspot cell record or null
 */
export async function getCell(cellId: string): Promise<any> {
  return prisma.hotspotCell.findUnique({
    where: { id: cellId }
  });
}

/**
 * Get nearby cells
 * 
 * @param lat - Center latitude
 * @param lng - Center longitude
 * @param radiusKm - Search radius in kilometers
 * @returns Array of nearby cells
 */
export async function getNearbyCell(lat: number, lng: number, radiusKm: number = 2): Promise<any[]> {
  // Simple bounding box query (±radiusKm / 111 degrees ≈ 1 degree ≈ 111km)
  const deltaLng = radiusKm / 111.32;
  const deltaLat = radiusKm / 110.57;

  const cells = await prisma.hotspotCell.findMany({
    where: {
      centerLat: {
        gte: lat - deltaLat,
        lte: lat + deltaLat
      },
      centerLng: {
        gte: lng - deltaLng,
        lte: lng + deltaLng
      }
    },
    orderBy: { pickupCount: 'desc' }
  });

  return cells;
}

/**
 * Increment pickup count for a cell
 * 
 * @param cellId - Cell ID
 * @param hour - Hour of day (0-23)
 * @param dayOfWeek - Day of week (0-6)
 * @returns Updated cell
 */
export async function incrementPickupCount(
  cellId: string,
  hour: number,
  dayOfWeek: number
): Promise<any> {
  const cell = await prisma.hotspotCell.findUnique({
    where: { id: cellId }
  });

  if (!cell) {
    throw new Error(`Cell ${cellId} not found`);
  }

  // Parse JSON distributions
  const hourlyDist: Record<number, number> = 
    typeof cell.hourlyDistribution === 'string' 
      ? JSON.parse(cell.hourlyDistribution)
      : (cell.hourlyDistribution as Record<number, number>);
      
  const dailyDist: Record<number, number> = 
    typeof cell.dailyDistribution === 'string'
      ? JSON.parse(cell.dailyDistribution)
      : (cell.dailyDistribution as Record<number, number>);

  // Increment counts
  hourlyDist[hour] = (hourlyDist[hour] || 0) + 1;
  dailyDist[dayOfWeek] = (dailyDist[dayOfWeek] || 0) + 1;

  // Calculate confidence
  const newPickupCount = cell.pickupCount + 1;
  let confidence = 0;
  if (newPickupCount < 3) confidence = 0.3;
  else if (newPickupCount < 10) confidence = 0.6;
  else if (newPickupCount < 50) confidence = 0.8;
  else confidence = 1.0;

  // Update cell
  return prisma.hotspotCell.update({
    where: { id: cellId },
    data: {
      pickupCount: newPickupCount,
      hourlyDistribution: hourlyDist,
      dailyDistribution: dailyDist,
      confidence,
      lastUpdated: new Date()
    }
  });
}

/**
 * Create delivery session
 * 
 * @param userId - User ID
 * @param cellId - Cell ID
 * @param startLat - Start latitude
 * @param startLng - Start longitude
 * @param endLat - End latitude (optional)
 * @param endLng - End longitude (optional)
 * @param durationSec - Duration in seconds (optional)
 * @param distanceMeters - Distance in meters (optional)
 * @returns Created delivery session
 */
export async function createDeliverySession(
  userId: number,
  cellId: string,
  startLat: number,
  startLng: number,
  endLat?: number,
  endLng?: number,
  durationSec?: number,
  distanceMeters?: number
): Promise<any> {
  return prisma.deliverySession.create({
    data: {
      userId,
      cellId,
      startLat,
      startLng,
      endLat,
      endLng,
      durationSec,
      distanceMeters
    }
  });
}

/**
 * Get delivery sessions for a cell
 * 
 * @param cellId - Cell ID
 * @param limit - Number of recent sessions to fetch
 * @returns Array of delivery sessions
 */
export async function getCellSessions(cellId: string, limit: number = 100): Promise<any[]> {
  return prisma.deliverySession.findMany({
    where: { cellId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Get user's recent delivery sessions
 * 
 * @param userId - User ID
 * @param limit - Number of sessions
 * @returns Array of delivery sessions
 */
export async function getUserSessions(userId: number, limit: number = 50): Promise<any[]> {
  return prisma.deliverySession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Get top hotspot cells by pickup count
 * 
 * @param limit - Number of cells to return
 * @returns Array of top cells
 */
export async function getTopCells(limit: number = 50): Promise<any[]> {
  return prisma.hotspotCell.findMany({
    orderBy: { pickupCount: 'desc' },
    take: limit
  });
}

/**
 * Get cells with minimum pickup threshold
 * 
 * @param minPickups - Minimum pickup count
 * @returns Array of qualified cells
 */
export async function getCellsWithMinimumData(minPickups: number = 3): Promise<any[]> {
  return prisma.hotspotCell.findMany({
    where: {
      pickupCount: {
        gte: minPickups
      }
    },
    orderBy: { pickupCount: 'desc' }
  });
}

/**
 * Clear old delivery sessions (data older than days)
 * 
 * @param olderThanDays - Delete sessions older than this many days
 * @returns Count of deleted records
 */
export async function cleanOldSessions(olderThanDays: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.deliverySession.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    }
  });

  return result.count;
}

/**
 * Get cell statistics
 * 
 * @returns Statistics object
 */
export async function getCellStatistics(): Promise<any> {
  const [totalCells, totalPickups, avgPickupsPerCell] = await Promise.all([
    prisma.hotspotCell.count(),
    prisma.hotspotCell.aggregate({
      _sum: { pickupCount: true }
    }),
    prisma.hotspotCell.aggregate({
      _avg: { pickupCount: true }
    })
  ]);

  const totalSessions = await prisma.deliverySession.count();

  return {
    totalCells,
    totalPickups: totalPickups._sum?.pickupCount || 0,
    totalSessions,
    avgPickupsPerCell: avgPickupsPerCell._avg?.pickupCount || 0
  };
}
