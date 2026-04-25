"use strict";
/**
 * Rotas de Feedback de Hotspots
 * POST /feedback - Submete feedback sobre um hotspot
 * GET /feedback - Lista feedbacks do usuário
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const zone_service_1 = require("../services/zone.service");
const reputation_service_1 = require("../services/reputation.service");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
/**
 * POST /feedback
 * Submete feedback sobre um hotspot
 */
router.post("/", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Usuário não autenticado" });
        }
        const { lat, lng, type, weight = 1 } = req.body;
        if (!lat || !lng || !type) {
            return res.status(400).json({
                success: false,
                error: "Latitude, longitude e tipo são obrigatórios"
            });
        }
        // Obtém zona
        const zone = await (0, zone_service_1.getZoneFromPoint)(Number(lat), Number(lng));
        // Cria feedback
        const feedback = await prisma.hotspotFeedback.create({
            data: {
                userId,
                zoneId: zone.id,
                latitude: Number(lat),
                longitude: Number(lng),
                type: type,
                weight: Number(weight) || 1
            }
        });
        // Atualiza reputação
        await (0, reputation_service_1.updateReputationScore)(userId, Number(weight));
        return res.json({ success: true, data: feedback });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || "Falha ao enviar feedback"
        });
    }
});
/**
 * GET /feedback
 * Lista feedbacks do usuário
 */
router.get("/", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Usuário não autenticado" });
        }
        const feedbacks = await prisma.hotspotFeedback.findMany({
            where: { userId },
            take: 100,
            orderBy: { createdAt: "desc" }
        });
        return res.json({ success: true, data: feedbacks });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message || "Erro ao listar feedbacks"
        });
    }
});
exports.default = router;
//# sourceMappingURL=feedback.routes.js.map