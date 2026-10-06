import { prisma } from "../lib/prisma";
import { awardScheduledKnowledgeCard } from "../service/knowledgeCard.service";
import { evaluateAchievementsForUser } from "../service/achievement.service";

const firebaseUid = "e2e-collection-reward-user";
async function main() {
  await prisma.user.deleteMany({ where: { firebaseUid } });
  const user = await prisma.user.create({ data: { firebaseUid, displayName: "Collection E2E", knowledgeCardTableNumber: 7 } });
  try {
    const schedules = await prisma.knowledgeCardScheduleEntry.findMany({ where: { tableNumber: 7 }, include: { course: { select: { version: true } } } });
    for (const row of schedules) {
      const award = await prisma.$transaction((tx) => awardScheduledKnowledgeCard(tx, { userId: user.id, missionId: row.missionId, courseId: row.courseId, courseVersion: row.course.version, tableNumber: 7 }));
      if (!award?.newlyCollected) throw new Error(`${row.id}: first award was not new`);
    }
    const repeated = schedules[0];
    const duplicate = await prisma.$transaction((tx) => awardScheduledKnowledgeCard(tx, { userId: user.id, missionId: repeated.missionId, courseId: repeated.courseId, courseVersion: repeated.course.version, tableNumber: 7 }));
    if (!duplicate || duplicate.newlyCollected) throw new Error("Repeated award was not idempotent");
    const cardCount = await prisma.userKnowledgeCard.count({ where: { userId: user.id } });
    if (cardCount !== 35) throw new Error(`Expected 35 cards, found ${cardCount}`);
    await evaluateAchievementsForUser(user.id);
    const collectionAchievementCount = await prisma.userAchievement.count({ where: { userId: user.id, achievement: { category: "COLLECTION" } } });
    if (collectionAchievementCount !== 3) throw new Error(`Expected 3 collection achievements, found ${collectionAchievementCount}`);
    console.log("Collection reward E2E passed: deterministic 35-card award, idempotency, and 3 collection achievements.");
  } finally {
    await prisma.user.deleteMany({ where: { firebaseUid } });
  }
}
main().finally(() => prisma.$disconnect());
