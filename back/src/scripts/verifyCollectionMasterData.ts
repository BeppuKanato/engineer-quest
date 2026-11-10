import { achievementSeed } from "../../prisma/seedData/achievementSeed";
import { courseSeed } from "../../prisma/seedData/courseSeed";
import { createQuestSeed } from "../../prisma/seedData/createQuestSeed";
import {
  BFS_CARD_PHASE_SLOTS,
  BFS_COURSE_ID,
  BINARY_SEARCH_CARD_PHASE_SLOTS,
  BINARY_SEARCH_COURSE_ID,
  BUBBLE_SORT_CARD_PHASE_SLOTS,
  BUBBLE_SORT_COURSE_ID,
  DFS_CARD_PHASE_SLOTS,
  DFS_COURSE_ID,
  KNOWLEDGE_CARD_TABLE_COUNT,
  MAZE_DIGGING_CARD_PHASE_SLOTS,
  MAZE_DIGGING_COURSE_ID,
  WALL_EXTENSION_CARD_PHASE_SLOTS,
  WALL_EXTENSION_COURSE_ID,
  knowledgeCardPhaseScheduleSeed,
  knowledgeCardSeed,
} from "../../prisma/seedData/knowledgeCardSeed";

const fail = (message: string): never => { throw new Error(message); };
const courseIds = new Set(courseSeed.map((course) => course.id));
const questIds = new Set<string>(createQuestSeed.map((quest) => quest.id));

if (courseSeed.length !== 9) fail(`Expected 9 courses, found ${courseSeed.length}`);
if (new Set(achievementSeed.map((a) => a.id)).size !== achievementSeed.length) fail("Duplicate achievement ids");

// フェーズキー（front の単元コンテンツが正本。seed 側の参照整合性のためにここで固定する）
const BFS_PHASE_KEYS: readonly string[] = [
  "bfs-motivation",
  "bfs-execution",
  "bfs-check",
  "bfs-code-mapping",
  "bfs-code-check",
  "bfs-consolidation",
  "bfs-implementation",
];
const DFS_PHASE_KEYS: readonly string[] = [
  "dfs-motivation",
  "dfs-execution",
  "dfs-check",
  "dfs-code-mapping",
  "dfs-code-check",
  "dfs-consolidation",
  "dfs-implementation",
];
const WALL_EXTENSION_PHASE_KEYS: readonly string[] = [
  "wall-extension-motivation",
  "wall-extension-execution",
  "wall-extension-check",
  "wall-extension-code-mapping",
  "wall-extension-code-check",
  "wall-extension-consolidation",
  "wall-extension-implementation",
];

const BUBBLE_SORT_PHASE_KEYS: readonly string[] = [
  "bubble-sort-motivation",
  "bubble-sort-execution",
  "bubble-sort-check",
  "bubble-sort-code-mapping",
  "bubble-sort-code-check",
  "bubble-sort-consolidation",
  "bubble-sort-implementation",
];

const MAZE_DIGGING_PHASE_KEYS: readonly string[] = [
  "maze-digging-motivation",
  "maze-digging-execution",
  "maze-digging-check",
  "maze-digging-code-mapping",
  "maze-digging-code-check",
  "maze-digging-consolidation",
  "maze-digging-implementation",
];

const BINARY_SEARCH_PHASE_KEYS: readonly string[] = [
  "binary-search-motivation",
  "binary-search-execution",
  "binary-search-check",
  "binary-search-code-mapping",
  "binary-search-code-check",
  "binary-search-consolidation",
  "binary-search-implementation",
];

/** カードを持つ単元ごとの、カード配布スロットとフェーズキー。 */
const CARD_COURSES = [
  { courseId: BFS_COURSE_ID, slots: BFS_CARD_PHASE_SLOTS, phaseKeys: BFS_PHASE_KEYS },
  { courseId: DFS_COURSE_ID, slots: DFS_CARD_PHASE_SLOTS, phaseKeys: DFS_PHASE_KEYS },
  { courseId: WALL_EXTENSION_COURSE_ID, slots: WALL_EXTENSION_CARD_PHASE_SLOTS, phaseKeys: WALL_EXTENSION_PHASE_KEYS },
  { courseId: BUBBLE_SORT_COURSE_ID, slots: BUBBLE_SORT_CARD_PHASE_SLOTS, phaseKeys: BUBBLE_SORT_PHASE_KEYS },
  { courseId: MAZE_DIGGING_COURSE_ID, slots: MAZE_DIGGING_CARD_PHASE_SLOTS, phaseKeys: MAZE_DIGGING_PHASE_KEYS },
  { courseId: BINARY_SEARCH_COURSE_ID, slots: BINARY_SEARCH_CARD_PHASE_SLOTS, phaseKeys: BINARY_SEARCH_PHASE_KEYS },
] as const;

