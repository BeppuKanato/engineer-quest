/** DBに接続せず、許可した読み取りと復習専用の書き込みだけを受け付けるアダプター。 */
import assert from "node:assert/strict";
import { mock } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DailyReview, PhaseLearningProgress, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../error/appError";
import { conceptDefinitions } from "../service/feedbackConcepts";
import { answerTodayReviewByUser, getTodayReviewByUser } from "../service/dailyReview.service";
import { answerTodayReviewController, getTodayReviewController } from "../controller/dailyReview.controller";

const owner = { id: "owner" };
const unit = conceptDefinitions[0];
const phase3 = unit.phases.find(p => p.phase === 3)!.id;
const phase5 = unit.phases.find(p => p.phase === 5)!.id;
const phase6 = unit.phases.find(p => p.phase === 6)!.id;
const now = new Date("2026-11-18T15:00:00Z"); // JST 19日0時
const days = (n: number) => new Date(now.getTime() + n * 86400000);
type Source = Pick<PhaseLearningProgress, "userId" | "courseId" | "phaseKey" | "completedAt" | "status" | "summary">;
const makePhase = (phaseKey = phase3, completedAt: Date | null = days(-5), firstMiss = false): Source => ({
  userId: owner.id, courseId: unit.courseId, phaseKey, completedAt, status: "COMPLETED",
  summary: { assessmentEvidence: { version: 1, assessmentId: phaseKey, sessionId: "session", startedAt: 1,
    records: unit.concepts.flatMap(c => c.questions).filter(q => q.phaseKey === phaseKey).map(q => ({ questionId: q.questionId, attempts: [{ number: 1, correct: !firstMiss }, { number: 2, correct: true }] })) } },
});
let phases: Source[] = [];
let reviews: DailyReview[] = [];
let race = false;
const operations: { model: string; operation: string }[] = [];
const record = (model: string, operation: string) => operations.push({ model, operation });
const scopeMatches = (row: DailyReview, scope: { userId: string; reviewDate: Date | string }) => row.userId === scope.userId && row.reviewDate.getTime() === new Date(scope.reviewDate).getTime();
const db = prisma as unknown as Record<string, unknown>;
// 他モデルはどの操作でも即失敗。進捗は下記のfindManyだけを許可する。
for (const model of ["user", "unitLearningProgress", "learningEvent", "feedbackV1", "experimentAssignment", "userAchievement", "userKnowledgeCard"]) {
  db[model] = new Proxy({}, { get: (_target, operation) => () => { throw new Error(`Forbidden access: ${model}.${String(operation)}`); } });
}
db.phaseLearningProgress = new Proxy({ findMany: async (args: Prisma.PhaseLearningProgressFindManyArgs) => {
  record("phaseLearningProgress", "findMany");
  assert.equal(args.where?.userId, owner.id);
  assert.equal(args.where?.status, "COMPLETED");
  const cutoff = (args.where?.completedAt as Prisma.DateTimeNullableFilter).lt as Date;
  return phases.filter(p => p.userId === owner.id && p.status === "COMPLETED" && p.completedAt && p.completedAt < cutoff);
} }, { get: (target, key) => key === "findMany" ? target.findMany : () => { throw new Error(`Forbidden phase write/access: ${String(key)}`); } });
db.dailyReview = {
  findUnique: async ({ where }: Prisma.DailyReviewFindUniqueArgs) => {
    record("dailyReview", "findUnique"); return reviews.find(r => scopeMatches(r, where.userId_reviewDate!)) ?? null;
  },
  findMany: async (args: Prisma.DailyReviewFindManyArgs) => {
    record("dailyReview", "findMany");
    assert.equal(args.where?.userId, owner.id); assert.equal(args.where?.correct, true);
    const cutoff = (args.where?.answeredAt as Prisma.DateTimeNullableFilter).gt as Date;
    return reviews.filter(r => r.userId === owner.id && r.correct && r.answeredAt && r.answeredAt > cutoff);
  },
  upsert: async ({ create, update, where }: Prisma.DailyReviewUpsertArgs) => {
    record("dailyReview", "upsert"); assert.deepEqual(update, {});
    const existing = reviews.find(r => scopeMatches(r, where.userId_reviewDate!));
    if (existing) return existing;
    const row = { id: `review-${reviews.length}`, answeredAt: null, correct: null, ...create } as DailyReview;
    reviews.push(row);
    if (race) { race = false; throw new Prisma.PrismaClientKnownRequestError("unique race", { code: "P2002", clientVersion: "5.22.0" }); }
    return row;
  },
  updateMany: async ({ where, data }: Prisma.DailyReviewUpdateManyArgs) => {
    record("dailyReview", "updateMany");
    const row = reviews.find(r => r.id === where?.id && scopeMatches(r, where as { userId: string; reviewDate: Date }) && r.answeredAt === null);
    if (!row) return { count: 0 };
    Object.assign(row, data); return { count: 1 };
  },
};
const select = async (date = now) => (await getTodayReviewByUser(owner, date)).review;
const isError = (code: string) => (error: unknown) => error instanceof AppError && error.code === code;

