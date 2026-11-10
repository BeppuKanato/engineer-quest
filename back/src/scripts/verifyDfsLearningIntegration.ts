import assert from "node:assert/strict";
import { LearningProgressStatus, type Prisma } from "@prisma/client";
import { achievementSeed } from "../../prisma/seedData/achievementSeed";
import { courseSeed } from "../../prisma/seedData/courseSeed";
import {
  BFS_COURSE_ID, DFS_COURSE_ID, DFS_CARD_PHASE_SLOTS, KNOWLEDGE_CARD_TABLE_COUNT,
  knowledgeCardPhaseScheduleSeed, knowledgeCardSeed,
} from "../../prisma/seedData/knowledgeCardSeed";
import { prisma } from "../lib/prisma";
import { evaluateAchievementsForUser } from "../service/achievement.service";
import { completePhaseByUser, completeUnitByUser, getUnitProgressByUser, ingestLearningEvents, startUnitByUser } from "../service/learning.service";

const phases = ["motivation", "execution", "check", "code-mapping", "code-check", "consolidation", "implementation"].map(stage => `dfs-${stage}`);
const dfsCards = knowledgeCardSeed.filter(card => card.courseId === DFS_COURSE_ID);
assert.deepEqual(dfsCards.map(card => [card.title, card.rarity]), [
  ["トポロジカルソート", "RARE"], ["リストで作るスタック", "COMMON"], ["バックトラッキング", "EPIC"],
]);
assert.deepEqual(DFS_CARD_PHASE_SLOTS.map(slot => slot.phaseKey), [phases[1], phases[4], phases[6]]);
assert.equal(DFS_CARD_PHASE_SLOTS.every((slot, index) => slot.knowledgeCardId === dfsCards[index].id), true);
const course = courseSeed.find(item => item.id === DFS_COURSE_ID);
assert(course?.isPublished && course.version === 1 && course.description.includes("スタック"));
for (let table = 1; table <= KNOWLEDGE_CARD_TABLE_COUNT; table++) {
  const stagesFor = (courseId: string, prefix: string): string[] => knowledgeCardPhaseScheduleSeed
    .filter(entry => entry.courseId === courseId && entry.courseVersion === course.version && entry.tableNumber === table)
    .map(entry => entry.phaseKey.slice(prefix.length));
  assert.deepEqual(stagesFor(DFS_COURSE_ID, "dfs-"), stagesFor(BFS_COURSE_ID, "bfs-"));
}

// 既存の Prisma 呼び出しをメモリへ差し替えて、実サービスの進捗・報酬・評価を通す。
type Scope = { userId: string; courseId: string };
type PhaseScope = Scope & { phaseKey: string };
type CardScope = { userId: string; knowledgeCardId: string };
type AchievementScope = { userId: string; achievementId: string };
type UnitRow = Scope & { status: LearningProgressStatus; lastPhaseKey: string | null; startedAt: Date; completedAt: Date | null };
type PhaseRow = Omit<UnitRow, "lastPhaseKey"> & { phaseKey: string; summary: Prisma.JsonValue };
type ScheduleScope = Scope & { courseVersion: number; tableNumber: number; phaseKey: string };
const units = new Map<string, UnitRow>();
const records = new Map<string, PhaseRow>();
const cards = new Map<string, Set<string>>();
const owned = new Map<string, Set<string>>();
const logged: Prisma.LearningEventCreateManyInput[] = [];
const cardById = new Map(knowledgeCardSeed.map(card => [card.id, card]));
const awards = achievementSeed.filter(item => item.courseId === DFS_COURSE_ID || item.id === "ach-knowledge-lv2");
const courseKey = ({ userId, courseId }: Scope) => `${userId}:${courseId}`;
const phaseKey = (scope: PhaseScope) => `${courseKey(scope)}:${scope.phaseKey}`;
const addOwned = (index: Map<string, Set<string>>, userId: string, id: string) => {
  const set = index.get(userId) ?? new Set<string>();
  set.add(id);
  index.set(userId, set);
};
const now = new Date("2026-11-10T00:00:00Z");

