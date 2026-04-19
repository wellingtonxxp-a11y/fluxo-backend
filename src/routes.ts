import express from "express";
import auth from "./middlewares/auth.middleware";
import geo from "./middlewares/geo.middleware";
import flowController from "./modules/flow/flow.controller";
import copilotController from "./modules/copilot/copilot.controller";
import feedbackController from "./modules/feedback/feedback.controller";
import strategyController from "./modules/strategy/strategy.controller";
import metricsController from "./modules/metrics/metrics.controller";

const router = express.Router();

router.post("/flow", auth, geo, flowController.createFlow);
router.get("/copilot", auth, geo, copilotController.getCopilot);
router.post("/feedback", auth, geo, feedbackController.submitFeedback);
router.post("/strategy/start", auth, strategyController.startStrategy);
router.post("/strategy/update", auth, strategyController.updateStrategy);
router.post("/strategy/end", auth, strategyController.endStrategy);
router.get("/metrics", auth, metricsController.getMetrics);

router.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint não encontrado" });
});

export = router;
