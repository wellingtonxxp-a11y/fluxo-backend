const prisma = require("../../prisma");

const FEEDBACK_SCORE = {
  GOOD: 3,
  BAD: -2,
  DANGER: -4,
  TRAFFIC: 1,
  HIGH: 2
};

async function getOrCreateReputation(userId: number) {
  let reputation = await prisma.userReputation.findUnique({ where: { userId } });

  if (!reputation) {
    reputation = await prisma.userReputation.create({
      data: {
        userId,
        score: 0,
        feedbackCount: 0
      }
    });
  }

  return reputation;
}

function reputationWeight(reputation: any) {
  const base = Math.min(2, Math.max(0.5, 1 + reputation.score / 100));
  return base;
}

async function updateReputation(userId: number, type: string, weight: number) {
  const reputation = await getOrCreateReputation(userId);
  const delta = (FEEDBACK_SCORE[type] ?? 0) * (weight / 10);
  const nextScore = Math.max(-100, Math.min(100, reputation.score + delta));

  return prisma.userReputation.update({
    where: { userId },
    data: {
      score: nextScore,
      feedbackCount: reputation.feedbackCount + 1
    }
  });
}

export default { getOrCreateReputation, reputationWeight, updateReputation };