Object.assign(prisma, { $transaction: async (operation: (tx: typeof prisma) => unknown) => operation(prisma) });
Object.assign(prisma.course, { findFirst: async ({ where }: { where: { id: string; isPublished: boolean } }) =>
  courseSeed.find(item => item.id === where.id && item.isPublished === where.isPublished) ?? null });
Object.assign(prisma.unitLearningProgress, {
  findUnique: async ({ where }: { where: { userId_courseId: Scope } }) => units.get(courseKey(where.userId_courseId)) ?? null,
  findMany: async ({ where }: { where: Scope }) => [...units.values()].filter(row => row.userId === where.userId && (!where.courseId || row.courseId === where.courseId)),
  upsert: async ({ where, create, update }: { where: { userId_courseId: Scope }; create: UnitRow; update: Partial<UnitRow> }) => {
    const key = courseKey(where.userId_courseId), existing = units.get(key);
    const row = existing ? { ...existing, ...update } : { ...create, lastPhaseKey: create.lastPhaseKey ?? null, completedAt: create.completedAt ?? null, startedAt: now };
    units.set(key, row);
    return row;
  },
});
Object.assign(prisma.phaseLearningProgress, {
  findMany: async ({ where }: { where: Scope }) => [...records.values()].filter(row => row.userId === where.userId && (!where.courseId || row.courseId === where.courseId)),
  upsert: async ({ where, create, update }: { where: { userId_courseId_phaseKey: PhaseScope }; create: PhaseRow; update: Partial<PhaseRow> }) => {
    const key = phaseKey(where.userId_courseId_phaseKey), existing = records.get(key);
    const row = existing ? { ...existing, ...update } : { ...create, summary: create.summary ?? null, startedAt: now };
    records.set(key, row);
    return row;
  },
});
Object.assign(prisma.knowledgeCardPhaseScheduleEntry, { findUnique: async ({ where }: {
  where: { courseId_courseVersion_tableNumber_phaseKey: Omit<ScheduleScope, "userId"> };
}) => {
  const key = where.courseId_courseVersion_tableNumber_phaseKey;
  const entry = knowledgeCardPhaseScheduleSeed.find(item => item.courseId === key.courseId && item.courseVersion === key.courseVersion
    && item.tableNumber === key.tableNumber && item.phaseKey === key.phaseKey);
  return entry ? { ...entry, knowledgeCard: cardById.get(entry.knowledgeCardId) } : null;
} });
Object.assign(prisma.userKnowledgeCard, {
  findUnique: async ({ where }: { where: { userId_knowledgeCardId: CardScope } }) =>
    cards.get(where.userId_knowledgeCardId.userId)?.has(where.userId_knowledgeCardId.knowledgeCardId) ? { id: "owned" } : null,
  create: async ({ data }: { data: CardScope }) => addOwned(cards, data.userId, data.knowledgeCardId),
  findMany: async ({ where }: { where: { userId: string } }) =>
    [...(cards.get(where.userId) ?? [])].map(id => {
      const card = cardById.get(id);
      assert(card, `Unknown awarded card ${id}`);
      return { knowledgeCard: { courseId: card.courseId } };
    }),
});
Object.assign(prisma.user, { findUnique: async ({ where }: { where: { id: string } }) => ({ id: where.id }) });
Object.assign(prisma.createQuestAttempt, { findMany: async () => [] });
Object.assign(prisma.createQuestSubmission, { findMany: async () => [] });
Object.assign(prisma.bigGoal, { findMany: async () => [] });
Object.assign(prisma.achievement, { findMany: async () => awards });
Object.assign(prisma.userAchievement, {
  findMany: async ({ where }: { where: { userId: string } }) => [...(owned.get(where.userId) ?? [])].map(achievementId => ({ achievementId })),
  upsert: async ({ create }: { create: AchievementScope }) => {
    addOwned(owned, create.userId, create.achievementId);
    return { achievement: awards.find(item => item.id === create.achievementId), achievedAt: now };
  },
});
Object.assign(prisma.learningEvent, { createMany: async ({ data }: { data: Prisma.LearningEventCreateManyInput[] }) => {
  logged.push(...data);
  return { count: data.length };
} });

