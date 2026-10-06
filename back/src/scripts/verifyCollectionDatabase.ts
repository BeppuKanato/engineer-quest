import { prisma } from "../lib/prisma";
import { KNOWLEDGE_CARD_TABLE_COUNT } from "../../prisma/seedData/knowledgeCardSeed";

async function main() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: { id: true, version: true, knowledgeCards: { where: { isPublished: true }, select: { id: true } } },
  });
  const achievements = await prisma.achievement.count();
  const invalidTableUsers = await prisma.user.count({ where: { OR: [{ knowledgeCardTableNumber: { lt: 1 } }, { knowledgeCardTableNumber: { gt: KNOWLEDGE_CARD_TABLE_COUNT } }] } });
  if (invalidTableUsers > 0) throw new Error(`${invalidTableUsers} users have an invalid knowledge-card table number`);
  for (const course of courses) {
    if (course.knowledgeCards.length !== 5) throw new Error(`${course.id}: DB card count is ${course.knowledgeCards.length}`);
    for (let tableNumber = 1; tableNumber <= KNOWLEDGE_CARD_TABLE_COUNT; tableNumber += 1) {
      const rows = await prisma.knowledgeCardScheduleEntry.findMany({ where: { courseId: course.id, courseVersion: course.version, tableNumber }, select: { missionId: true, knowledgeCardId: true } });
      if (rows.length !== 5 || new Set(rows.map((row) => row.missionId)).size !== 5 || new Set(rows.map((row) => row.knowledgeCardId)).size !== 5) throw new Error(`${course.id} table ${tableNumber}: invalid DB schedule`);
    }
  }
  console.log(`Collection database verified: ${courses.length} courses, ${courses.reduce((sum, course) => sum + course.knowledgeCards.length, 0)} cards, ${achievements} achievements.`);
}

main().finally(() => prisma.$disconnect());
