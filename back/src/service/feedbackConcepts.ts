import { z } from "zod";
import definitionData from "../learning/feedback/concepts.json";

const nonempty=z.string().trim().min(1);
const questionDefinitionSchema=z.object({phaseKey:nonempty,assessmentId:nonempty,questionId:nonempty,tags:z.array(nonempty).min(1),stageLabel:nonempty,questionLabel:nonempty});
const definitionsSchema=z.array(z.object({courseId:nonempty,kind:nonempty,title:nonempty,
  phases:z.array(z.object({id:nonempty,phase:z.number().int().min(1).max(7),formalName:nonempty})).min(1),
  concepts:z.array(z.object({conceptId:nonempty,label:nonempty,kind:z.enum(["assessment","implementation"]),phaseKey:nonempty.optional(),questions:z.array(questionDefinitionSchema)})).min(1),
})).min(1);
/** バックエンド単独でも定義の欠陥を検出し、誤った概念状態を計算しない。 */
export function validateConceptDefinitions(value:unknown) {
  const units=definitionsSchema.parse(value), courses=new Set<string>(), kinds=new Set<string>(), ids=new Set<string>();
  for(const unit of units) {
    if(courses.has(unit.courseId) || kinds.has(unit.kind) || new Set(unit.phases.map(p=>p.id)).size!==unit.phases.length || new Set(unit.phases.map(p=>p.phase)).size!==unit.phases.length)throw new Error("INVALID_CONCEPT_DEFINITIONS");
    courses.add(unit.courseId);kinds.add(unit.kind);
    const keys=new Set<string>();
    for(const concept of unit.concepts) {
      if(ids.has(concept.conceptId))throw new Error("INVALID_CONCEPT_DEFINITIONS");
      ids.add(concept.conceptId);
      if(concept.kind==="implementation" ? concept.questions.length!==0 || !unit.phases.some(p=>p.id===concept.phaseKey && p.phase===7) : !concept.questions.length || concept.phaseKey!==undefined)throw new Error("INVALID_CONCEPT_DEFINITIONS");
      for(const question of concept.questions) {
        const phase=unit.phases.find(p=>p.id===question.phaseKey), key=JSON.stringify([question.phaseKey,question.assessmentId,question.questionId]);
        if(!phase || ![3,5,6].includes(phase.phase) || question.stageLabel!==phase.formalName || !/[一-龯ぁ-んァ-ヶ]/u.test(question.questionLabel) || keys.has(key))throw new Error("INVALID_CONCEPT_DEFINITIONS");
        keys.add(key);
      }
    }
  }
  return units;
}
const definitions=validateConceptDefinitions(definitionData);
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
type Attempt = { sourceId: string; sessionId: string; startedAt: number; number: number; correct: boolean; confirmed: boolean; recordedAt: number; observedAt: number };
const object = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
/** 完了証拠は最初の確定受信時刻、未完了回答は最新attemptの最初の受信時刻で比較する。 */
export function aggregateConcepts(courseId: string, events: Event[], phases: { phaseKey: string; status: string; summary: unknown }[], snapshotId: string) {
  const unit = definitions.find(u => u.courseId === courseId);
  if (!unit) return null;
  const byQuestion = new Map<string, Map<string, Attempt>>();
  const add = (key: string, attempt: Attempt) => {
    const map = byQuestion.get(key) ?? new Map<string, Attempt>();
    const identity = `${attempt.sessionId}/${attempt.number}`;
    const previous = map.get(identity);
    // 同一attemptの再配信は順序を進めない。矛盾した正誤は確定証拠、次に誤答を優先する。
    const preferred = !previous || Number(attempt.confirmed) > Number(previous.confirmed) ||
      (attempt.confirmed === previous.confirmed && (!attempt.correct && previous.correct || attempt.correct === previous.correct &&
        (attempt.recordedAt < previous.recordedAt || attempt.recordedAt === previous.recordedAt && attempt.sourceId < previous.sourceId)));
    const selected = preferred ? attempt : previous!;
    map.set(identity, previous ? { ...selected, recordedAt: Math.min(previous.recordedAt,attempt.recordedAt), observedAt: Math.min(previous.observedAt,attempt.observedAt) } : selected);
    byQuestion.set(key, map);
  };
  const questions = unit.concepts.flatMap(c => c.questions);
  const sessionKey = (phaseKey:string, assessmentId:string, sessionId:string)=>JSON.stringify([phaseKey,assessmentId,sessionId]);
  const snapshots: {event:Event;evidence:AssessmentEvidence;key:string}[]=[];
  const confirmedAt = new Map<string,number>();
  const raw: {key:string;sessionKey:string;attempt:Attempt}[]=[];
  for (const event of events) {
    if (!event.phaseKey) continue;
    const payload = object(event.payload), receivedAt=event.serverTimestamp.getTime();
    if (event.eventType === "assessment_snapshot") {
      try {
        const evidence=validateEvidence(courseId,event.phaseKey,payload);
        const key=sessionKey(event.phaseKey,evidence.assessmentId,evidence.sessionId);
        snapshots.push({event,evidence,key});confirmedAt.set(key,Math.min(confirmedAt.get(key) ?? Infinity,receivedAt));
      } catch { /* 不完全な旧ログを回答証拠と推定しない。 */ }
    }
    if (event.eventType === "answer_attempt" && typeof payload.correct === "boolean" && Number.isInteger(payload.attempt) && Number(payload.attempt)>0) {
      const q=questions.find(q=>q.phaseKey===event.phaseKey && q.questionId===event.targetId && q.assessmentId===payload.assessmentId);
      if (!q || typeof payload.assessmentSessionId!=="string" || !payload.assessmentSessionId || typeof payload.assessmentStartedAt!=="number" || !Number.isSafeInteger(payload.assessmentStartedAt) || payload.assessmentStartedAt<=0) continue;
      raw.push({key:questionKey(q),sessionKey:sessionKey(q.phaseKey,q.assessmentId,payload.assessmentSessionId),attempt:{sourceId:event.id,sessionId:payload.assessmentSessionId,startedAt:payload.assessmentStartedAt,number:Number(payload.attempt),correct:payload.correct,confirmed:false,recordedAt:receivedAt,observedAt:receivedAt}});
    }
  }
  const firstReceipts=new Map<string,number>();
  const receiptKey=(key:string,a:Pick<Attempt,"sessionId"|"number"|"correct">)=>JSON.stringify([key,a.sessionId,a.number,a.correct]);
  for (const row of raw) {
    const id=receiptKey(row.key,row.attempt);firstReceipts.set(id,Math.min(firstReceipts.get(id) ?? Infinity,row.attempt.recordedAt));
    // 完了済みセッションへの遅延ログは、確定時刻も確定回答も変更しない。
    if(!confirmedAt.has(row.sessionKey))add(row.key,row.attempt);
  }
  for(const {event,evidence,key} of snapshots) for(const record of evidence.records) for(const a of record.attempts) {
    const qkey=questionKey({phaseKey:event.phaseKey!,assessmentId:evidence.assessmentId,questionId:record.questionId});
    const recordedAt=confirmedAt.get(key)!;
    add(qkey,{sourceId:event.id,sessionId:evidence.sessionId,startedAt:evidence.startedAt,...a,confirmed:true,recordedAt,
      observedAt:Math.min(recordedAt,firstReceipts.get(receiptKey(qkey,{sessionId:evidence.sessionId,...a})) ?? Infinity)});
  }
  return { id: snapshotId, version: 1 as const, courseId, title: unit.title,
    missingCompletionEvidence: events.filter(e=>e.eventType==="assessment_evidence_missing").map(e=>({sourceId:e.id,phaseKey:e.phaseKey})).sort((a,b)=>a.sourceId.localeCompare(b.sourceId)), relation: "unit-components" as const,
    concepts: unit.concepts.map(c => {
      const evidence = c.questions.map(q => {
        const groups=new Map<string,Attempt[]>();
        for(const attempt of byQuestion.get(questionKey(q))?.values() ?? [])groups.set(attempt.sessionId,[...(groups.get(attempt.sessionId) ?? []),attempt]);
        const sessions=[...groups.values()].map(group=>group.sort((a,b)=>a.number-b.number));
        sessions.sort((a,b)=>a.at(-1)!.recordedAt-b.at(-1)!.recordedAt || a[0].sessionId.localeCompare(b[0].sessionId));
        const attempts=sessions.flat(), currentSession=sessions.at(-1) ?? [], latest=currentSession.at(-1) ?? null;
        const firstSession=[...sessions].sort((a,b)=>Math.min(...a.map(x=>x.observedAt))-Math.min(...b.map(x=>x.observedAt)) || a[0].sessionId.localeCompare(b[0].sessionId))[0];
        return { ...q, first: firstSession?.find(a=>a.number===1) ?? null, latest, retried: attempts.some(a=>a.number>1), latestSessionFirst: currentSession.find(a=>a.number===1) ?? null, sessions: sessions.length };
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
    if (!previous || event.serverTimestamp.getTime()<previous.serverTimestamp.getTime() || event.serverTimestamp.getTime()===previous.serverTimestamp.getTime() && event.id < previous.id) unique.set(key,event);
  }
  const ordered = [...unique.values()].sort((a,b)=>a.serverTimestamp.getTime()-b.serverTimestamp.getTime() || a.sessionId.localeCompare(b.sessionId) || Number(object(a.payload).sequence ?? 0)-Number(object(b.payload).sequence ?? 0) || a.id.localeCompare(b.id));
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
