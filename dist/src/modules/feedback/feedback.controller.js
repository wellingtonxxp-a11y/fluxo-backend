"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const feedbackService = require("./feedback.service");
async function submitFeedback(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Usuário não autenticado" });
        }
        const feedback = await feedbackService.submitFeedback(userId, {
            lat: req.body.lat,
            lng: req.body.lng,
            type: req.body.type
        });
        return res.json({ success: true, data: feedback });
    }
    catch (err) {
        return res.status(400).json({ success: false, error: err.message || "Falha ao enviar feedback" });
    }
}
exports.default = { submitFeedback };
//# sourceMappingURL=feedback.controller.js.map