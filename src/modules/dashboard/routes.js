const router = require("express").Router();
const auth = require("../../middlewares/auth");
const controller = require("./controller");

router.get("/", auth, controller.getDashboard);

module.exports = router;
