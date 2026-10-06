import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { evaluateAchievementsForUser, updateProfileAchievementByUserId } from "../service/achievement.service";

const firebaseUid = "e2e-create-achievement-user";
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
async function main() {
  await prisma.user.deleteMany({ where: { firebaseUid } });
  const user = await prisma.user.create({ data: { firebaseUid, displayName: "Create Achievement E2E" } });
  try {
    const quests = await prisma.createQuest.findMany({ where: { isPublished: true }, include: { requirements: true }, orderBy: { sortOrder: "asc" } });
    for (const quest of quests) {
      const results = quest.requirements.map((requirement) => ({ requirementId: requirement.id, kind: requirement.kind, passed: true, points: requirement.points }));
      const attempt = await prisma.createQuestAttempt.create({ data: { userId: user.id, questId: quest.id, code: "def solution(): pass", status: "COMPLETED", bestScore: 100, completedAt: new Date() } });
      await prisma.createQuestSubmission.create({ data: { attemptId: attempt.id, code: attempt.code, score: 100, maxScore: 100, basicPassed: true, results: json(results) } });
    }
    await evaluateAchievementsForUser(user.id);
    const unlocked = await prisma.userAchievement.findMany({ where: { userId: user.id, achievement: { category: "CREATE_QUEST" } }, include: { achievement: true } });
    const expected = await prisma.achievement.count({ where: { category: "CREATE_QUEST" } });
    if (unlocked.length !== expected) throw new Error(`Expected ${expected} create-quest achievements, found ${unlocked.length}`);
    const selected = unlocked.find((item) => item.achievement.rarity === "LEGENDARY") ?? unlocked[0];
    await updateProfileAchievementByUserId(user.id, selected.achievementId);
    const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { selectedProfileAchievementId: true } });
    if (profile?.selectedProfileAchievementId !== selected.achievementId) throw new Error("Profile achievement selection did not persist");
    console.log(`Create-quest achievement E2E passed: ${unlocked.length} achievements and profile selection.`);
  } finally {
    await prisma.user.deleteMany({ where: { firebaseUid } });
  }
}
main().finally(() => prisma.$disconnect());
