"use strict";
/**
 * Rotas de Estratégia de Trabalho
 * POST /strategy/start - Inicia sessão de estratégia
 * POST /strategy/update - Atualiza sessão
 * POST /strategy/end - Finaliza sessão
 * GET /strategy - Obtém sessão ativa
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const strategy_service_1 = require("../services/strategy.service");
const router = express_1.default.Router();
/**
 * POST /strategy/start
 * Inicia nova sessão de estratégia
 */
router.post("/start", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Usuário não autenticado" });
        }
        const session = await (0, strategy_service_1.startStrategy)(userId);
        return res.json({ success: true, data: session });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || "Falha ao iniciar estratégia"
        });
    }
});
/**
 * POST /strategy/update
 * Atualiza sessão ativa
 */
router.post("/update", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Usuário não autenticado" });
        }
        const { sessionId, totalDistance, totalTimeMin, totalScore } = req.body;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: "sessionId é obrigatório"
            });
        }
        const session = await (0, strategy_service_1.updateStrategy)(sessionId, {
            totalDistance,
            totalTimeMin,
            totalScore
        });
        return res.json({ success: true, data: session });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || "Falha ao atualizar estratégia"
        });
    }
});
/**
 * POST /strategy/end
 * Finaliza sessão de estratégia
 */
router.post("/end", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Usuário não autenticado" });
        }
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: "sessionId é obrigatório"
            });
        }
        const session = await (0, strategy_service_1.endStrategy)(sessionId);
        return res.json({ success: true, data: session });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || "Falha ao finalizar estratégia"
        });
    }
});
/**
 * GET /strategy
 * Obtém sessão ativa do usuário
 */
router.get("/", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Usuário não autenticado" });
        }
        const session = await (0, strategy_service_1.getActiveStrategy)(userId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: "Nenhuma sessão ativa"
            });
        }
        return res.json({ success: true, data: session });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || "Erro ao buscar estratégia"
        });
    }
});
exports.default = router;
//# sourceMappingURL=strategy.routes.js.map