// 知識カード: カードを持つ単元ごとに3枚（Issue #108 の BFS に、Issue #215 で棒倒し法、Issue #236 でバブルソート、Issue #266 で穴掘り法、Issue #295 で二分探索を追加）
const expectedCardCount = CARD_COURSES.reduce((sum, course) => sum + course.slots.length, 0);
if (knowledgeCardSeed.length !== expectedCardCount) fail(`Card pool must contain ${expectedCardCount} cards, got ${knowledgeCardSeed.length}`);
for (const card of knowledgeCardSeed) {
  if (!courseIds.has(card.courseId)) fail(`knowledge card ${card.id} references unknown course ${card.courseId}`);
  if (!card.description || !card.connection || !card.useCase) fail(`knowledge card ${card.id} misses description/connection/useCase`);
}
const cardIds = new Set(knowledgeCardSeed.map((card) => card.id));
const catalogs = new Set(knowledgeCardSeed.map((card) => `${card.courseId}:${card.catalogNumber}`));
if (catalogs.size !== knowledgeCardSeed.length) fail("duplicate catalogNumber within a course");
for (const course of CARD_COURSES) {
  const courseCards = new Set(knowledgeCardSeed.filter((card) => card.courseId === course.courseId).map((card) => card.id));
  for (const slot of course.slots) {
    if (!courseCards.has(slot.knowledgeCardId)) fail(`slot ${slot.phaseKey} references card ${slot.knowledgeCardId} outside course ${course.courseId}`);
  }
}

// スケジュール表: 単元ごとにテーブル 1..KNOWLEDGE_CARD_TABLE_COUNT が揃い、各行が正しいフェーズ→カード対応を指す
for (const course of CARD_COURSES) {
  const tables = new Map<number, number>();
  for (const entry of knowledgeCardPhaseScheduleSeed.filter((e) => e.courseId === course.courseId)) {
    if (!cardIds.has(entry.knowledgeCardId)) fail(`schedule ${entry.id} references unknown card ${entry.knowledgeCardId}`);
    const slot = course.slots.find((s) => s.phaseKey === entry.phaseKey);
    if (!slot) throw new Error(`schedule ${entry.id} uses a phase that awards no card: ${entry.phaseKey}`);
    if (slot.knowledgeCardId !== entry.knowledgeCardId) fail(`schedule ${entry.id} maps ${entry.phaseKey} to ${entry.knowledgeCardId}, expected ${slot.knowledgeCardId}`);
    tables.set(entry.tableNumber, (tables.get(entry.tableNumber) ?? 0) + 1);
  }
  for (let table = 1; table <= KNOWLEDGE_CARD_TABLE_COUNT; table += 1) {
    const count = tables.get(table) ?? 0;
    if (count < 1 || count > course.slots.length) fail(`schedule table ${table} for ${course.courseId} has ${count} entries (must be 1..${course.slots.length})`);
  }
}
const scheduledCourseIds = new Set(knowledgeCardPhaseScheduleSeed.map((entry) => entry.courseId));
for (const courseId of scheduledCourseIds) {
  if (!CARD_COURSES.some((course) => course.courseId === courseId)) fail(`schedule entries exist for course without card slots: ${courseId}`);
}

for (const achievement of achievementSeed) {
  if (achievement.courseId && !courseIds.has(achievement.courseId)) fail(`${achievement.id}: unknown course ${achievement.courseId}`);
  if (achievement.createQuestId && !questIds.has(achievement.createQuestId)) fail(`${achievement.id}: unknown create quest ${achievement.createQuestId}`);
  const phaseKey = (achievement as { phaseKey?: string | null }).phaseKey;
  if (phaseKey) {
    const course = CARD_COURSES.find((c) => c.courseId === achievement.courseId);
    if (!course) throw new Error(`${achievement.id}: phaseKey requires a course scope with known phase keys`);
    for (const key of phaseKey.split(",")) {
      if (!course.phaseKeys.includes(key.trim())) fail(`${achievement.id}: unknown phase key ${key}`);
    }
  }
}
console.log(`Collection master data verified: ${courseSeed.length} courses, ${achievementSeed.length} achievements, ${knowledgeCardSeed.length} knowledge cards, ${knowledgeCardPhaseScheduleSeed.length} schedule entries across ${KNOWLEDGE_CARD_TABLE_COUNT} tables per course.`);
