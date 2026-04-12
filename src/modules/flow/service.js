const prisma = require("../prisma");

async function start(userId, data) {
  return prisma.flow.create({
    data: {
      userId,
      platform: data.platform,
      zone: data.zone,
      startedAt: new Date()
    }
  });
}

async function finish(userId, data) {
  const flow = await prisma.flow.findFirst({
    where: {
      id: data.flow_id,
      userId
    }
  });

  if (!flow) throw new Error("Fluxo não encontrado");

  const duration =
    (new Date() - new Date(flow.startedAt)) / 60000;

  return prisma.flow.update({
    where: { id: flow.id },
    data: {
      finishedAt: new Date(),
      durationMin: duration,
      value: data.value,
      km: data.km
    }
  });
}

async function list(userId) {
  return prisma.flow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

module.exports = { start, finish, list };
