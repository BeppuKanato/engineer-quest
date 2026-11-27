import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { FIXED_CARD_SCHEDULE } from "../learning/knowledgeCardSchedule";
import { knowledgeCardPhaseScheduleSeed as schedules, knowledgeCardSeed } from "../../prisma/seedData/knowledgeCardSeed";
import { courseSeed } from "../../prisma/seedData/courseSeed";
import { completePhaseByUser } from "../service/learning.service";
import { restoreCompletedPhaseCards } from "../service/knowledgeCardGrant.service";
import { getCollectionByUser } from "../service/collection.service";
import { ensureUserService } from "../service/auth.service";
import * as achievements from "../service/achievement.service";
import * as goals from "../service/bigGoal.service";

const owned = new Map<string, Set<string>>();
type Phase = { userId: string; courseId: string; phaseKey: string; status: string; completedAt: Date; summary: unknown; course: { version: number } };
const phases: Phase[] = [];
let evaluations = 0;
(achievements as { evaluateAchievementsForUser: unknown }).evaluateAchievementsForUser = async () => { evaluations++; return []; };
(goals as { evaluateBigGoalsForUser: unknown }).evaluateBigGoalsForUser = async () => [];
const db = prisma as unknown as Record<string, unknown>;
db.$transaction = (work: (tx: unknown) => unknown) => work(prisma);
const cardById = new Map(knowledgeCardSeed.map(card => [card.id, card]));
// 誤ったカードを指定する旧行が同居しても、実サービスが共通番号0だけを問い合わせることを検証。
const legacy = schedules.map(entry => ({ ...entry, tableNumber: 15, knowledgeCardId: "wrong-legacy-card" }));
const all = [...legacy, ...schedules];
db.course = { findFirst: async ({ where }: { where: { id: string } }) => courseSeed.find(course => course.id === where.id) };
db.phaseLearningProgress = {
  upsert: async ({ create }: { create: Phase }) => ({ ...create, startedAt: new Date(), summary: create.summary ?? null }),
  findMany: async ({ where }: Prisma.PhaseLearningProgressFindManyArgs) => {
    assert.equal(where?.status, "COMPLETED"); return phases.filter(row => row.userId === where?.userId && row.status === "COMPLETED");
  },
};
db.unitLearningProgress = { upsert: async () => ({}) };
db.learningEvent = { create: async () => ({}) };
db.knowledgeCardPhaseScheduleEntry = {
  findUnique: async ({ where }: Prisma.KnowledgeCardPhaseScheduleEntryFindUniqueArgs) => {
    const key = where.courseId_courseVersion_tableNumber_phaseKey!;
    assert.equal(key.tableNumber, FIXED_CARD_SCHEDULE);
    const entry = all.find(row => row.courseId === key.courseId && row.courseVersion === key.courseVersion && row.tableNumber === key.tableNumber && row.phaseKey === key.phaseKey);
    return entry ? { ...entry, knowledgeCard: cardById.get(entry.knowledgeCardId) } : null;
  },
  findMany: async ({ where }: Prisma.KnowledgeCardPhaseScheduleEntryFindManyArgs) => {
    assert.equal(where?.tableNumber, FIXED_CARD_SCHEDULE);
    const scopes = where?.OR as { courseId: string; courseVersion: number; phaseKey: string }[];
    return all.filter(row => row.tableNumber === FIXED_CARD_SCHEDULE && scopes.some(scope => row.courseId === scope.courseId && row.courseVersion === scope.courseVersion && row.phaseKey === scope.phaseKey));
  },
};
db.userKnowledgeCard = { createMany: async ({ data, skipDuplicates }: { data: { userId: string; knowledgeCardId: string }[]; skipDuplicates: boolean }) => {
  assert.equal(skipDuplicates, true); let count = 0;
  for (const row of data) {
    assert(cardById.has(row.knowledgeCardId), "Legacy mappings must never grant a card");
    const cards = owned.get(row.userId) ?? new Set<string>();
    if (!cards.has(row.knowledgeCardId)) { cards.add(row.knowledgeCardId); count++; }
    owned.set(row.userId, cards);
  }
  return { count };
} };