async function controller(call: typeof getTodayReviewController, body?: unknown, authenticated = true) {
  let result: unknown, error: unknown;
  const req = { authUser: authenticated ? owner : undefined, body } as Request;
  const res = { status: (code: number) => { assert.equal(code, 200); return res; }, json: (value: unknown) => { result = value; } } as unknown as Response;
  await call(req, res, e => { error = e; });
  return { result, error };
}

async function main() {
  mock.timers.enable({ apis: ["Date"], now: now.getTime() });
  assert.deepEqual(await getTodayReviewByUser(owner, now), { review: null });
  assert.equal(reviews.length, 0);
  // 初回ミスは、より古い正解問題より優先。正誤はattempts先頭を見る（最終正解でも初回ミス）。
  phases = [makePhase(phase3, days(-20)), makePhase(phase6, days(-2), true)];
  const original = structuredClone(phases);
  const first = await select(); assert.ok(first); assert.equal(first.phaseKey, phase6);
  assert.deepEqual(Object.keys(first).sort(), ["id", "date", "courseId", "phaseKey", "assessmentId", "questionId", "selectedAt", "answeredAt", "correct"].sort());
  assert.equal(first.date, "2026-11-19"); assert.equal(first.answeredAt, null); assert.equal(first.correct, null);
  phases.unshift(makePhase(phase5, days(-100), true));
  assert.deepEqual(await select(new Date("2026-11-19T14:59:59.999Z")), first);
  const frozenSources = structuredClone(phases);
  const saved = await answerTodayReviewByUser(owner, first.id, true, now);
  assert.equal(saved.review.correct, true);
  assert.deepEqual(await getTodayReviewByUser(owner, now), saved);
  assert.deepEqual(await answerTodayReviewByUser(owner, first.id, true, days(0)), saved);
  await assert.rejects(answerTodayReviewByUser(owner, first.id, false, now), isError("DAILY_REVIEW_ALREADY_ANSWERED"));
  await assert.rejects(answerTodayReviewByUser({ id: "other" }, first.id, true, now), isError("DAILY_REVIEW_NOT_FOUND"));
  await assert.rejects(answerTodayReviewByUser(owner, first.id, true, days(1)), isError("DAILY_REVIEW_NOT_FOUND"));
  assert.deepEqual(phases, frozenSources, "answering leaves completedAt, status and assessmentEvidence byte-for-byte equivalent");
  // 他候補をすべて正解済みにすることで、30日境界での再出題だけを分離して確認。
  const question = { courseId: first.courseId, phaseKey: first.phaseKey, assessmentId: first.assessmentId, questionId: first.questionId };
  phases = [original[1]];
  const evidence = (phases[0].summary as { assessmentEvidence: { records: { questionId: string; attempts: { number: number; correct: boolean }[] }[] } }).assessmentEvidence;
  evidence.records = evidence.records.filter(r => r.questionId === question.questionId);
  // ほかの問題も通常候補になるので、その成功履歴を追加する。
  const otherQuestions = unit.concepts.flatMap(c => c.questions).filter(q => q.phaseKey === phase6 && q.questionId !== first.questionId);
  for (const [index, q] of otherQuestions.entries()) reviews.push({ ...reviews[0], id: `exclude-${index}`, questionId: q.questionId, answeredAt: days(29), reviewDate: days(-index - 20) });
  assert.equal(await select(days(29)), null);
  const at30 = await select(days(30)); assert.ok(at30); assert.equal(at30.questionId, first.questionId);
  // 不正解は翌日候補へ戻る。同一日の再取得では別問題に替わらない。
  reviews = []; const failed = await select(); assert.ok(failed);
  await answerTodayReviewByUser(owner, failed.id, false, now);
  assert.equal((await select())?.id, failed.id);
  assert.equal((await select(days(1)))?.questionId, failed.questionId);
  // 初回ミスなしなら完了日時の古いフェーズを選ぶ。
  reviews = []; phases = [makePhase(phase3, days(-2)), makePhase(phase5, days(-20))];
  assert.equal((await select())?.phaseKey, phase5);
  // 未完了、当日完了、他人、対象外フェーズ、null完了日時からは選ばない。
  reviews = []; phases = [makePhase(phase3, now), { ...makePhase(), status: "IN_PROGRESS" }, { ...makePhase(), userId: "other" }, makePhase(unit.phases.find(p => p.phase === 7)!.id), makePhase(phase3, null)];
  assert.equal(await select(), null);
  // 証拠欠損の旧データでも完了済み対象フェーズの問題は通常候補。壊れた証拠を初回ミス扱いしない。
  phases = [{ ...makePhase(), summary: { assessmentEvidence: { records: "invalid" } } }];
  assert.ok(await select());
  // 現行教材のv2/v3形式も読み、最終正解ではなく先頭の誤答で優先する。
  for (const version of [2, 3]) {
    reviews = [];
    const phase = makePhase(phase6, days(-2), true);
    const summary = phase.summary as { assessmentEvidence: { version: number; materialVersion?: string; records: { questionId: string; attempts: { number: number; correct: boolean; answer?: { kind: string } }[] }[] } };
    summary.assessmentEvidence.version = version;
    if (version === 3) summary.assessmentEvidence.materialVersion = `sha256:${"a".repeat(64)}`;
    for (const record of summary.assessmentEvidence.records) for (const attempt of record.attempts) attempt.answer = { kind: "none" };
    phases = [makePhase(phase3, days(-20)), phase];
    assert.equal((await select())?.phaseKey, phase6);
  }
  // 同時取得、unique競合を模擬しても日次1行。
  reviews = []; race = true;
  const concurrent = await Promise.all(Array.from({ length: 8 }, () => select()));
  assert.equal(new Set(concurrent.map(r => r?.id)).size, 1); assert.equal(reviews.length, 1);
  const simultaneous = await Promise.allSettled([true, false].map(correct => answerTodayReviewByUser(owner, reviews[0].id, correct, now)));
  assert.equal(simultaneous.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(simultaneous.filter(r => r.status === "rejected" && isError("DAILY_REVIEW_ALREADY_ANSWERED")(r.reason)).length, 1);
  // HTTP境界は偽装userId、文字列boolean、余分な項目、未認証を拒否。
  assert.ok(isError("UNAUTHORIZED")((await controller(getTodayReviewController, undefined, false)).error));
  for (const body of [undefined, {}, { reviewId: reviews[0].id, correct: "false" }, { reviewId: reviews[0].id, correct: false, userId: "other" }]) {
    assert.ok(isError("INVALID_REVIEW_ANSWER")((await controller(answerTodayReviewController, body)).error));
  }
  assert.ok((await controller(getTodayReviewController)).result);
  assert.ok((await controller(answerTodayReviewController, { reviewId: reviews[0].id, correct: reviews[0].correct })).result);
  const router = readFileSync(path.join(__dirname, "../router/dailyReview.router.ts"), "utf8");
  assert.match(router, /router.get\("\/today", verifyFirebaseToken, getTodayReviewController\)/);
  assert.match(router, /router.post\("\/today\/answer", verifyFirebaseToken, answerTodayReviewController\)/);
  assert.match(readFileSync(path.join(__dirname, "../app.ts"), "utf8"), /app.use\('\/api\/daily-review', dailyReviewRouter\)/);
  const forbiddenWrites = operations.filter(o => o.model !== "dailyReview" && o.operation !== "findMany");
  assert.equal(forbiddenWrites.length, 0);
  console.log(JSON.stringify({ result: "PASS", scope: "in-memory adapter; no DB connection", writes: [...new Set(operations.filter(o => o.operation === "upsert" || o.operation === "updateMany").map(o => `${o.model}.${o.operation}`))], forbiddenWrites: 0, phaseEvidenceAndProgressUnchanged: true, cases: "first miss / oldest phase / daily pin / JST midnight / correct 30-day boundary / incorrect next day / no candidates / owners / retries / concurrent selection and answer / controller validation" }));
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => mock.timers.reset());
