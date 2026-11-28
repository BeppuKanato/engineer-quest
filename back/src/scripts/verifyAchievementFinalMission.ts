/**
 * ステージ4（実績の再構成）の検証。DB を使わず、prisma を fixture に差し替えて
 * achievement.service の評価を確認する。
 *  (a) 解法例を見た clear のみ → 単元完了・最終ミッションクリア・ノーヒント・
 *      新実績のいずれも付かず、単元数・系コンプリートにも数えない
 *  (b) 後に解法例を見ていない clear を追加 → 単元系と最終ミッションクリアが付く。
 *      その clear が AI 相談ありならノーヒント系は付かない
 *  (c) ヒント・AI相談なしの clear（レベルは骨格）→ ノーヒントクリアが付くが、
 *      新実績（全部書く）は付かない
 *  (d) 「全部書く」＋ヒント・AI相談なしの clear → 新実績も付く
 *  (e) clears が無い履歴 → 従来判定（単元完了のみ／hintUsage）へフォールバックし、
 *      新実績だけは判定材料が無いため付かない
 *  (f) clears がある場合は hintUsage より clears を正とする
 */
import assert from "node:assert/strict";
import { AchievementCategory, AchievementConditionType as C, AchievementRarity, type Achievement, type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { evaluateAchievementsForUser, getAchievementsByUser } from "../service/achievement.service";

const date = new Date("2026-11-28T00:00:00Z"), userId = "final-mission-test";
const COURSE = "course-bfs", PHASE = "bfs-implementation";
const user = { id: userId, selectedTargetAchievementId: null, selectedProfileAchievementId: null };
const achievement = (id: string, conditionType: C, extra: Partial<Achievement> = {}): Achievement => ({
  id, title: id, description: "検証用", category: AchievementCategory.LEARNING_ACTION, conditionType,
  conditionValue: 1, conditionUnitIds: [], conditionGroupName: null, courseId: null, phaseKey: null, createQuestId: null,
  rarity: AchievementRarity.COMMON, iconKey: "achievement", isSecret: false, sortOrder: 0, createdAt: date, updatedAt: date, ...extra,
});
const definitions = [
  achievement("unit", C.UNIT_COMPLETE, { courseId: COURSE }),
  achievement("count", C.UNIT_COMPLETED_COUNT),
  achievement("group", C.UNIT_GROUP_COMPLETE, { conditionUnitIds: [COURSE], conditionGroupName: "探索系" }),
  achievement("clear", C.PHASE_COMPLETED, { courseId: COURSE, phaseKey: PHASE }),
  achievement("nohint", C.PHASE_NO_HINT_COMPLETE, { courseId: COURSE, phaseKey: PHASE }),
  achievement("full", C.PHASE_FULL_NO_HINT_COMPLETE, { courseId: COURSE, phaseKey: PHASE }),
];
type Clear = { completedAt: string; viewedSolution: boolean; usedAiConsultation: boolean; usedHint: boolean; inputLevel: string };
const clear = (extra: Partial<Clear> = {}): Clear => ({
  completedAt: date.toISOString(), viewedSolution: false, usedAiConsultation: false, usedHint: false, inputLevel: "skeleton", ...extra,
});
let summary: Prisma.JsonValue = null;
const owned = new Set<string>();

Object.assign(prisma.user, { findUnique: async () => ({ id: userId }) });
Object.assign(prisma.unitLearningProgress, {
  findMany: async () => [{ courseId: COURSE, status: "COMPLETED", completedAt: date }],
});
Object.assign(prisma.phaseLearningProgress, {
  findMany: async () => [{ courseId: COURSE, phaseKey: PHASE, status: "COMPLETED", summary, completedAt: date }],
});
Object.assign(prisma.createQuestAttempt, { findMany: async () => [] });
Object.assign(prisma.createQuestSubmission, { findMany: async () => [] });
Object.assign(prisma.userKnowledgeCard, { findMany: async () => [], count: async () => 0 });
Object.assign(prisma.achievement, {
  findMany: async () => definitions.map((entry) => ({ ...entry, userAchievements: owned.has(entry.id) ? [{ achievedAt: date }] : [] })),
});
Object.assign(prisma.userAchievement, {
  findMany: async () => [...owned].map((achievementId) => ({ achievementId })),
  upsert: async ({ create }: { create: { achievementId: string } }) => {
    owned.add(create.achievementId);
    return { achievement: definitions.find((entry) => entry.id === create.achievementId), achievedAt: date };
  },
});

const progress = async (id: string) =>
  (await getAchievementsByUser(user)).groups.flatMap((group) => group.achievements).find((entry) => entry.id === id)!.progress;
const expectProgress = async (expected: Record<string, number>) => {
  for (const [id, value] of Object.entries(expected)) assert.equal(await progress(id), value, id);
};
const grantedIds = async () => (await evaluateAchievementsForUser(userId)).map((entry) => entry.id).sort();

async function main() {
  try {
    // (a) 解法例を見た clear のみ
    summary = { clears: [clear({ viewedSolution: true, inputLevel: "full" })] };
    await expectProgress({ unit: 0, count: 0, group: 0, clear: 0, nohint: 0, full: 0 });
    assert.deepEqual(await grantedIds(), []);

    // (b) 解法例を見ていない clear を追加（AI 相談あり・全部書く）
    summary = { clears: [clear({ viewedSolution: true, inputLevel: "full" }), clear({ usedAiConsultation: true, inputLevel: "full" })] };
    await expectProgress({ unit: 1, count: 1, group: 1, clear: 1, nohint: 0, full: 0 });
    assert.deepEqual(await grantedIds(), ["clear", "count", "group", "unit"]);

    // (c) ヒント・AI相談なしの clear（骨格レベル）を追加
    owned.clear();
    summary = { clears: [clear({ usedAiConsultation: true, inputLevel: "full" }), clear({})] };
    await expectProgress({ unit: 1, count: 1, group: 1, clear: 1, nohint: 1, full: 0 });

    // (d) 「全部書く」＋ヒント・AI相談なしの clear を追加
    summary = { clears: [clear({ usedAiConsultation: true, inputLevel: "full" }), clear({}), clear({ inputLevel: "full" })] };
    await expectProgress({ unit: 1, count: 1, group: 1, clear: 1, nohint: 1, full: 1 });
    assert.deepEqual(await grantedIds(), ["clear", "count", "full", "group", "nohint", "unit"]);

    // (e) clears が無い履歴は従来判定へフォールバック（新実績は付かない）
    owned.clear();
    summary = { hintUsage: [0, 0] };
    await expectProgress({ unit: 1, count: 1, group: 1, clear: 1, nohint: 1, full: 0 });
    summary = { hintUsage: [1, 0] };
    await expectProgress({ nohint: 0 });

    // (f) clears がある場合は hintUsage が 0 でも clears を正とする
    summary = { hintUsage: [0, 0], clears: [clear({ viewedSolution: true })] };
    await expectProgress({ unit: 0, clear: 0, nohint: 0, full: 0 });

    console.log("Achievement final-mission evaluator: viewed-only clears grant nothing and are not counted, later clean clears grant on re-evaluation, AI consultation blocks no-hint, full level is required for the new epic, no-clears history falls back to legacy rules, and clears take precedence over hintUsage.");
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
