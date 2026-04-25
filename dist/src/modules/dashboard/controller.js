"use strict";
const service = require("./service");
async function getDashboard(req, res) {
    try {
        const data = await service.getDashboard();
        res.json(data);
    }
    catch {
        res.status(500).json({ error: "Erro dashboard" });
    }
}
module.exports = { getDashboard };
//# sourceMappingURL=controller.js.map