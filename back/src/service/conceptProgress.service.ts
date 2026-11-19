import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import { conceptDefinitions, validateEvidence } from "./feedbackConcepts";

type Event = { phaseKey: string | null; eventType: string; targetId: string | null; payload: unknown; serverTimestamp: Date };
type Phase = { phaseKey: string; summary: unknown; completedAt: Date | null; updatedAt: Date };
type Trial = { correct: boolean; observedAt: number };
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

/** 学習者向けの到達（過去のどの試行でも正解）。フィードバックのlatest判定とは独立。 */
export function buildConceptProgress(courseId: string, events: readonly Event[], phases: readonly Phase[]) {
  const unit = conceptDefinitions.find(entry => entry.courseId === courseId);
  if (!unit) throw new AppError(404, "CONCEPT_PROGRESS_NOT_FOUND", "この単元の概念到達は準備中です。");
  const phaseKeys = new Set(unit.phases.filter(phase => [3, 5, 6].includes(phase.phase)).map(phase => phase.id));
  const concepts = unit.concepts.filter(concept => concept.kind === "assessment");
  const questions = concepts.flatMap(concept => concept.questions).filter(question => phaseKeys.has(question.phaseKey));
  const confirmed = new Map<string, Map<number, Trial>>(), raw = new Map<string, Map<number, Trial>>();
  const questionRows = new Map<string, Set<string>>();
  const key = (phaseKey: string, assessmentId: string, questionId: string) => JSON.stringify([phaseKey, assessmentId, questionId]);
  const add = (store: typeof raw, phaseKey: string, assessmentId: string, questionId: string, sessionId: string, number: number, correct: boolean, observedAt: number) => {
    if (!questions.some(q => q.phaseKey === phaseKey && q.assessmentId === assessmentId && q.questionId === questionId)) return;
    const qkey = key(phaseKey, assessmentId, questionId), row = JSON.stringify([qkey, sessionId]);
    const rows = questionRows.get(qkey) ?? new Set<string>(); rows.add(row); questionRows.set(qkey, rows);
    const trials = store.get(row) ?? new Map<number, Trial>(), previous = trials.get(number);
    // 同一試行の重複は1件。確定証拠同士等が矛盾する場合は保守的に不正解を採る。
    trials.set(number, { correct: previous ? previous.correct && correct : correct, observedAt: Math.min(previous?.observedAt ?? Infinity, observedAt) });
    store.set(row, trials);
  };
  const snapshot = (phaseKey: string, value: unknown, observedAt: number) => {
    if (!phaseKeys.has(phaseKey)) return;
    try {
      const evidence = validateEvidence(courseId, phaseKey, value);
      for (const record of evidence.records) for (const attempt of record.attempts) add(confirmed, phaseKey, evidence.assessmentId, record.questionId, evidence.sessionId, attempt.number, attempt.correct, observedAt);
    } catch { /* 欠損・不正な旧記録を推定して埋めない。 */ }
  };
  for (const event of events) {
    if (!event.phaseKey || !phaseKeys.has(event.phaseKey)) continue;
    const payload = object(event.payload), observedAt = event.serverTimestamp.getTime();
    if (event.eventType === "assessment_snapshot") snapshot(event.phaseKey, payload, observedAt);
    else if (event.eventType === "answer_attempt" && typeof payload.assessmentId === "string" && typeof payload.assessmentSessionId === "string" && payload.assessmentSessionId && event.targetId && typeof payload.correct === "boolean" && Number.isSafeInteger(payload.attempt) && Number(payload.attempt) > 0) {
      add(raw, event.phaseKey, payload.assessmentId, event.targetId, payload.assessmentSessionId, Number(payload.attempt), payload.correct, observedAt);
    }
  }
  // 完了APIが先に保存され、イベント送信が未着でも、確定済みsummaryを利用できる。
  for (const phase of phases) snapshot(phase.phaseKey, object(phase.summary).assessmentEvidence, (phase.completedAt ?? phase.updatedAt).getTime());
  const states = new Map(questions.map(question => {
    let reached = false, answered = false;
    const first: { correct: boolean; observedAt: number; row: string }[] = [];
    for (const row of questionRows.get(key(question.phaseKey, question.assessmentId, question.questionId)) ?? []) {
      const trials = confirmed.get(row) ?? raw.get(row)!;
      answered ||= trials.size > 0;
      reached ||= [...trials.values()].some(trial => trial.correct);
      const attempt = trials.get(1);
      if (attempt) first.push({ ...attempt, row, observedAt: Math.min(attempt.observedAt, raw.get(row)?.get(1)?.observedAt ?? Infinity) });
    }
    first.sort((a, b) => a.observedAt - b.observedAt || a.row.localeCompare(b.row));
    return [key(question.phaseKey, question.assessmentId, question.questionId), { reached, answered, firstCorrect: first[0]?.correct ?? null }] as const;
  }));
  return { courseId, concepts: concepts.map(concept => {
    const values = concept.questions.filter(q => phaseKeys.has(q.phaseKey)).map(q => states.get(key(q.phaseKey, q.assessmentId, q.questionId))!);
    const reachedQuestions = values.filter(value => value.reached).length, answeredQuestions = values.filter(value => value.answered).length;
    const firstAttemptCorrect = values.filter(value => value.firstCorrect === true).length, firstAttemptQuestions = values.filter(value => value.firstCorrect !== null).length;
    return {
      conceptId: concept.conceptId, label: concept.label,
      state: reachedQuestions === values.length && values.length > 0 ? "reached" as const : answeredQuestions > 0 ? "in_progress" as const : "unconfirmed" as const,
      reachedQuestions, totalQuestions: values.length, answeredQuestions, firstAttemptCorrect, firstAttemptQuestions,
      firstAttemptRate: firstAttemptQuestions > 0 ? Math.round(firstAttemptCorrect / firstAttemptQuestions * 100) : null,
    };
  }) };
}

export async function getConceptProgressByUser(user: { id: string }, courseId: string) {
  const definition = conceptDefinitions.find(unit => unit.courseId === courseId);
  if (!definition || !await prisma.course.findFirst({ where: { id: courseId, isPublished: true }, select: { id: true } })) throw new AppError(404, "CONCEPT_PROGRESS_NOT_FOUND", "この単元の概念到達は準備中です。");
  const phaseKeys = definition.phases.filter(phase => [3, 5, 6].includes(phase.phase)).map(phase => phase.id);
  const [events, phases] = await Promise.all([
    prisma.learningEvent.findMany({ where: { userId: user.id, courseId, phaseKey: { in: phaseKeys }, eventType: { in: ["assessment_snapshot", "answer_attempt"] } }, select: { phaseKey: true, eventType: true, targetId: true, payload: true, serverTimestamp: true } }),
    prisma.phaseLearningProgress.findMany({ where: { userId: user.id, courseId, phaseKey: { in: phaseKeys } }, select: { phaseKey: true, summary: true, completedAt: true, updatedAt: true } }),
  ]);
  return buildConceptProgress(courseId, events, phases);
}
