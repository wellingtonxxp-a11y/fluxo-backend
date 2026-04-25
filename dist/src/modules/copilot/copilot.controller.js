"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const copilotService = require("./copilot.service");
async function getCopilot(req, res) {
    try {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return res.status(400).json({ success: false, error: "Latitude e longitude obrigatórias" });
        }
        const data = await copilotService.getCopilot(lat, lng);
        return res.json({ success: true, data });
    }
    catch (err) {
        return res.status(400).json({ success: false, error: err.message || "Erro no copiloto" });
    }
}
exports.default = { getCopilot };
//# sourceMappingURL=copilot.controller.js.map