async function main() {
  for (let table = 1; table <= 15; table++) {
    const user = { id: `user-${table}`, knowledgeCardTableNumber: table };
    for (const entry of schedules) {
      const result = await completePhaseByUser(user, entry.courseId, entry.phaseKey);
      assert.equal(result.awardedCard?.id, entry.knowledgeCardId);
      assert.equal((await completePhaseByUser(user, entry.courseId, entry.phaseKey)).awardedCard, null);
    }
    assert.equal(owned.get(user.id)?.size, 27);
  }
  const first = schedules[0];
  assert.equal((await completePhaseByUser({ id: "no-legacy-number" }, first.courseId, first.phaseKey)).awardedCard?.id, first.knowledgeCardId);
  // 全フェーズ完了なのに旧方式で一部欠落したユーザーを救済。
  const user = { id: "rescue", selectedProfileAchievementId: null };
  for (const entry of schedules) phases.push({ userId: user.id, courseId: entry.courseId, phaseKey: entry.phaseKey, status: "COMPLETED", completedAt: new Date("2026-01-01"), summary: { frozen: "evidence" }, course: { version: entry.courseVersion } });
  phases.push({ ...phases[0], userId: "another" }, { ...phases[0], userId: "unfinished", status: "IN_PROGRESS" });
  owned.set(user.id, new Set([first.knowledgeCardId]));
  const before = structuredClone(phases);
  const results = await Promise.all([restoreCompletedPhaseCards(user.id), restoreCompletedPhaseCards(user.id)]);
  assert.equal(results.reduce((a, b) => a + b, 0), schedules.length - 1);
  assert.equal(owned.get(user.id)?.size, 27);
  assert.equal(await restoreCompletedPhaseCards(user.id), 0);
  assert.equal(await restoreCompletedPhaseCards("unfinished"), 0);
  assert.equal(await restoreCompletedPhaseCards("no-progress"), 0);
  assert.deepEqual(phases, before, "Rescue must not update progress, completedAt or evidence");
  // 通常の完了と救済が重なっても、一方だけが新規付与を報告する。
  phases.push({ ...phases[0], userId: "racing-grant" });
  const [completion, recovery] = await Promise.all([
    completePhaseByUser({ id: "racing-grant" }, first.courseId, first.phaseKey),
    restoreCompletedPhaseCards("racing-grant"),
  ]);
  assert.equal(owned.get("racing-grant")?.size, 1);
  assert.equal(Number(!!completion.awardedCard) + recovery, 1);
  // コレクション取得が救済を実行し、カード関連実績を既存評価器で再評価する。
  owned.set(user.id, new Set());
  db.knowledgeCard = { findMany: async () => [] }; db.achievement = { findMany: async () => [] };
  evaluations = 0;
  await getCollectionByUser(user); assert.equal(owned.get(user.id)?.size, 27); assert.equal(evaluations, 1);
  await getCollectionByUser(user); assert.equal(evaluations, 1);
  // 新規登録にランダム番号は指定せず、互換列のDB既定値だけを使う。
  db.user = { upsert: async ({ create }: { create: Record<string, unknown> }) => {
    assert.equal(Object.hasOwn(create, "knowledgeCardTableNumber"), false);
    return { id: "new", ...create, experience: 0, knowledgeCardTableNumber: 1, hexadResponse: null };
  } };
  await ensureUserService({ firebaseUid: "fixture" });
  console.log("PASS: all 15 legacy numbers and numberless users receive the same 27 cards; legacy rows ignored; concurrent/repeat rescue fills only missing cards; collection triggers rescue/evaluation; phase/evidence unchanged; registration no longer random.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
