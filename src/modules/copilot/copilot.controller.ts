const copilotService = require("./copilot.service");

async function getCopilot(req: any, res: any) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, error: "Latitude e longitude obrigatórias" });
    }

    const data = await copilotService.getCopilot(lat, lng);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || "Erro no copiloto" });
  }
}

export default { getCopilot };
