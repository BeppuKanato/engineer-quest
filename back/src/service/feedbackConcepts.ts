import { z } from "zod";
import definitions from "../learning/feedback/concepts.json";

export { definitions as conceptDefinitions };
export const evidenceSchema = z.object({
  version: z.literal(1), assessmentId: z.string().min(1), sessionId: z.string().min(1).max(160),
  startedAt: z.number().int().positive(),
  records: z.array(z.object({ questionId: z.string().min(1),
    attempts: z.array(z.object({ number: z.number().int().positive(), correct: z.boolean() })).max(1000),
  })).max(100),
});
export type AssessmentEvidence = z.infer<typeof evidenceSchema>;
export const questionKey = (q: { phaseKey: string; assessmentId: string; questionId: string }) => `${q.phaseKey}/${q.assessmentId}/${q.questionId}`;
export function validateEvidence(courseId: string, phaseKey: string, value: unknown, complete = false) {
  const evidence = evidenceSchema.parse(value);
  const questions = definitions.find(u => u.courseId === courseId)?.concepts.flatMap(c => c.questions).filter(q => q.phaseKey === phaseKey) ?? [];
  if (!questions.length || evidence.assessmentId !== questions[0].assessmentId ||
      new Set(evidence.records.map(r => r.questionId)).size !== evidence.records.length ||
      evidence.records.some(r => !questions.some(q => q.questionId === r.questionId) || r.attempts.some((a,i) => a.number !== i+1)) ||
      (complete && (evidence.records.length !== questions.length || evidence.records.some(r => !r.attempts.length)))) throw new Error("INVALID_ASSESSMENT_EVIDENCE");
  return evidence;
}
type Event = { id: string; phaseKey: string | null; eventType: string; targetId: string | null; sessionId: string; payload: unknown; clientTimestamp: Date; serverTimestamp: Date };
type Attempt = { sourceId: string; sessionId: string; startedAt: number; number: number; correct: boolean; confirmed: boolean };
const object = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
/** 回答順は設問セッションとattemptで同定する。重複配信・キューの到着順には依存しない。 */
export function aggregateConcepts(courseId: string, events: Event[], phases: { phaseKey: string; status: string; summary: unknown }[], snapshotId: string) {
  const unit = definitions.find(u => u.courseId === courseId);
  if (!unit) return null;
  const byQuestion = new Map<string, Map<string, Attempt>>();
  const add = (key: string, attempt: Attempt) => {
    const map = byQuestion.get(key) ?? new Map<string, Attempt>();
    const identity = `${attempt.sessionId}/${attempt.number}`;
    const previous = map.get(identity);
    // 完了保存の確定証拠を優先。矛盾した同一attemptは保守的に誤答を採用する。
    if (!previous || Number(attempt.confirmed) > Number(previous.confirmed) ||
      (attempt.confirmed === previous.confirmed && (!attempt.correct && previous.correct || attempt.correct === previous.correct && attempt.sourceId < previous.sourceId))) map.set(identity, attempt);
    byQuestion.set(key, map);
  };
  const questions = unit.concepts.flatMap(c => c.questions);
  for (const event of events) {
    if (!event.phaseKey) continue;
    const payload = object(event.payload);
    if (event.eventType === "assessment_snapshot") {
      try {
        const evidence = validateEvidence(courseId, event.phaseKey, payload);
        for (const record of evidence.records) for (const a of record.attempts) add(questionKey({phaseKey: event.phaseKey, assessmentId: evidence.assessmentId, questionId: record.questionId}),
          { sourceId: event.id, sessionId: evidence.sessionId, startedAt: evidence.startedAt, ...a, confirmed: true });
      } catch { /* 不完全な旧ログから推定しない。原本は維持する。 */ }
    }
    if (event.eventType === "answer_attempt" && typeof payload.correct === "boolean" && Number.isInteger(payload.attempt) && Number(payload.attempt) > 0) {
      const q = questions.find(q => q.phaseKey === event.phaseKey && q.questionId === event.targetId && q.assessmentId === payload.assessmentId);
      if (!q) continue;
      // セッション識別のない旧回答はattempt再開の区別が不能。確実な根拠にはしない。
      if (typeof payload.assessmentSessionId !== "string" || typeof payload.assessmentStartedAt !== "number" || !Number.isSafeInteger(payload.assessmentStartedAt) || payload.assessmentStartedAt <= 0 || !payload.assessmentSessionId) continue;
      add(questionKey(q), { sourceId: event.id, sessionId: payload.assessmentSessionId, startedAt: payload.assessmentStartedAt, number: Number(payload.attempt), correct: payload.correct, confirmed: false });
    }
  }
  return { id: snapshotId, version: 1 as const, courseId, title: unit.title,
    missingCompletionEvidence: events.filter(e=>e.eventType==="assessment_evidence_missing").map(e=>({sourceId:e.id,phaseKey:e.phaseKey})).sort((a,b)=>a.sourceId.localeCompare(b.sourceId)), relation: "unit-components" as const,
    concepts: unit.concepts.map(c => {
      const evidence = c.questions.map(q => {
        const attempts = [...(byQuestion.get(questionKey(q))?.values() ?? [])].sort((a,b) => a.startedAt-b.startedAt || a.sessionId.localeCompare(b.sessionId) || a.number-b.number);
        const latest = attempts.at(-1) ?? null;
        const currentSession = latest ? attempts.filter(a => a.sessionId === latest.sessionId) : [];
        return { ...q, first: attempts[0]?.number === 1 ? attempts[0] : null, latest, retried: attempts.some(a=>a.number>1), latestSessionFirst: currentSession.find(a=>a.number===1) ?? null, sessions: new Set(attempts.map(a=>a.sessionId)).size };
      });
      const answered = evidence.filter(q=>q.latest);
      const implementationPhase = phases.find(p => p.phaseKey === c.phaseKey);
      const summary = object(implementationPhase?.summary);
      return { conceptId: c.conceptId, label: c.label, kind: c.kind,
        state: answered.length === 0 ? "unobserved" as const : answered.some(q=>q.latest?.correct === false) ? "needs_check" as const : "confirmed" as const,
        attemptedQuestions: answered.length, totalQuestions: evidence.length, evidence,
        implementation: c.kind === "implementation" ? implementationEvidence(c.phaseKey!, implementationPhase?.status, summary, events) : null };
    }) };
}
export type ConceptSnapshot = NonNullable<ReturnType<typeof aggregateConcepts>>;

