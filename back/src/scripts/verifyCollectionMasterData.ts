import { achievementSeed } from "../../prisma/seedData/achievementSeed";
import { courseSeed } from "../../prisma/seedData/courseSeed";
import { createQuestSeed } from "../../prisma/seedData/createQuestSeed";

const fail = (message: string): never => { throw new Error(message); };
const courseIds = new Set(courseSeed.map((course) => course.id));
const questIds = new Set<string>(createQuestSeed.map((quest) => quest.id));

if (courseSeed.length !== 7) fail(`Expected 7 courses, found ${courseSeed.length}`);
if (new Set(achievementSeed.map((a) => a.id)).size !== achievementSeed.length) fail("Duplicate achievement ids");
for (const achievement of achievementSeed) {
  if (achievement.courseId && !courseIds.has(achievement.courseId)) fail(`${achievement.id}: unknown course ${achievement.courseId}`);
  if (achievement.createQuestId && !questIds.has(achievement.createQuestId)) fail(`${achievement.id}: unknown create quest ${achievement.createQuestId}`);
}
console.log(`Collection master data verified: ${courseSeed.length} courses, ${achievementSeed.length} achievements. Knowledge cards return with #78.`);
