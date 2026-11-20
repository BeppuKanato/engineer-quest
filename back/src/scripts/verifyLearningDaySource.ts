import assert from "node:assert/strict";
import { mock } from "node:test";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { getHomeCalendar } from "../service/home.service";
import { getHistoryByUserId } from "../service/history.service";

const userId = "learning-day-test";
const courseId = "course-algorithm-breadth-first-search-v1";
const course = { title: "幅優先探索（BFS）" };
type ProgressRow = { id: string; userId: string; courseId: string; phaseKey: string; completedAt: Date | null; course: typeof course };
let phases: ProgressRow[] = [];
let units: ProgressRow[] = [];
let submissions: { id: string; submittedAt: Date; score: number; maxScore: number; attempt: { userId: string; quest: { title: string } } }[] = [];
const row = (id: string, at: string | null, phaseKey = "bfs-check", owner = userId): ProgressRow => ({
  id, userId: owner, courseId, phaseKey, completedAt: at ? new Date(at) : null, course,
});

// 実DBには接続せず、所有条件・完了条件を確認して実サービスの読み取りを通す。
const completedRows = (rows: ProgressRow[], where: { userId?: unknown; completedAt?: unknown } | undefined) => {
  assert.equal(where?.userId, userId);
  assert.deepEqual(where?.completedAt, { not: null });
  return rows.filter((entry) => entry.userId === userId && entry.completedAt !== null);
};
Object.assign(prisma.phaseLearningProgress, { findMany: async (args: Prisma.PhaseLearningProgressFindManyArgs) => completedRows(phases, args.where) });
Object.assign(prisma.unitLearningProgress, { findMany: async (args: Prisma.UnitLearningProgressFindManyArgs) => completedRows(units, args.where) });
Object.assign(prisma.createQuestSubmission, { findMany: async (args: Prisma.CreateQuestSubmissionFindManyArgs) => {
  assert.deepEqual(args.where, { attempt: { userId } });
  return submissions.filter((entry) => entry.attempt.userId === userId);
} });
Object.assign(prisma.userAchievement, { count: async () => 0 });
Object.assign(prisma.userAchievement, { findMany: async () => [] });
Object.assign(prisma.userKnowledgeCard, { findMany: async () => [] });
Object.assign(prisma.createQuestFeedback, { findMany: async () => [] });
const calendar = async (now: string) => {
  mock.timers.reset();
  mock.timers.enable({ apis: ["Date"], now: new Date(now).getTime() });
  return (await getHomeCalendar(userId)).calendar;
};

async function main() {
  try {
    assert.deepEqual(await calendar("2026-11-18T23:00:00Z"), {
      year: 2026, month: 10, date: 19, learnedDays: [], continuationDays: 0, totalDays: 0, hasLearnedToday: false,
    });
    phases = [row("morning", "2026-11-18T23:00:00Z"), row("unfinished", null), row("other-user", "2026-11-17T23:00:00Z", "bfs-check", "other")];
    assert.deepEqual(await calendar("2026-11-18T23:30:00Z"), {
      year: 2026, month: 10, date: 19, learnedDays: [19], continuationDays: 1, totalDays: 1, hasLearnedToday: true,
    });
    phases.push(row("same-day", "2026-11-19T03:00:00Z"));
    units = [row("unit", "2026-11-17T23:00:00Z"), row("unfinished-unit", null)];
    submissions = [{ id: "work", submittedAt: new Date("2026-11-16T23:00:00Z"), score: 1, maxScore: 1, attempt: { userId, quest: { title: "作る課題" } } }];
    const mixed = await calendar("2026-11-19T04:00:00Z");
    assert.deepEqual(mixed.learnedDays, [17, 18, 19]);
    assert.equal(mixed.continuationDays, 3);
    assert.equal(mixed.totalDays, 3);
    assert.equal((await calendar("2026-11-20T04:00:00Z")).continuationDays, 0);

    phases = [];
    submissions = [];
    units = [row("unit-only", "2026-11-18T23:00:00Z")];
    assert.deepEqual(await calendar("2026-11-18T23:01:00Z"), {
      year: 2026, month: 10, date: 19, learnedDays: [19], continuationDays: 1, totalDays: 1, hasLearnedToday: true,
    });

    phases = [row("new-month", "2026-12-31T15:00:00Z"), row("previous-month", "2026-12-30T15:00:00Z")];
    units = [];
    submissions = [];
    assert.deepEqual(await calendar("2026-12-31T15:01:00Z"), {
      year: 2027, month: 0, date: 1, learnedDays: [1], continuationDays: 2, totalDays: 2, hasLearnedToday: true,
    });
    phases = [row("before-midnight", "2026-11-18T14:59:59Z"), row("midnight", "2026-11-18T15:00:00Z"), row("unknown", "2026-11-18T23:00:00Z", "unknown-phase")];
    units = [row("unit", "2026-11-19T00:00:00Z"), row("unfinished-unit", null)];
    const history = await getHistoryByUserId(userId);
    assert.deepEqual(history.events.map((event) => event.id), ["unit:unit", "phase:unknown", "phase:midnight", "phase:before-midnight"]);
    assert.equal(history.events[0].type, "unit_completed");
    assert.equal(history.events[0].title, `${course.title}を完了`);
    assert.equal(history.events[1].title, `${course.title}のフェーズを完了`);
    assert.equal(history.events[2].title, `${course.title}の「動きの確認問題」を完了`);
    assert(history.events.every((event) => event.href === `/courses/roadmap/${courseId}`));
    assert.deepEqual(history.groups.map((group) => [group.date, group.events.length]), [["2026/11/19", 3], ["2026/11/18", 1]]);

    phases = [];
    units = [];
    submissions = [{ id: "work-only", submittedAt: new Date("2026-11-18T23:00:00Z"), score: 2, maxScore: 3, attempt: { userId, quest: { title: "提出のみ" } } }];
    assert.equal((await calendar("2026-11-18T23:01:00Z")).hasLearnedToday, true);
    assert.equal((await getHistoryByUserId(userId)).events[0].type, "work_saved");
    console.log("verifyLearningDaySource: JST morning/midnight/year boundary, mixed-source streak, deduplication, ownership, incomplete exclusion, history labels/order/groups/links and submission regression passed");
  } finally {
    mock.timers.reset();
    await prisma.$disconnect();
  }
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
