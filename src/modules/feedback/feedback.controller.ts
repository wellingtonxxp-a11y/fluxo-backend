const feedbackService = require("./feedback.service");

async function submitFeedback(req: any, res: any) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Usuário não autenticado" });
    }

    const feedback = await feedbackService.submitFeedback(userId, {
      lat: req.body.lat,
      lng: req.body.lng,
      type: req.body.type
    });

    return res.json({ success: true, data: feedback });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || "Falha ao enviar feedback" });
  }
}

export default { submitFeedback };
