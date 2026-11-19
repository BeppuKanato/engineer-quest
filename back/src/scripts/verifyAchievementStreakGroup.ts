import assert from "node:assert/strict";
import { mock } from "node:test";
import { AchievementCategory, AchievementConditionType as C, AchievementRarity, type Achievement, type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { evaluateAchievementsForUser, getAchievementsByUser } from "../service/achievement.service";
import { getCollectionByUser } from "../service/collection.service";
import { getHomeByUser } from "../service/home.service";
import { currentLearningStreak, learningDayKeys } from "../service/learningDays.service";

const date = new Date("2026-11-19T00:00:00Z"), userId = "streak-group-test";
const user = { id: userId, selectedTargetAchievementId: null, selectedProfileAchievementId: null, displayName: null, experience: 0, selectedMascotId: "red-panda" };
const achievement = (id: string, conditionType: C, extra: Partial<Achievement> = {}): Achievement => ({
  id, title: id, description: "検証用", category: AchievementCategory.LEARNING_ACTION, conditionType,
  conditionValue: 3, conditionUnitIds: [], conditionGroupName: null, courseId: null, phaseKey: null, createQuestId: null,
  rarity: AchievementRarity.COMMON, iconKey: "achievement", isSecret: false, sortOrder: 0, createdAt: date, updatedAt: date, ...extra,
});
let definitions = [achievement("streak3", C.STREAK_DAYS), achievement("streak7", C.STREAK_DAYS, { conditionValue: 7 }), achievement("streak30", C.STREAK_DAYS, { conditionValue: 30 }),
  achievement("group", C.UNIT_GROUP_COMPLETE, { conditionUnitIds: ["a", "b", "c", "d"], conditionGroupName: "探索系" })];
type ProgressRow = { userId: string; courseId: string; phaseKey: string; status: string; summary: Prisma.JsonValue; completedAt: Date | null };
let phases: ProgressRow[] = [], units: ProgressRow[] = [];
let submissions: { userId: string; submittedAt: Date; results: Prisma.JsonValue }[] = [];
const owned = new Set<string>();
const row = (courseId: string, completedAt: Date | null = date): ProgressRow => ({ userId, courseId, phaseKey: "check", status: completedAt ? "COMPLETED" : "IN_PROGRESS", summary: null, completedAt });
const selectRows = (rows: ProgressRow[], where: { userId?: unknown; completedAt?: unknown; status?: unknown } | undefined) => {
  assert.equal(where?.userId, userId);
  return rows.filter(entry => entry.userId === userId && (!where?.completedAt || entry.completedAt !== null) && (!where?.status || entry.status === where.status));
};
Object.assign(prisma.user, { findUnique: async () => ({ id: userId }) });
Object.assign(prisma.phaseLearningProgress, { findMany: async (args: Prisma.PhaseLearningProgressFindManyArgs) => selectRows(phases, args.where).map(row => ({ ...row, course: { version: 1 } })) });
Object.assign(prisma.unitLearningProgress, { findMany: async (args: Prisma.UnitLearningProgressFindManyArgs) => selectRows(units, args.where) });
Object.assign(prisma.createQuestSubmission, { findMany: async (args: Prisma.CreateQuestSubmissionFindManyArgs) => {
  assert.deepEqual(args.where, { attempt: { userId } }); return submissions.filter(entry => entry.userId === userId);
} });
Object.assign(prisma.createQuestAttempt, { findMany: async () => [{ questId: "q", status: "COMPLETED", bestScore: 100 }] });
Object.assign(prisma.userKnowledgeCard, { findMany: async () => [{ knowledgeCard: { courseId: "a" } }, { knowledgeCard: { courseId: "a" } }] });
Object.assign(prisma.knowledgeCard, { findMany: async () => [] });
Object.assign(prisma.achievement, {
  findMany: async () => definitions.map(entry => ({ ...entry, userAchievements: owned.has(entry.id) ? [{ achievedAt: date }] : [] })),
  findFirst: async (args: Prisma.AchievementFindFirstArgs) => definitions.find(entry => entry.id === args.where?.id && !owned.has(entry.id)) ?? null,
});
Object.assign(prisma.userAchievement, {
  findMany: async () => [...owned].map(achievementId => ({ achievementId })), count: async () => owned.size,
  upsert: async ({ create }: { create: { achievementId: string } }) => {
    owned.add(create.achievementId); return { achievement: definitions.find(entry => entry.id === create.achievementId), achievedAt: date };
  },
});
Object.assign(prisma.knowledgeCardPhaseScheduleEntry, { findMany: async () => [] });
const progress = async (id: string) => (await getAchievementsByUser(user)).groups.flatMap(group => group.achievements).find(entry => entry.id === id)!;
const now = (iso: string) => { mock.timers.reset(); mock.timers.enable({ apis: ["Date"], now: new Date(iso).getTime() }); };
async function main() {
 try {
  now("2026-11-18T23:30:00Z"); assert.equal((await progress("streak3")).progress, 0);
  for (const days of [3, 7, 30]) {
    owned.clear(); phases = []; units = []; submissions = [];
    for (let i = 0; i < days; i++) {
      const completedAt = new Date(Date.parse("2026-11-18T23:00:00Z") - i * 86400000);
      if (i % 3 === 0) phases.push(row("a", completedAt));
      else if (i % 3 === 1) units.push(row(`u${i}`, completedAt));
      else submissions.push({ userId, submittedAt: completedAt, results: [] });
    }
    phases.push({ ...phases[0]!, phaseKey: "duplicate" });
    phases.push({ ...row("other", new Date("2026-10-01T00:00:00Z")), userId: "other" });
    units.push(row("unfinished", null));
    assert.equal((await progress("streak3")).progress, days);
    assert.equal((await getHomeByUser({ ...user, selectedTargetAchievementId: "streak3" })).targetAchievement?.factor[0]?.progress, days);
    assert.equal((await evaluateAchievementsForUser(userId)).filter(entry => entry.id.startsWith("streak")).length, days === 3 ? 1 : days === 7 ? 2 : 3);
    now("2026-11-19T23:30:00Z"); assert.equal((await progress("streak3")).progress, days);
    now("2026-11-20T23:30:00Z"); assert.equal((await progress("streak3")).progress, 0);
    assert.equal((await progress("streak3")).status, "achieved"); assert.equal((await evaluateAchievementsForUser(userId)).length, 0);
    now("2026-11-18T23:30:00Z");
  }
  owned.clear(); phases = []; submissions = [];
  units = ["a", "b", "c", "outside"].map(id => row(id));
  units.push({ ...row("d"), userId: "other" });
  assert.equal((await progress("group")).progress, 3); assert(!(await evaluateAchievementsForUser(userId)).some(entry => entry.id === "group"));
  units.push(row("d", null)); assert.equal((await progress("group")).progress, 3);
  units.at(-1)!.status = "COMPLETED";
  const group = await progress("group"); assert.equal(group.progress, 4); assert.equal(group.goal, 4);
  assert.equal(group.conditionLabel, "探索系の4単元をすべて完了");
  const home = await getHomeByUser({ ...user, selectedTargetAchievementId: "group" });
  assert.equal(home.targetAchievement?.factor[0]?.progress, 4); assert.equal(home.targetAchievement?.factor[0]?.name, group.conditionLabel);
  assert.equal((await getCollectionByUser(user)).achievements.items.find(entry => entry.id === "group")?.conditionLabel, group.conditionLabel);
  assert((await evaluateAchievementsForUser(userId)).some(entry => entry.id === "group"));
  definitions.push(achievement("empty", C.UNIT_GROUP_COMPLETE), achievement("duplicate", C.UNIT_GROUP_COMPLETE, { conditionUnitIds: ["a", "a", "missing"] }));
  assert.equal((await progress("empty")).progress, 0); assert.equal((await progress("empty")).goal, 1);
  assert.equal((await progress("duplicate")).goal, 2); assert.equal((await progress("duplicate")).progress, 1);
  assert(!(await evaluateAchievementsForUser(userId)).some(entry => entry.id === "empty" || entry.id === "duplicate"));
  for (const [today, yesterday] of [["2027-12-31T15:00:00Z", "2027-12-30T15:00:00Z"], ["2028-02-29T15:00:00Z", "2028-02-28T15:00:00Z"]]) {
    assert.equal(currentLearningStreak(learningDayKeys([new Date(today!), new Date(yesterday!)]), new Date(today!)), 2);
  }
  assert.equal(currentLearningStreak(learningDayKeys([date, new Date(date.getTime() - 2 * 86400000)]), date), 1, "A gap starts a new streak");
  units = [row("a")]; phases = [{ ...row("a"), summary: { totalQuestions: 2, firstAttemptCorrect: 2, hintUsage: [0, 0] } }];
  submissions = [{ userId, submittedAt: date, results: [{ kind: "OPTIONAL", passed: true, requirementId: "r" }] }];
  const expected = new Map<C, number>([
    [C.UNIT_COMPLETE, 1], [C.UNIT_COMPLETED_COUNT, 1], [C.PHASE_COMPLETED, 1], [C.PHASE_FIRST_ATTEMPT_PERFECT, 1], [C.PHASE_NO_HINT_COMPLETE, 1],
    [C.MISSION_COUNT, 1], [C.SPECIFIC_MISSION_CLEAR, 1], [C.ACTIVITY_COUNT, 1], [C.COURSE_COMPLETE, 1],
    [C.COURSE_REQUIRED_MISSION_COMPLETE, 0], [C.COURSE_ALL_MISSION_COMPLETE, 0], [C.COURSE_EXAM_HARD_CLEAR, 0], [C.COURSE_COMPLETED_COUNT, 1],
    [C.CREATE_QUEST_SCORE, 100], [C.CREATE_QUEST_COMPLETED_COUNT, 1], [C.CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT, 1], [C.CREATE_QUEST_PERFECT_COUNT, 1], [C.KNOWLEDGE_CARD_COUNT, 2],
  ]);
  definitions = [...expected.keys()].map(type => achievement(type, type, { courseId: "a", phaseKey: "check", createQuestId: "q", conditionValue: 1 }));
  for (const [type, value] of expected) assert.equal((await progress(type)).progress, value, type);
  console.log("Achievement evaluator: 3/7/30-day mixed-source JST streaks, yesterday grace/gap/retained awards, group subset/all/empty/duplicate, home/collection parity, year/leap boundary and 18 prior conditions passed.");
 } finally { mock.timers.reset(); await prisma.$disconnect(); }
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
