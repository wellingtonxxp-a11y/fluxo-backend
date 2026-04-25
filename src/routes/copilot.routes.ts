/**
 * Rotas do Copiloto
 * GET /copilot - Legacy endpoint (kept for compatibility)
 * POST /copilot/decision - New decision endpoint
 * POST /copilot/session - Hotspot session ingestion
 * POST /copilot/hotspot - Hotspot decision (new)
 */

import express, { Router, Request, Response } from "express";
import { makeDecision } from "../core/decisionEngine";
import * as sessionProcessor from "../modules/sessionProcessor";

const router: Router = express.Router();

/**
 * GET /copilot?lat=X&lng=Y
 * Legacy endpoint - returns basic response
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        error: "Latitude e longitude obrigatórias e devem ser números"
      });
    }

    // Simple response for legacy
    return res.json({
      success: true,
      data: {
        message: "Use POST /copilot/decision for new decision system"
      }
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || "Erro no copiloto"
    });
  }
});

/**
 * POST /copilot/decision
 * New decision endpoint - returns best target
 */
router.post("/decision", async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { lat, lng, userId } = req.body;

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !userId) {
      return res.status(400).json({
        success: false,
        error: "lat, lng (numbers) e userId (string) obrigatórios"
      });
    }

    // Get current context
    const now = new Date();
    const context = {
      hour: now.getHours(),
      dayOfWeek: now.getDay()
    };

    // Make decision
    const { cell, score, changed } = makeDecision(userId, lat, lng, context);

    // Log
    console.log(`[${new Date().toISOString()}] Decision: userId=${userId}, cell=${cell.id}, score=${score.toFixed(2)}, changed=${changed}`);

    const responseTime = Date.now() - startTime;

    return res.json({
      target: {
        lat: cell.lat,
        lng: cell.lng
      },
      score: Math.round(score),
      message: "Vá para esta área agora",
      responseTime: `${responseTime}ms`
    });

  } catch (err: any) {
    console.error("Decision error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Erro na decisão"
    });
  }
});

/**
 * GET /copilot/feedback?lat=X&lng=Y
 * Legacy endpoint
 */
router.get("/feedback", async (req: Request, res: Response) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        error: "Latitude e longitude obrigatórias e devem ser números"
      });
    }

    return res.json({
      success: true,
      data: {
        message: "Use POST /copilot/decision for new decision system"
      }
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || "Erro no copiloto com feedback"
    });
  }
});

// ============ HOTSPOT SCORING ENDPOINTS ============

/**
 * POST /copilot/session
 * Process a delivery session and update hotspot cells
 */
router.post("/session", async (req: Request, res: Response) => {
  try {
    const { userId, startLat, startLng, endLat, endLng, durationSec, distanceMeters } = req.body;

    if (!userId || startLat === undefined || startLng === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, startLat, startLng"
      });
    }

    if (!Number.isFinite(startLat) || !Number.isFinite(startLng)) {
      return res.status(400).json({
        success: false,
        error: "Invalid coordinates"
      });
    }

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
        message: "Session processed successfully"
      }
    });
  } catch (error: any) {
    console.error("[HOTSPOT] POST /session error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

/**
 * POST /copilot/hotspot
 * Get hotspot recommendation (NEW - real data based)
 */
router.post("/hotspot", async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { lat, lng, userId } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: lat, lng"
      });
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        error: "Invalid coordinates"
      });
    }

    const hotspot = await sessionProcessor.getHotspotScore(lat, lng);

    const responseTime = Date.now() - startTime;

    if (!hotspot) {
      return res.json({
        success: true,
        data: {
          target: { lat, lng },
          score: 0,
          message: "No hotspot data available yet",
          confidence: 0,
          responseTime: `${responseTime}ms`
        }
      });
    }

    let message = "Vá para esta área agora";
    if (hotspot.confidence < 0.5) {
      message = "Área com poucos dados - use com cuidado";
    } else if (hotspot.score > 70) {
      message = "Zona quente! Alta demanda agora";
    } else if (hotspot.score < 30) {
      message = "Demanda baixa neste momento";
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
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("[HOTSPOT] POST /hotspot error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

/**
 * GET /copilot/nearby?lat=X&lng=Y
 * Get all nearby hotspots
 */
router.get("/nearby", async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        error: "Invalid coordinates"
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
        count: hotspots.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("[HOTSPOT] GET /nearby error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

/**
 * GET /copilot/stats
 * Get hotspot system statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
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
    console.error("[HOTSPOT] GET /stats error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

export default router;