async function main() {
  const learner = { id: "dfs-learner", knowledgeCardTableNumber: 1 };
  for (const card of knowledgeCardSeed.filter(card => card.courseId === BFS_COURSE_ID)) {
    assert(card.id);
    addOwned(cards, learner.id, card.id);
  }
  assert.deepEqual(await evaluateAchievementsForUser(learner.id), [], "Other courses cannot grant DFS card completion");
  assert.equal((await getUnitProgressByUser(learner, DFS_COURSE_ID)).unit, null);
  await startUnitByUser(learner, DFS_COURSE_ID, phases[0]);

  const score = { firstAttemptCorrect: 2, totalQuestions: 2 };
  const completed = async (index: number, summary?: Record<string, unknown>) => completePhaseByUser(learner, DFS_COURSE_ID, phases[index], summary);
  await completed(0);
  assert.equal((await completed(1)).awardedCard?.id, dfsCards[0].id);
  assert.equal((await completed(1)).awardedCard, null, "A repeated completion cannot grant the same card");
  assert.deepEqual((await completed(2, score)).unlockedAchievements, [], "Both check stages must be perfect");
  const interrupted = await getUnitProgressByUser(learner, DFS_COURSE_ID);
  assert.equal(interrupted.unit?.status, "IN_PROGRESS");
  assert.equal(interrupted.unit?.lastPhaseKey, phases[2]);
  assert.deepEqual(interrupted.phases.at(-1)?.summary, score);

  await completed(3);
  const codeCheck = await completed(4, score);
  assert.equal(codeCheck.awardedCard?.id, dfsCards[1].id);
  assert.deepEqual(codeCheck.unlockedAchievements.map(item => item.id), ["ach-phase-dfs-check-perfect"]);
  assert.deepEqual((await completed(5, { firstAttemptCorrect: 5, totalQuestions: 5 })).unlockedAchievements.map(item => item.id), [
    "ach-phase-dfs-consolidation-perfect",
  ]);
  const implementation = await completed(6, { testRuns: 2, hintUsage: [0, 0, 0, 0] });
  assert.equal(implementation.awardedCard?.id, dfsCards[2].id);
  assert.deepEqual(implementation.unlockedAchievements.map(item => item.id).sort(), [
    "ach-dfs-card-complete", "ach-phase-dfs-implementation-clear", "ach-phase-dfs-implementation-nohint",
  ]);
  assert.deepEqual((await completeUnitByUser(learner, DFS_COURSE_ID)).unlockedAchievements.map(item => item.id), ["ach-unit-dfs-complete"]);
  assert.deepEqual((await completeUnitByUser(learner, DFS_COURSE_ID)).unlockedAchievements, []);
  await startUnitByUser(learner, DFS_COURSE_ID, phases[2]);
  const reviewed = await getUnitProgressByUser(learner, DFS_COURSE_ID);
  assert.equal(reviewed.unit?.status, "COMPLETED");
  assert.deepEqual(reviewed.phases.map(item => item.phaseKey), phases);
  assert.equal((await ingestLearningEvents(learner, "dfs-session", [{
    eventType: "answer_attempt", courseId: DFS_COURSE_ID, phaseKey: phases[2], targetId: "question",
    payload: { correct: false }, clientTimestamp: now.toISOString(),
  }])).accepted, 1);
  assert.equal(logged[0].phaseKey, phases[2]);

  const other = { id: "dfs-with-hints", knowledgeCardTableNumber: 6 };
  assert.equal((await completePhaseByUser(other, DFS_COURSE_ID, phases[1])).awardedCard, null);
  const assisted = await completePhaseByUser(other, DFS_COURSE_ID, phases[6], { hintUsage: [1, 0, 0, 0] });
  assert.deepEqual(assisted.unlockedAchievements.map(item => item.id), ["ach-phase-dfs-implementation-clear"]);
  console.log("DFS app integration verified: existing course, 15 card schedules, service progress and events, repeat safety, scoped awards and achievement conditions.");
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
