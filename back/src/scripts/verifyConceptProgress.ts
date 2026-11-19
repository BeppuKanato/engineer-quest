import assert from "node:assert/strict";
import { Request, Response } from "express";
import { getConceptProgressController } from "../controller/conceptProgress.controller";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { conceptDefinitions } from "../service/feedbackConcepts";
import { buildConceptProgress, getConceptProgressByUser } from "../service/conceptProgress.service";

type Event = Parameters<typeof buildConceptProgress>[1][number];
const now = new Date("2026-11-19T00:00:00Z");
const proof = (phaseKey: string, assessmentId: string, records: { questionId: string; attempts: { number: number; correct: boolean }[] }[], sessionId = "original"): Event => ({ phaseKey, eventType: "assessment_snapshot", targetId: assessmentId, payload: { version: 1, assessmentId, sessionId, startedAt: 1, records }, serverTimestamp: now });
const answers = (correct: boolean[]) => correct.map((correct, index) => ({ number: index + 1, correct }));
for (const unit of conceptDefinitions) {
  const empty = buildConceptProgress(unit.courseId, [], []);
  assert.equal(empty.concepts.length, unit.concepts.filter(c => c.kind === "assessment").length);
  assert(empty.concepts.every(c => c.state === "unconfirmed" && c.reachedQuestions === 0 && c.firstAttemptRate === null));
  const all = unit.concepts.flatMap(c => c.questions);
  const events = [...new Set(all.map(q => q.phaseKey))].map(phaseKey => {
    const questions = all.filter(q => q.phaseKey === phaseKey);
    return proof(phaseKey, questions[0].assessmentId, questions.map(q => ({ questionId: q.questionId, attempts: answers([false, true]) })));
  });
  const snapshot = buildConceptProgress(unit.courseId, events, []);
  assert(snapshot.concepts.every(c => c.state === "reached" && c.reachedQuestions === c.totalQuestions && c.firstAttemptRate === 0), "retry success reaches every concept with 0% first accuracy");
  assert.deepEqual(buildConceptProgress(unit.courseId, [...events, ...events].reverse(), []), snapshot, "duplicates/order must not change progress");
  const fromSummary = buildConceptProgress(unit.courseId, [], events.map(event => ({ phaseKey: event.phaseKey!, summary: { assessmentEvidence: event.payload }, completedAt: now, updatedAt: now })));
  assert.deepEqual(fromSummary, snapshot, "phase summary covers delayed/missing event delivery");
  const implementation = unit.phases.find(p => p.phase === 7)!;
  assert.deepEqual(buildConceptProgress(unit.courseId, [{ ...events[0], phaseKey: implementation.id }], [{ phaseKey: implementation.id, summary: { assessmentEvidence: events[0].payload }, completedAt: now, updatedAt: now }]), empty);
}
const unit = conceptDefinitions[0], q = unit.concepts[0].questions[0];
const raw = (attempt: number, correct: boolean, session = "early", time = 1): Event => ({ phaseKey: q.phaseKey, eventType: "answer_attempt", targetId: q.questionId, payload: { assessmentId: q.assessmentId, assessmentSessionId: session, attempt, correct }, serverTimestamp: new Date(time) });
const concept = (events: Event[]) => buildConceptProgress(unit.courseId, events, []).concepts[0];
assert.equal(concept([raw(1, false)]).state, "in_progress");
assert.equal(concept([raw(1, false)]).answeredQuestions, 1);
assert.equal(concept([raw(2, true)]).reachedQuestions, 1);
assert.equal(concept([raw(2, true)]).firstAttemptRate, null, "missing first attempt stays unknown");
const evidence = proof(q.phaseKey, q.assessmentId, [{ questionId: q.questionId, attempts: answers([false, true]) }], "early");
const oldCorrect = [raw(1, false), evidence, raw(1, false, "later", now.getTime() + 100)];
assert.equal(concept(oldCorrect).reachedQuestions, 1, "later failed relearning cannot revoke attainment");
assert.equal(concept(oldCorrect).firstAttemptRate, 0);
const failedProof = proof(q.phaseKey, q.assessmentId, [{ questionId: q.questionId, attempts: answers([false]) }], "early");
assert.equal(concept([raw(1, true), failedProof, raw(2, true)]).reachedQuestions, 0, "confirmed record takes precedence over conflicting/extra queued attempts");
assert.equal(concept([{ ...raw(1, true), eventType: "daily_review_answer" }]).state, "unconfirmed");
assert.equal(concept([{ ...raw(1, true), targetId: "unknown" }]).state, "unconfirmed");
assert.equal(concept([{ ...raw(1, true), payload: { assessmentId: "wrong", assessmentSessionId: "s", attempt: 1, correct: true } }]).state, "unconfirmed");
// 読み取り専用APIの所有権・コース条件を検証。復習テーブルや書き込みは一切許可しない。
const db = prisma as unknown as Record<string, unknown>;
const operations: string[] = [];
const only = (name: string, method: string, run: (args: unknown) => unknown) => new Proxy({}, { get: (_target, key) => {
  if (key !== method) throw new Error(`Forbidden operation: ${name}.${String(key)}`);
  return (args: unknown) => { operations.push(`${name}.${method}`); return run(args); };
} });
db.course = only("course", "findFirst", args => { assert.deepEqual((args as Prisma.CourseFindFirstArgs).where, { id: unit.courseId, isPublished: true }); return { id: unit.courseId }; });
db.learningEvent = only("learningEvent", "findMany", args => {
  const where = (args as Prisma.LearningEventFindManyArgs).where!; assert.equal(where.userId, "owner"); assert.equal(where.courseId, unit.courseId); assert.deepEqual(where.eventType, { in: ["assessment_snapshot", "answer_attempt"] }); return [evidence];
});
db.phaseLearningProgress = only("phaseLearningProgress", "findMany", args => {
  const where = (args as Prisma.PhaseLearningProgressFindManyArgs).where!; assert.equal(where.userId, "owner"); assert.equal(where.courseId, unit.courseId);
  assert.equal((where.phaseKey as Prisma.StringFilter).in?.length, 3); return [];
});
for (const model of ["dailyReview", "unitLearningProgress", "feedbackV1", "experimentAssignment", "userKnowledgeCard"]) db[model] = new Proxy({}, { get: () => { throw new Error(`Forbidden model: ${model}`); } });
async function main() {
  const result = await getConceptProgressByUser({ id: "owner" }, unit.courseId);
  assert.equal(result.concepts[0].reachedQuestions, 1);
  await assert.rejects(getConceptProgressByUser({ id: "owner" }, "unknown"), error => (error as { code: string }).code === "CONCEPT_PROGRESS_NOT_FOUND");
  assert.deepEqual(operations, ["course.findFirst", "learningEvent.findMany", "phaseLearningProgress.findMany"]);
  for (const [request, expected] of [
    [{ params: { courseId: unit.courseId } }, "UNAUTHORIZED"],
    [{ authUser: { id: "owner" }, params: {} }, "BAD_REQUEST"],
  ] as const) {
    let code = "";
    await getConceptProgressController(request as unknown as Request, {} as Response, error => { code = (error as { code: string }).code; });
    assert.equal(code, expected);
  }
  console.log("PASS: 7 units, 39 learner concepts, retry attainment independent of first accuracy, summaries/raw/snapshots, duplicate/order stability, past success retained, canonical proof priority, phase7/review exclusion and owner-scoped read-only API.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
