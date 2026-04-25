"use strict";
/**
 * Rotas de Flow
 * GET /flow - Obtém flows recentes
 * POST /flow - Cria novo flow
 * POST /flow/:id/finish - Finaliza um flow
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const flow_service_1 = require("../services/flow.service");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
/**
 * GET /flow
 * Lista flows recentes
 */
router.get("/", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Usuário não autenticado" });
        }
        const flows = await prisma.flow.findMany({
            where: { userId },
            take: 50,
            orderBy: { createdAt: "desc" }
        });
        return res.json({ success: true, data: flows });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message || "Erro ao listar flows" });
    }
});
/**
 * POST /flow
 * Cria novo flow
 */
router.post("/", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Usuário não autenticado" });
        }
        const { lat, lng, platform, placeName, placeAddress } = req.body;
        const data = await (0, flow_service_1.ingestFlow)({
            userId,
            lat: Number(lat),
            lng: Number(lng),
            platform,
            placeName,
            placeAddress
        });
        return res.json({ success: true, data });
    }
    catch (err) {
        return res.status(400).json({ success: false, error: err.message || "Falha ao salvar fluxo" });
    }
});
/**
 * POST /flow/:id/finish
 * Finaliza um flow
 */
router.post("/:id/finish", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Usuário não autenticado" });
        }
        const { id } = req.params;
        const { durationMin, value, km } = req.body;
        // Valida que o flow pertence ao usuário
        const flow = await prisma.flow.findUnique({
            where: { id: parseInt(id) }
        });
        if (!flow || flow.userId !== userId) {
            return res.status(403).json({ success: false, error: "Acesso negado" });
        }
        await (0, flow_service_1.finishFlow)(parseInt(id), durationMin, value, km);
        return res.json({ success: true, message: "Flow finalizado" });
    }
    catch (err) {
        return res.status(400).json({ success: false, error: err.message || "Erro ao finalizar flow" });
    }
});
exports.default = router;
//# sourceMappingURL=flow.routes.js.map