/**
 * ステージ3（AI 相談ログのフィードバック入力への組み込み）の検証。
 * DB を使わず、純粋関数の打ち切り規則・context 組み立て（メモリ fixture）・
 * 保存済み入力の変換での保持を確認する。
 *  (a) 相談ログがある場合に learning.aiConsultations へ入り、打ち切り規則どおりになる
 *  (b) 相談が無い場合にフィールド自体が付かず、入力が従来と同一になる
 *  (c) prepareSavedFeedbackInput の変換でフィールドが保持される
 */
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma";
import { buildFeedbackV1Context } from "../service/feedbackV1.context";
import {
  buildFeedbackAiConsultations,
  FEEDBACK_AI_CONSULTATION_MAX_ENTRIES,
  FEEDBACK_AI_CONSULTATION_MAX_TOTAL_CHARS,
  type AiConsultationRow,
} from "../service/feedbackConsultationInput";
import { prepareSavedFeedbackInput } from "../service/feedbackInputPreparation";
import type { Input } from "../service/feedbackV1.engine";
import * as achievements from "../service/achievement.service";
import * as goals from "../service/bigGoal.service";

const row = (index: number, chars = 10): AiConsultationRow => ({
  phaseKey: "bfs-check",
  userMessage: "u".repeat(chars) + index,
  assistantMessage: "a".repeat(chars),
  blocked: index === 0,
  createdAt: new Date(index * 1000),
});

// --- (a) 純粋関数: 打ち切り規則 ---
assert.equal(buildFeedbackAiConsultations([]), undefined, "no consultations -> undefined (field absent)");

const few = buildFeedbackAiConsultations([row(0), row(1), row(2)])!;
assert.equal(few.totalCount, 3);
assert.equal(few.includedCount, 3);
assert.equal(few.truncated, false);
assert.deepEqual(few.entries.map((e) => e.createdAt), [
  new Date(0).toISOString(),
  new Date(1000).toISOString(),
  new Date(2000).toISOString(),
], "entries stay chronological");
assert.equal(few.entries[0].blocked, true);
assert.equal(few.entries[0].phaseKey, "bfs-check");
assert.ok(few.entries[0].userMessage.endsWith("0"));

// 件数上限: 直近 MAX_ENTRIES 件を新しい方優先で残し、時系列順に戻す。
const many = Array.from({ length: FEEDBACK_AI_CONSULTATION_MAX_ENTRIES + 5 }, (_, i) => row(i));
const byCount = buildFeedbackAiConsultations(many)!;
assert.equal(byCount.totalCount, FEEDBACK_AI_CONSULTATION_MAX_ENTRIES + 5);
assert.equal(byCount.includedCount, FEEDBACK_AI_CONSULTATION_MAX_ENTRIES);
assert.equal(byCount.truncated, true);
assert.ok(byCount.entries[0].userMessage.endsWith("5"), "oldest 5 dropped");
assert.ok(
  byCount.entries[byCount.entries.length - 1].userMessage.endsWith(String(FEEDBACK_AI_CONSULTATION_MAX_ENTRIES + 4)),
  "newest kept"
);

// 文字数上限: 1件 4,000 文字（user 2,000 + assistant 2,000）なら 3件で上限ちょうど。
const bigRow = (index: number): AiConsultationRow => ({
  phaseKey: null, userMessage: "u".repeat(2000), assistantMessage: "a".repeat(2000),
  blocked: false, createdAt: new Date(index * 1000),
});
const byChars = buildFeedbackAiConsultations([bigRow(0), bigRow(1), bigRow(2), bigRow(3)])!;
assert.equal(byChars.includedCount, Math.floor(FEEDBACK_AI_CONSULTATION_MAX_TOTAL_CHARS / 4000));
assert.equal(byChars.truncated, true);
assert.equal(byChars.entries[0].createdAt, new Date(1000).toISOString(), "newest side kept");

// 最新の1件だけは文字数上限を超えても残す。
const huge = buildFeedbackAiConsultations([{
  phaseKey: null, userMessage: "u".repeat(FEEDBACK_AI_CONSULTATION_MAX_TOTAL_CHARS + 1),
  assistantMessage: "", blocked: false, createdAt: new Date(0),
}])!;
assert.equal(huge.includedCount, 1);
assert.equal(huge.truncated, false);

