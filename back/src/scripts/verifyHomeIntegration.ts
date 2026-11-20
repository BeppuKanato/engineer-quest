import assert from "node:assert/strict";
import { mock } from "node:test";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getHomeByUser, homeFeedbackStep } from "../service/home.service";
import definitions from "../learning/feedback/concepts.json";
import { knowledgeCardSeed } from "../../prisma/seedData/knowledgeCardSeed";
import { achievementSeed } from "../../prisma/seedData/achievementSeed";
const owner = "home-owner", now = new Date("2027-01-01T03:00:00Z");
const [bfs, dfs] = [definitions.find(unit => unit.kind === "bfs")!, definitions.find(unit => unit.kind === "dfs")!];
const user = { id: owner, displayName: "学び手", selectedMascotId: "red-panda", selectedTargetAchievementId: null };
let populated = true, completed = false;
const unitRows = () => !populated ? [] : [
  { courseId: bfs.courseId, status: completed ? "COMPLETED" : "IN_PROGRESS", lastPhaseKey: bfs.phases[1].id, startedAt: now, updatedAt: new Date("2026-12-30T00:00:00Z"), completedAt: completed ? now : null },
  { courseId: dfs.courseId, status: completed ? "COMPLETED" : "IN_PROGRESS", lastPhaseKey: dfs.phases[2].id, startedAt: new Date("2026-12-01T00:00:00Z"), updatedAt: now, completedAt: completed ? now : null },
];
const phaseRows = () => !populated ? [] : [
  ...[bfs, dfs].flatMap(unit => unit.phases.slice(0, 2).map(phase => ({ courseId: unit.courseId, phaseKey: phase.id, status: "COMPLETED", summary: null, completedAt: new Date("2026-12-31T03:00:00Z"), updatedAt: new Date("2026-12-31T03:00:00Z") }))),
  { courseId: dfs.courseId, phaseKey: dfs.phases[2].id, status: "IN_PROGRESS", summary: null, completedAt: null, updatedAt: now },
];
const readOnly = (methods: Record<string, unknown>) => new Proxy(methods, { get: (target, key: string) => {
  if (!(key in target)) throw new Error(`Forbidden DB operation: ${key}`); return target[key];
} });
const db = prisma as unknown as Record<string, unknown>;
db.course = readOnly({ findMany: async ({ where }: Prisma.CourseFindManyArgs) => { assert.equal(where?.isPublished, true); return definitions.map(unit => ({ id: unit.courseId, title: unit.title })); } });
db.unitLearningProgress = readOnly({ findMany: async ({ where }: Prisma.UnitLearningProgressFindManyArgs) => { assert.equal(where?.userId, owner); return unitRows().filter(row => !where?.completedAt || row.completedAt); } });
db.phaseLearningProgress = readOnly({ findMany: async ({ where }: Prisma.PhaseLearningProgressFindManyArgs) => { assert.equal(where?.userId, owner); return phaseRows().filter(row => !where?.completedAt || row.completedAt); } });
db.knowledgeCard = readOnly({ findMany: async ({ where, select }: Prisma.KnowledgeCardFindManyArgs) => {
  assert.equal(where?.isPublished, true); assert.deepEqual(where?.course, { isPublished: true });
  assert.deepEqual(select?.userKnowledgeCards, { where: { userId: owner }, select: { id: true } });
  return knowledgeCardSeed.map(card => ({ courseId: card.courseId, userKnowledgeCards: populated && card.courseId === bfs.courseId && card.catalogNumber < 3 ? [{ id: String(card.id) }] : [] }));
} });
db.userKnowledgeCard = readOnly({ findMany: async ({ where }: Prisma.UserKnowledgeCardFindManyArgs) => { assert.equal(where?.userId, owner); return populated ? [{ knowledgeCard: { courseId: bfs.courseId } }, { knowledgeCard: { courseId: bfs.courseId } }] : []; } });
db.createQuestAttempt = readOnly({ findMany: async ({ where }: Prisma.CreateQuestAttemptFindManyArgs) => { assert.equal(where?.userId, owner); return []; } });
db.createQuestSubmission = readOnly({ findMany: async ({ where }: Prisma.CreateQuestSubmissionFindManyArgs) => { assert.deepEqual(where, { attempt: { userId: owner } }); return populated ? [{ results: [], submittedAt: new Date("2026-12-30T03:00:00Z") }] : []; } });
db.achievement = readOnly({ findMany: async () => [...achievementSeed, { ...achievementSeed.find(a => a.id === "ach-streak-3")!, id: "secret", conditionValue: 3, isSecret: true }].map(a => ({ ...a, userAchievements: populated && a.id === "ach-streak-3" ? [{ achievedAt: now }] : [] })) });
db.userAchievement = readOnly({ count: async () => 0 });
db.feedbackV1 = readOnly({ findFirst: async ({ where, select }: Prisma.FeedbackV1FindFirstArgs) => {
  assert.deepEqual(where, { userId: owner, status: "COMPLETED" }); assert.deepEqual(select, { result: true });
  return populated ? { result: { selection: { candidates: [{ nextStep: "次の問題を\n確かめよう" }] } } } : null;
} });
db.questPost = readOnly({ findMany: async ({ where, take }: Prisma.QuestPostFindManyArgs) => {
  assert.equal(where?.category, "QUESTION"); assert.equal(where.status, "OPEN"); assert.equal(where.visibility, "PUBLIC"); assert.equal(take, 3);
  assert.deepEqual(where.createdAt, { gte: new Date(now.getTime() - 7 * 86400000), lte: now });
  return populated ? [{ id: "question", title: "新しい質問", createdAt: now }] : [];
} });
async function main() {
  mock.timers.enable({ apis: ["Date"], now: now.getTime() });
  try {
    const home = await getHomeByUser(user);
    assert.equal(home.overview.totalUnits, 7); assert.equal(home.overview.totalCards, 21); assert.equal(home.overview.collectedCards, 2);
    assert.equal(home.resume?.id, dfs.courseId, "開始日ではなく最近更新した単元に戻る");
    assert.equal(home.resume?.nextPhase, dfs.phases[2].formalName); assert.ok(home.resume?.resumeHref.endsWith(`?phase=${dfs.phases[2].id}`));
    assert.equal(home.resume?.nextStep, "次の問題を 確かめよう"); assert.equal(home.today.recommended?.id, dfs.courseId);
    assert.equal(home.today.nearCards[0]?.id, bfs.courseId); assert.equal(home.today.nearCards[0]?.collectedCards, 2);
    assert.ok(home.today.nearAchievements.length > 0 && home.today.nearAchievements.length <= 2);
    assert.ok(home.today.nearAchievements.every(a => a.progress > 0 && a.progress < a.goal));
    assert.ok(!home.today.nearAchievements.some(a => a.id === "ach-streak-3" || a.id === "secret"));
    assert.ok(home.today.nearAchievements.every((a, i, list) => i === 0 || Math.min(1, list[i - 1].progress / list[i - 1].goal) >= Math.min(1, a.progress / a.goal)));
    assert.deepEqual(home.week.days.filter(day => day.learned).map(day => day.date), ["2026-12-30", "2026-12-31"]);
    assert.equal(home.week.streakDays, 2, "今日未学習でも昨日までの継続を保つ");
    assert.equal(home.questions[0]?.href, "/quest-board/question");
    populated = false;
    const empty = await getHomeByUser(user);
    assert.equal(empty.resume, null); assert.equal(empty.hasInProgressUnit, false); assert.equal(empty.today.recommended?.id, definitions[0].courseId);
    assert.deepEqual(empty.today.nearAchievements, []); assert.deepEqual(empty.today.nearCards, []); assert.deepEqual(empty.questions, []);
    assert.equal(empty.week.streakDays, 0); assert.ok(empty.week.days.every(day => !day.learned));
    populated = true; completed = true;
    assert.notEqual((await getHomeByUser(user)).today.recommended?.id, bfs.courseId);
    assert.equal(homeFeedbackStep({ selection: { nextStep: "旧形式の一歩" } }), "旧形式の一歩");
    assert.equal(homeFeedbackStep({ selection: { candidates: [{ nextStep: " " }] } }), null); assert.equal(homeFeedbackStep(null), null);
    console.log("PASS: home integration read-only owner scopes, 7 units/21 cards, most recently updated phase resume, real evaluator progress, near cards, stored feedback, public recent questions, empty state, JST cross-month week and yesterday grace.");
  } finally { mock.timers.reset(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
