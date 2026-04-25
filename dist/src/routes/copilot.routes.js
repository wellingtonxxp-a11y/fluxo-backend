"use strict";
/**
 * Rotas do Copiloto
 * GET /copilot - Legacy endpoint (kept for compatibility)
 * POST /copilot/decision - New decision endpoint
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const decisionEngine_1 = require("../core/decisionEngine");
const router = express_1.default.Router();
/**
 * GET /copilot?lat=X&lng=Y
 * Legacy endpoint - returns basic response
 */
router.get("/", async (req, res) => {
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
    }
    catch (err) {
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
router.post("/decision", async (req, res) => {
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
        const { cell, score, changed } = (0, decisionEngine_1.makeDecision)(userId, lat, lng, context);
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
    }
    catch (err) {
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
router.get("/feedback", async (req, res) => {
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
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || "Erro no copiloto com feedback"
        });
    }
});
exports.default = router;
//# sourceMappingURL=copilot.routes.js.map