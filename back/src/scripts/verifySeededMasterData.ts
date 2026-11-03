import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { achievementSeed } from "../../prisma/seedData/achievementSeed";
import { createQuestSeed } from "../../prisma/seedData/createQuestSeed";
import { knowledgeCardSeed, knowledgeCardScheduleSeed } from "../../prisma/seedData/knowledgeCardSeed";

const prisma = new PrismaClient();
function assertFields(actual: object | undefined, expected: object, label: string) {
  assert(actual, `${label} missing`);
  const row = actual as Record<string, unknown>;
  for (const [key, value] of Object.entries(JSON.parse(JSON.stringify(expected)) as Record<string, unknown>)) {
    assert.deepEqual(row[key], value, `${label}.${key} differs from seed`);
  }
}
async function main() {
  const [quests, achievements, cards, schedules] = await Promise.all([
    prisma.createQuest.findMany({ include: { requirements: true, relatedCourses: true } }),
    prisma.achievement.findMany(), prisma.knowledgeCard.findMany(), prisma.knowledgeCardScheduleEntry.findMany(),
  ]);
  for (const expected of createQuestSeed) {
    const { requirements, relatedCourses, ...definition } = expected;
    const row = quests.find(q => q.id === expected.id);
    assertFields(row, { ...definition, isPublished: true }, expected.id);
    for (const r of requirements) assertFields(row?.requirements.find(item => item.id === r.id), { ...r, questId: expected.id }, r.id);
    for (const c of relatedCourses) assertFields(row?.relatedCourses.find(item => item.courseId === c.courseId), { ...c, questId: expected.id }, `${expected.id}/${c.courseId}`);
  }
  for (const expected of achievementSeed) assertFields(achievements.find(row => row.id === expected.id), expected, String(expected.id));
  for (const expected of knowledgeCardSeed) assertFields(cards.find(row => row.id === expected.id), expected, String(expected.id));
  for (const expected of knowledgeCardScheduleSeed) assertFields(schedules.find(row => row.id === expected.id), expected, String(expected.id));
  console.log(`Seeded master fields verified: ${createQuestSeed.length} create quests, ${achievementSeed.length} achievements, ${knowledgeCardSeed.length} cards, ${knowledgeCardScheduleSeed.length} schedule entries.`);
}
void main().catch(error => { console.error(error instanceof Error ? error.message : "Verification failed"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