function implementationEvidence(phaseKey: string, status: string | undefined, summary: Record<string, unknown>, events: Event[]) {
  const unique = new Map<string, Event>();
  for (const event of events.filter(e=>e.phaseKey===phaseKey && ["implementation_test_result","hint_open","implementation_level_select","implementation_complete"].includes(e.eventType))) {
    const sequence = object(event.payload).sequence;
    const key = Number.isInteger(sequence) ? `${event.sessionId}/${sequence}` : event.id;
    const previous = unique.get(key);
    if (!previous || event.id < previous.id) unique.set(key,event);
  }
  const ordered = [...unique.values()].sort((a,b)=>a.clientTimestamp.getTime()-b.clientTimestamp.getTime() || a.sessionId.localeCompare(b.sessionId) || Number(object(a.payload).sequence ?? 0)-Number(object(b.payload).sequence ?? 0) || a.id.localeCompare(b.id));
  const lastTest = ordered.filter(e=>e.eventType==="implementation_test_result").at(-1);
  const result = object(lastTest?.payload);
  const results = Array.isArray(result.results) ? result.results.flatMap(r=>{
    const item=object(r); return typeof item.id === "string" && typeof item.passed === "boolean" ? [{testId:item.id,passed:item.passed}] : [];
  }) : [];
  const lastLevel = ordered.filter(e=>typeof object(e.payload).level === "string").at(-1);
  const hints = ordered.filter(e=>e.eventType==="hint_open").map(e=>({sourceId:e.id,level:object(e.payload).level,count:object(e.payload).count}));
  return {
    completed: status === "COMPLETED" ? true : "unknown" as const,
    testsPassed: status === "COMPLETED" ? true : results.some(r=>!r.passed) ? false : "unknown" as const,
    testRuns: typeof summary.testRuns === "number" ? summary.testRuns : typeof result.count === "number" ? result.count : "unknown" as const,
    hintUsage: Array.isArray(summary.hintUsage) && summary.hintUsage.every(n=>typeof n === "number" && n>=0) ? summary.hintUsage : "unknown" as const,
    inputLevel: typeof summary.inputLevel === "string" ? summary.inputLevel : lastLevel ? String(object(lastLevel.payload).level) : "unknown" as const,
    sourceIds: ordered.map(e=>e.id), lastTest: lastTest ? {sourceId:lastTest.id,results} : null, observedHints: hints,
  };
}
