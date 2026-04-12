const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const { getRealtimeRecommendation } = require("./service");

router.get("/copilot", auth, async (req, res) => {
  try {
    const data = await getRealtimeRecommendation(req.user.id);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Erro realtime" });
  }
});

module.exports = router;