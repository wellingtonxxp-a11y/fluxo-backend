"use strict";
const service = require("./service");
async function startFlow(req, res) {
    try {
        const data = await service.start(req.user.id, req.body);
        res.json(data);
    }
    catch {
        res.status(500).json({ error: "Erro start-flow" });
    }
}
async function finishFlow(req, res) {
    try {
        const data = await service.finish(req.user.id, req.body);
        res.json(data);
    }
    catch {
        res.status(500).json({ error: "Erro finish-flow" });
    }
}
async function getFlows(req, res) {
    try {
        const data = await service.list(req.user.id);
        res.json(data);
    }
    catch {
        res.status(500).json({ error: "Erro flows" });
    }
}
module.exports = { startFlow, finishFlow, getFlows };
//# sourceMappingURL=controller.js.map