/**
 * Rotas do Copiloto
 * GET /copilot - Legacy endpoint (kept for compatibility)
 * POST /copilot/decision - New decision endpoint
 */

import express, { Router, Request, Response } from "express";
import { makeDecision } from "../core/decisionEngine";

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

export default router;
