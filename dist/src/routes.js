"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = __importDefault(require("./middlewares/auth.middleware"));
const geo_middleware_1 = __importDefault(require("./middlewares/geo.middleware"));
const flow_controller_1 = __importDefault(require("./modules/flow/flow.controller"));
const copilot_controller_1 = __importDefault(require("./modules/copilot/copilot.controller"));
const feedback_controller_1 = __importDefault(require("./modules/feedback/feedback.controller"));
const strategy_controller_1 = __importDefault(require("./modules/strategy/strategy.controller"));
const metrics_controller_1 = __importDefault(require("./modules/metrics/metrics.controller"));
const router = express_1.default.Router();
router.post("/flow", auth_middleware_1.default, geo_middleware_1.default, flow_controller_1.default.createFlow);
router.get("/copilot", auth_middleware_1.default, geo_middleware_1.default, copilot_controller_1.default.getCopilot);
router.post("/feedback", auth_middleware_1.default, geo_middleware_1.default, feedback_controller_1.default.submitFeedback);
router.post("/strategy/start", auth_middleware_1.default, strategy_controller_1.default.startStrategy);
router.post("/strategy/update", auth_middleware_1.default, strategy_controller_1.default.updateStrategy);
router.post("/strategy/end", auth_middleware_1.default, strategy_controller_1.default.endStrategy);
router.get("/metrics", auth_middleware_1.default, metrics_controller_1.default.getMetrics);
router.use((req, res) => {
    res.status(404).json({ success: false, error: "Endpoint não encontrado" });
});
module.exports = router;
//# sourceMappingURL=routes.js.map