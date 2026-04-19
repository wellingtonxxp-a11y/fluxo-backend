const prisma = require("../../../prisma");
const { getZoneFromPoint } = require("../../services/zone.service");
const reputationService = require("../../services/reputation.service");
const antifraudService = require("../../services/antifraud.service");

const BASE_WEIGHTS: Record<string, number> = {
  GOOD: 1.2,
  BAD: 0.9,
  DANGER: 1.5,
  TRAFFIC: 0.6,
  HIGH: 1.1
};

async function submitFeedback(userId: number, payload: any) {
  const allowed = await antifraudService.checkFeedbackAllowed(userId);
  if (!allowed.allowed) {
    throw new Error(allowed.reason);
  }

  const zone = await getZoneFromPoint(Number(payload.lat), Number(payload.lng));
  const reputation = await reputationService.getOrCreateReputation(userId);
  const baseWeight = BASE_WEIGHTS[payload.type] ?? 0.7;
  const finalWeight = Math.max(0.1, baseWeight * reputationService.reputationWeight(reputation) * allowed.weightFactor);

  const feedback = await prisma.hotspotFeedback.create({
    data: {
      userId,
      zoneId: zone.id,
      latitude: Number(payload.lat),
      longitude: Number(payload.lng),
      type: payload.type,
      weight: finalWeight
    }
  });

  await reputationService.updateReputation(userId, payload.type, finalWeight);
  await prisma.zone.update({
    where: { id: zone.id },
    data: { demand: { increment: Math.max(1, Math.round(finalWeight)) } }
  });

  return feedback;
}

export default { submitFeedback };
