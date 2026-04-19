const prisma = require("../../../prisma");

async function startSession(userId: number, payload: any) {
  return prisma.strategySession.create({
    data: {
      userId,
      status: "active",
      totalDistance: payload.distance || 0,
      totalTimeMin: payload.timeMin || 0,
      totalScore: payload.score || 0
    }
  });
}

async function updateSession(userId: number, payload: any) {
  const session = await prisma.strategySession.findFirst({
    where: { id: Number(payload.sessionId), userId, status: "active" }
  });

  if (!session) {
    throw new Error("Sessão de estratégia não encontrada ou já finalizada");
  }

  return prisma.strategySession.update({
    where: { id: session.id },
    data: {
      totalDistance: session.totalDistance + Number(payload.distance || 0),
      totalTimeMin: session.totalTimeMin + Number(payload.timeMin || 0),
      totalScore: session.totalScore + Number(payload.score || 0)
    }
  });
}

async function endSession(userId: number, payload: any) {
  const session = await prisma.strategySession.findFirst({
    where: { id: Number(payload.sessionId), userId, status: "active" }
  });

  if (!session) {
    throw new Error("Sessão de estratégia não encontrada ou já encerrada");
  }

  return prisma.strategySession.update({
    where: { id: session.id },
    data: {
      status: "ended",
      endedAt: new Date()
    }
  });
}

export default { startSession, updateSession, endSession };
