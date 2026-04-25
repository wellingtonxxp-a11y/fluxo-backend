/**
 * Hotspot Routes - API endpoints for hotspot scoring system
 */

import { Router, Request, Response } from 'express';
import * as sessionProcessor from '../modules/sessionProcessor';

const router = Router();

/**
 * POST /copilot/session
 * Process a delivery session and update hotspot cells
 * 
 * Body:
 * {
 *   userId: number,
 *   startLat: number,
 *   startLng: number,
 *   endLat?: number,
 *   endLng?: number,
 *   durationSec?: number,
 *   distanceMeters?: number
 * }
 */
router.post('/session', async (req: Request, res: Response) => {
  try {
    const { userId, startLat, startLng, endLat, endLng, durationSec, distanceMeters } = req.body;

    // Validate required fields
    if (!userId || startLat === undefined || startLng === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, startLat, startLng'
      });
    }

    if (!Number.isFinite(startLat) || !Number.isFinite(startLng)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates'
      });
    }

    // Process session
    const result = await sessionProcessor.processDeliverySession({
      userId,
      startLat,
      startLng,
      endLat,
      endLng,
      durationSec,
      distanceMeters
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.status(201).json({
      success: true,
      data: {
        cellId: result.cellId,
        pickupCount: result.cell.pickupCount,
        confidence: result.cell.confidence,
        message: 'Session processed successfully'
      }
    });
  } catch (error: any) {
    console.error('[HOTSPOT] POST /session error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /copilot/decision
 * Get hotspot recommendation for a location
 * 
 * Body:
 * {
 *   lat: number,
 *   lng: number,
 *   userId?: string
 * }
 * 
 * Response:
 * {
 *   target: { lat, lng },
 *   score: number (0-100),
 *   pickupCount: number,
 *   confidence: number,
 *   message: string
 * }
 */
router.post('/decision', async (req: Request, res: Response) => {
  try {
    const { lat, lng, userId } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: lat, lng'
      });
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates'
      });
    }

    // Get best hotspot
    const hotspot = await sessionProcessor.getHotspotScore(lat, lng);

    if (!hotspot) {
      return res.json({
        success: true,
        data: {
          target: { lat, lng },
          score: 0,
          message: 'No hotspot data available yet',
          confidence: 0
        }
      });
    }

    // Determine message based on score and confidence
    let message = 'Vá para esta área agora';
    if (hotspot.confidence < 0.5) {
      message = 'Área com poucos dados - use com cuidado';
    } else if (hotspot.score > 70) {
      message = 'Zona quente! Alta demanda agora';
    } else if (hotspot.score < 30) {
      message = 'Demanda baixa neste momento';
    }

    return res.json({
      success: true,
      data: {
        target: {
          lat: hotspot.centerLat,
          lng: hotspot.centerLng
        },
        score: Math.round(hotspot.score * 10) / 10,
        confidence: Math.round(hotspot.confidence * 100) / 100,
        pickupCount: hotspot.pickupCount,
        cellId: hotspot.cellId,
        message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[HOTSPOT] POST /decision error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /copilot/nearby
 * Get all nearby hotspots (for detailed view)
 * 
 * Query:
 * ?lat=X&lng=Y
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates'
      });
    }

    const hotspots = await sessionProcessor.getNearbyHotspots(lat, lng);

    return res.json({
      success: true,
      data: {
        query: { lat, lng },
        nearby: hotspots.map(h => ({
          ...h,
          score: Math.round(h.score * 10) / 10,
          confidence: Math.round(h.confidence * 100) / 100
        })),
        count: hotspots.length
      }
    });
  } catch (error: any) {
    console.error('[HOTSPOT] GET /nearby error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /copilot/stats
 * Get hotspot system statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await sessionProcessor.getHotspotStats();

    return res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[HOTSPOT] GET /stats error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /copilot/health
 * Hotspot system health check
 */
router.get('/health', (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'hotspot-scoring',
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
