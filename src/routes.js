const express = require("express");

const authController = require("./modules/auth/controller");
const flowController = require("./modules/flow/controller");
const dashboardController = require("./modules/dashboard/controller");

const authMiddleware = require("./middlewares/auth");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("API Fluxo funcionando");
});

// AUTH
router.post("/register", authController.register);
router.post("/login", authController.login);

// FLOWS
router.post("/start-flow", authMiddleware, flowController.startFlow);
router.post("/finish-flow", authMiddleware, flowController.finishFlow);
router.get("/flows", authMiddleware, flowController.getFlows);

// DASHBOARD
router.get("/dashboard", authMiddleware, dashboardController.dashboard);
router.get("/zones", dashboardController.zones);
router.get("/recommendation", dashboardController.recommendation);

module.exports = router;