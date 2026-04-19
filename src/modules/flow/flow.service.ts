const prisma = require("../../../prisma");
const { getZoneFromPoint } = require("../../services/zone.service");

async function ingestFlow(userId: number, payload: any) {
  const latitude = Number(payload.lat);
  const longitude = Number(payload.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Latitude e longitude inválidas");
  }

  const zone = await getZoneFromPoint(latitude, longitude);

  const flow = await prisma.flow.create({
    data: {
      userId,
      platform: payload.platform || "ifood",
      zone: zone.name,
      zoneId: zone.id,
      latitude,
      longitude,
      placeName: payload.placeName || null,
      placeAddress: payload.placeAddress || null,
      startedAt: new Date()
    }
  });

  await prisma.zone.update({
    where: { id: zone.id },
    data: { demand: { increment: 1 } }
  });

  return flow;
}

export default { ingestFlow };
