const strategyService = require("./strategy.service");

async function startStrategy(req: any, res: any) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Usuário não autenticado" });
    }

    const data = await strategyService.startSession(userId, {
      distance: req.body.distance,
      timeMin: req.body.timeMin,
      score: req.body.score
    });

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || "Falha ao iniciar estratégia" });
  }
}

async function updateStrategy(req: any, res: any) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Usuário não autenticado" });
    }

    const data = await strategyService.updateSession(userId, {
      sessionId: req.body.sessionId,
      distance: req.body.distance,
      timeMin: req.body.timeMin,
      score: req.body.score
    });

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || "Falha ao atualizar estratégia" });
  }
}

async function endStrategy(req: any, res: any) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Usuário não autenticado" });
    }

    const data = await strategyService.endSession(userId, {
      sessionId: req.body.sessionId
    });

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || "Falha ao encerrar estratégia" });
  }
}

export default { startStrategy, updateStrategy, endStrategy };
