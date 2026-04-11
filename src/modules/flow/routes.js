const router = require("express").Router();
const auth = require("../../middleware/auth");
const controller = require("./controller");

router.post("/start", auth, controller.startFlow);
router.post("/finish", auth, controller.finishFlow);
router.get("/", auth, controller.getFlows);

module.exports = router;