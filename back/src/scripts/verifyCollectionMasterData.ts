import { achievementSeed } from "../../prisma/seedData/achievementSeed";
import { courseSeed } from "../../prisma/seedData/courseSeed";
import { createQuestSeed } from "../../prisma/seedData/createQuestSeed";
import {
  BFS_CARD_PHASE_SLOTS,
  BFS_COURSE_ID,
  KNOWLEDGE_CARD_TABLE_COUNT,
  knowledgeCardPhaseScheduleSeed,
  knowledgeCardSeed,
} from "../../prisma/seedData/knowledgeCardSeed";

const fail = (message: string): never => { throw new Error(message); };
const courseIds = new Set(courseSeed.map((course) => course.id));
const questIds = new Set<string>(createQuestSeed.map((quest) => quest.id));

if (courseSeed.length !== 7) fail(`Expected 7 courses, found ${courseSeed.length}`);
if (new Set(achievementSeed.map((a) => a.id)).size !== achievementSeed.length) fail("Duplicate achievement ids");

// 知識カード: BFS の 3 枚だけが現行プール（Issue #108）
if (knowledgeCardSeed.length !== 3) fail(`BFS card pool must contain 3 cards, got ${knowledgeCardSeed.length}`);
for (const card of knowledgeCardSeed) {
  if (!courseIds.has(card.courseId)) fail(`knowledge card ${card.id} references unknown course ${card.courseId}`);
  if (!card.description || !card.connection || !card.useCase) fail(`knowledge card ${card.id} misses description/connection/useCase`);
}
const cardIds = new Set(knowledgeCardSeed.map((card) => card.id));
const catalogs = new Set(knowledgeCardSeed.map((card) => `${card.courseId}:${card.catalogNumber}`));
if (catalogs.size !== knowledgeCardSeed.length) fail("duplicate catalogNumber within a course");

// スケジュール表: テーブル 1..KNOWLEDGE_CARD_TABLE_COUNT が揃い、各行が正しいフェーズ→カード対応を指す
const tables = new Map<number, number>();
for (const entry of knowledgeCardPhaseScheduleSeed) {
  if (!cardIds.has(entry.knowledgeCardId)) fail(`schedule ${entry.id} references unknown card ${entry.knowledgeCardId}`);
  const slot = BFS_CARD_PHASE_SLOTS.find((s) => s.phaseKey === entry.phaseKey);
  if (!slot) throw new Error(`schedule ${entry.id} uses a phase that awards no card: ${entry.phaseKey}`);
  if (slot.knowledgeCardId !== entry.knowledgeCardId) fail(`schedule ${entry.id} maps ${entry.phaseKey} to ${entry.knowledgeCardId}, expected ${slot.knowledgeCardId}`);
  tables.set(entry.tableNumber, (tables.get(entry.tableNumber) ?? 0) + 1);
}
for (let table = 1; table <= KNOWLEDGE_CARD_TABLE_COUNT; table += 1) {
  const count = tables.get(table) ?? 0;
  if (count < 1 || count > BFS_CARD_PHASE_SLOTS.length) fail(`schedule table ${table} has ${count} entries (must be 1..${BFS_CARD_PHASE_SLOTS.length})`);
}

// BFS のフェーズキー（front の単元コンテンツが正本。seed 側の参照整合性のためにここで固定する）
const BFS_PHASE_KEYS = [
  "bfs-motivation",
  "bfs-execution",
  "bfs-check",
  "bfs-code-mapping",
  "bfs-code-check",
  "bfs-consolidation",
  "bfs-implementation",
];

for (const achievement of achievementSeed) {
  if (achievement.courseId && !courseIds.has(achievement.courseId)) fail(`${achievement.id}: unknown course ${achievement.courseId}`);
  if (achievement.createQuestId && !questIds.has(achievement.createQuestId)) fail(`${achievement.id}: unknown create quest ${achievement.createQuestId}`);
  const phaseKey = (achievement as { phaseKey?: string | null }).phaseKey;
  if (phaseKey) {
    for (const key of phaseKey.split(",")) {
      if (!BFS_PHASE_KEYS.includes(key.trim())) fail(`${achievement.id}: unknown phase key ${key}`);
    }
    if (achievement.courseId !== BFS_COURSE_ID) fail(`${achievement.id}: phaseKey requires the BFS course scope`);
  }
}
console.log(`Collection master data verified: ${courseSeed.length} courses, ${achievementSeed.length} achievements, ${knowledgeCardSeed.length} knowledge cards, ${knowledgeCardPhaseScheduleSeed.length} schedule entries across ${KNOWLEDGE_CARD_TABLE_COUNT} tables.`);
