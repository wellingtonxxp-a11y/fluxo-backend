const flowService = require("./flow.service");

async function createFlow(req: any, res: any) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Usuário não autenticado" });
    }

    const data = await flowService.ingestFlow(userId, {
      lat: req.body.lat,
      lng: req.body.lng,
      platform: req.body.platform,
      placeName: req.body.placeName,
      placeAddress: req.body.placeAddress
    });

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || "Falha ao salvar fluxo" });
  }
}

export default { createFlow };
