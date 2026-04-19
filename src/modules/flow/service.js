const prisma = require("../../../prisma");
const { getHotspotPlace } = require("../../services/places.services");

// ================= START FLOW =================
async function start(userId, data) {
  let placeName = null;
  let placeAddress = null;

  // 🔥 tenta enriquecer com Google Places
  if (data.latitude && data.longitude) {
    try {
      const place = await getHotspotPlace(data.latitude, data.longitude);

      placeName = place.name || null;
      placeAddress = place.address || null;

    } catch (err) {
      // falha silenciosa (não quebra o fluxo)
    }
  }

  return prisma.flow.create({
    data: {
      userId,
      platform: data.platform,
      zone: data.zone,

      // 📍 localização
      latitude: data.latitude || null,
      longitude: data.longitude || null,

      // 🧠 enriquecimento
      placeName,
      placeAddress,

      startedAt: new Date()
    }
  });
}

// ================= FINISH FLOW =================
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
      value: Number(data.value),
      km: Number(data.km)
    }
  });
}

// ================= LIST =================
async function list(userId) {
  return prisma.flow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

module.exports = { start, finish, list };