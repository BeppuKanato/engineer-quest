import { achievementSeed } from "../../prisma/seedData/achievementSeed";
import { KNOWLEDGE_CARD_TABLE_COUNT, knowledgeCardScheduleSeed, knowledgeCardSeed } from "../../prisma/seedData/knowledgeCardSeed";
import { createQuestSeed } from "../../prisma/seedData/createQuestSeed";
import { learningSeed } from "../../prisma/seedData/learningSeed";

const fail = (message: string): never => { throw new Error(message); };
const courseIds = new Set(learningSeed.courses.map((course) => course.id));
const questIds = new Set<string>(createQuestSeed.map((quest) => quest.id));
const missionIds = new Set(learningSeed.courses.flatMap((course) => course.missions.map((mission) => mission.id)));

if (learningSeed.courses.length !== 7) fail(`Expected 7 courses, found ${learningSeed.courses.length}`);
for (const course of learningSeed.courses) {
  const cards = knowledgeCardSeed.filter((card) => card.courseId === course.id);
  if (cards.length !== 5) fail(`${course.id}: expected 5 cards, found ${cards.length}`);
  const required = course.missions.filter((mission) => mission.isPublished && mission.isRequiredForCourseCompletion).sort((a, b) => a.order - b.order);
  if (required.length < cards.length) fail(`${course.id}: ${cards.length} cards cannot fit in ${required.length} required missions`);
  const finalMission = required.at(-1);
  const tableSignatures = new Set<string>();
  for (let table = 1; table <= KNOWLEDGE_CARD_TABLE_COUNT; table += 1) {
    const entries = knowledgeCardScheduleSeed.filter((entry) => entry.courseId === course.id && entry.courseVersion === course.version && entry.tableNumber === table);
    if (entries.length !== cards.length) fail(`${course.id} table ${table}: expected ${cards.length} entries, found ${entries.length}`);
    if (new Set(entries.map((entry) => entry.missionId)).size !== entries.length) fail(`${course.id} table ${table}: duplicate mission`);
    if (new Set(entries.map((entry) => entry.knowledgeCardId)).size !== cards.length) fail(`${course.id} table ${table}: missing or duplicate card`);
    if (!entries.some((entry) => entry.missionId === finalMission?.id)) fail(`${course.id} table ${table}: final required mission has no card`);
    tableSignatures.add(entries.map((entry) => `${entry.missionId}:${entry.knowledgeCardId}`).sort().join("|"));
  }
  if (tableSignatures.size < 10) fail(`${course.id}: only ${tableSignatures.size} distinct schedules across ${KNOWLEDGE_CARD_TABLE_COUNT} tables`);
}
for (const achievement of achievementSeed) {
  if (achievement.courseId && !courseIds.has(achievement.courseId)) fail(`${achievement.id}: unknown course ${achievement.courseId}`);
  if (achievement.missionId && !missionIds.has(achievement.missionId)) fail(`${achievement.id}: unknown mission ${achievement.missionId}`);
  if (achievement.createQuestId && !questIds.has(achievement.createQuestId)) fail(`${achievement.id}: unknown create quest ${achievement.createQuestId}`);
}
console.log(`Collection master data verified: ${learningSeed.courses.length} courses, ${knowledgeCardSeed.length} cards, ${knowledgeCardScheduleSeed.length} schedule entries, ${achievementSeed.length} achievements.`);