// --- (c) 保存済み入力の変換で保持される ---
const courseId = "course-algorithm-breadth-first-search-v1";
const consultations = buildFeedbackAiConsultations([row(0), row(1)])!;
const savedInput = {
  learning: { id: "phase-event:x", unit: { id: courseId }, conceptSnapshot: { concepts: [] }, aiConsultations: consultations },
  state: {}, actions: [], targets: {}, hexad: null, bigGoal: null,
} as unknown as Input;
const prepared = prepareSavedFeedbackInput(savedInput);
assert.deepEqual((prepared.learning as Record<string, unknown>).aiConsultations, consultations,
  "saved-input conversion keeps aiConsultations");
const savedWithout = {
  learning: { id: "phase-event:x", unit: { id: courseId }, conceptSnapshot: { concepts: [] } },
  state: {}, actions: [], targets: {}, hexad: null, bigGoal: null,
} as unknown as Input;
assert.ok(!("aiConsultations" in (prepareSavedFeedbackInput(savedWithout).learning as Record<string, unknown>)),
  "conversion does not invent the field for legacy inputs");

// --- (a)/(b) context 組み立て（メモリ fixture、verifyFeedbackV1Context と同型） ---
async function main() {
  const db = prisma as unknown as Record<string, unknown>;
  const phaseRows = [{ id: "progress", phaseKey: "bfs-check", courseId, status: "COMPLETED", summary: null, startedAt: new Date(), completedAt: new Date() }];
  const user = { id: "owner", firebaseUid: "uid", experience: 0, selectedTargetAchievementId: null, hexadResponse: null };
  db.user = { findUnique: async () => ({ ...user, experimentAssignments: [{ condition: "STANDARD", assignedAt: new Date(0) }] }) };
  db.course = { findUnique: async () => ({ id: courseId, title: "幅優先探索" }), findMany: async () => [{ id: courseId, title: "幅優先探索" }] };
  db.unitLearningProgress = { findUnique: async () => ({ status: "IN_PROGRESS", completedAt: null }), findMany: async () => [] };
  db.phaseLearningProgress = { findMany: async () => phaseRows };
  db.learningEvent = { findMany: async () => [] };
  for (const name of ["createQuest", "knowledgeCard", "achievement", "questPost", "feedbackV1", "createQuestFeedback"]) db[name] = { findMany: async () => [] };
  db.bigGoal = { findFirst: async () => null };
  (achievements as { getAchievementsByUser: unknown }).getAchievementsByUser = async () => [];
  (goals as { getActiveBigGoal: unknown }).getActiveBigGoal = async () => null;
  (goals as { loadBigGoalFacts: unknown }).loadBigGoalFacts = async () => ({});

  let consultationRows: AiConsultationRow[] = [];
  let consultationQueries = 0;
  db.aiConsultation = {
    findMany: async ({ where }: { where: { userId: string; courseId: string; createdAt: { lte: Date } } }) => {
      consultationQueries++;
      assert.equal(where.userId, "owner", "consultations are owner-scoped");
      assert.equal(where.courseId, courseId, "consultations are scoped to the unit");
      assert.ok(where.createdAt.lte instanceof Date, "consultations are cut off at generation time");
      return consultationRows;
    },
  };

  // (b) 相談なし: フィールド自体が無い。
  const without = await buildFeedbackV1Context("uid", "phase", `${courseId}:bfs-check:bfs-code-mapping`);
  assert.ok(!("aiConsultations" in (without.input.learning as Record<string, unknown>)),
    "no consultations -> field absent from learning");

  // (a) 相談あり: learning に入り、内容は発言の記録そのもの。
  consultationRows = [row(0), row(1)];
  const withConsultations = await buildFeedbackV1Context("uid", "phase", `${courseId}:bfs-check:bfs-code-mapping`);
  const included = (withConsultations.input.learning as Record<string, unknown>).aiConsultations as ReturnType<typeof buildFeedbackAiConsultations>;
  assert.deepEqual(included, buildFeedbackAiConsultations([row(0), row(1)]));
  assert.equal(consultationQueries, 2);

  // create 経路には入れない（相談クエリ自体が走らない）。
  consultationQueries = 0;
  db.createQuestSubmission = {
    findFirst: async () => ({
      id: "sub", attempt: {
        quest: { id: "q", requirements: [] }, executions: [], hintViews: [],
        submissions: [], selectedRequirementIds: [],
      },
    }),
  };
  await buildFeedbackV1Context("uid", "create", "sub");
  assert.equal(consultationQueries, 0, "create-kind feedback never queries consultations");

  console.log("PASS: consultation truncation rules, context inclusion/absence, create-kind exclusion, saved-input preservation");
}

void main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
