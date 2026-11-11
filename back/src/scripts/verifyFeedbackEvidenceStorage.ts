/** メモリ内の保存アダプタだけを使用し、DB・ネットワークには接続しない。 */
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { completePhaseByUser } from "../service/learning.service";
import * as achievements from "../service/achievement.service";
import * as goals from "../service/bigGoal.service";
import { aggregateConcepts, conceptDefinitions, validateEvidence } from "../service/feedbackConcepts";

async function main() {
  const db = prisma as unknown as Record<string, unknown>;
  (achievements as {evaluateAchievementsForUser: unknown}).evaluateAchievementsForUser = async()=>[];
  (goals as {evaluateBigGoalsForUser: unknown}).evaluateBigGoalsForUser = async()=>[];
  db.course = { findFirst: async()=>({id:conceptDefinitions[0].courseId,version:1}) };
  const stored: Record<string, unknown>[] = [];
  const phases: {phaseKey:string;status:string;summary:unknown}[] = [];
  type PhaseRow = {id:string;userId:string;courseId:string;phaseKey:string;status:string;summary:unknown;startedAt:Date;completedAt:Date};
  const phaseRows = new Map<string, PhaseRow>();
  const scopeKey = (scope:{userId:string;courseId:string;phaseKey:string})=>JSON.stringify([scope.userId,scope.courseId,scope.phaseKey]);
  const tx = {
    learningEvent: {
      findFirst: async({where}:{where:Record<string,unknown>})=>stored.find(row=>Object.entries(where).every(([key,value])=>row[key]===value)) ?? null,
      create: async({data}:{data:Record<string,unknown>})=>{
        assert.ok(!data.id || !stored.some(row=>row.id===data.id),"unique event identity");
        const event = {...data,id:data.id ?? `event-${stored.length}`,serverTimestamp:new Date()}; stored.push(event); return event;
      },
    },
    phaseLearningProgress: {
      findUnique: async({where}:{where:{userId_courseId_phaseKey:{userId:string;courseId:string;phaseKey:string}}})=>phaseRows.get(scopeKey(where.userId_courseId_phaseKey)) ?? null,
      upsert: async({create,update}:{create:PhaseRow;update:Partial<PhaseRow>})=>{
      assert.ok(stored.length, "evidence persisted before completed progress");
      const key=scopeKey(create), previous=phaseRows.get(key);
      const phase = previous ? {...previous,...update} : {...create,id:`phase-${phaseRows.size}`,status:"COMPLETED",startedAt:new Date()};
      phaseRows.set(key,phase); phases.push(phase); return phase;
    } },
    unitLearningProgress: { upsert: async()=>({}) },
    knowledgeCardPhaseScheduleEntry: { findUnique: async()=>null },
  };
  let transactionTail: Promise<unknown> = Promise.resolve();
  let retryFailures: string[] = [];
  let transactionAttempts=0;
  // アダプタは原子的なトランザクション境界をモデル化する。実DBのロック検証ではない。
  db.$transaction = (work:(client:unknown)=>Promise<unknown>,options?:{isolationLevel:string})=>{
    if(options)assert.equal(options.isolationLevel,"Serializable"); transactionAttempts++;
    const run=transactionTail.then(()=>{
      const failure=retryFailures.shift();
      if(failure) throw new Prisma.PrismaClientKnownRequestError("fixture conflict",{code:failure,clientVersion:"5.22.0"});
      return work(tx);
    });
    transactionTail=run.catch(()=>undefined);return run;
  };
  // 非同期キューが一件も到着していなくても完了APIだけで全設問が集約できる。
  for (const unit of conceptDefinitions) {
    for (const phaseKey of [...new Set(unit.concepts.flatMap(c=>c.questions.map(q=>q.phaseKey)))]) {
      const questions = unit.concepts.flatMap(c=>c.questions).filter(q=>q.phaseKey===phaseKey);
      const evidence = {version:1,assessmentId:phaseKey,sessionId:`session-${phaseKey}`,startedAt:1,
        records:questions.map(q=>({questionId:q.questionId,attempts:[{number:1,correct:false},{number:2,correct:true}]}))};
      const first=await completePhaseByUser({id:"owner",knowledgeCardTableNumber:1},unit.courseId,phaseKey,{assessmentEvidence:evidence});
      const events = stored.filter(e=>e.courseId===unit.courseId) as unknown as Parameters<typeof aggregateConcepts>[1];
      const snapshot = aggregateConcepts(unit.courseId,events,phases,"frozen")!;
      for (const q of questions) assert.ok(snapshot.concepts.flatMap(c=>c.evidence).find(e=>e.questionId===q.questionId && e.phaseKey===q.phaseKey)?.latest?.correct);
      const before = JSON.stringify(snapshot);
      // 同一セッション再保存とキューからの遅延・重複・順不同の初回誤答。
      const savedCount=stored.length, phaseWrites=phases.length;
      const repeated=await Promise.all([1,2,3].map(()=>completePhaseByUser({id:"owner",knowledgeCardTableNumber:1},unit.courseId,phaseKey,{assessmentEvidence:evidence})));
      assert.equal(stored.length,savedCount,"repeated completion does not append evidence");
      assert.equal(phases.length,phaseWrites,"repeated completion does not rewrite progress");
      assert.ok(repeated.every(r=>r.phase.completedAt===first.phase.completedAt),"same completion time keeps feedback event identity");
      const late = {...events.at(-1)!,id:"late",eventType:"answer_attempt",targetId:questions[0].questionId,payload:{assessmentId:phaseKey,assessmentSessionId:evidence.sessionId,assessmentStartedAt:1,attempt:1,correct:false}};
      assert.deepEqual(aggregateConcepts(unit.courseId,[late,...events,late].reverse(),phases,"frozen"),snapshot);
      assert.equal(JSON.stringify(snapshot),before,"snapshot remains immutable");
    }
  }
  const user={id:"owner",knowledgeCardTableNumber:1}, courseId=conceptDefinitions[0].courseId, phaseKey="bfs-check";
  const initial=phaseRows.get(scopeKey({...user,userId:user.id,courseId,phaseKey}))!;
  const original=validateEvidence(courseId,phaseKey,(initial.summary as {assessmentEvidence:unknown}).assessmentEvidence,true);
  const evidence={...original,sessionId:"new-learning-session"};
  const beforeNew=stored.length;
  const concurrently=await Promise.all([1,2,3].map(()=>completePhaseByUser(user,courseId,phaseKey,{assessmentEvidence:evidence})));
  assert.equal(stored.length,beforeNew+1,"concurrent first saves append exactly once");
  assert.ok(concurrently.every(r=>r.phase.completedAt===concurrently[0].phase.completedAt));
  assert.ok(concurrently[0].phase.completedAt!>initial.completedAt.toISOString(),"new learning session creates a distinct completion");
  const afterNew=stored.length;
  const reordered={...evidence,records:[...evidence.records].reverse()};
  await completePhaseByUser(user,courseId,phaseKey,{assessmentEvidence:reordered});
  assert.equal(stored.length,afterNew,"question order alone is not a different completion");
  const oldRetry=await completePhaseByUser(user,courseId,phaseKey,{assessmentEvidence:original});
  assert.equal(oldRetry.phase.completedAt,concurrently[0].phase.completedAt,"late retry cannot roll back a newer completion");
  assert.equal(stored.length,afterNew);
  const changed=JSON.parse(JSON.stringify(evidence));changed.records[0].attempts[0].correct=true;
  const beforeConflict=phases.length;
  await assert.rejects(completePhaseByUser(user,courseId,phaseKey,{assessmentEvidence:changed}),/異なる完了証拠/);
  assert.equal(stored.length,afterNew);assert.equal(phases.length,beforeConflict);
  // 同じセッションIDを別のユーザーが使っても、保存キーは共有されない。
  await completePhaseByUser({...user,id:"another-owner"},courseId,phaseKey,{assessmentEvidence:evidence});
  assert.equal(stored.length,afterNew+1);
  // 旧PR版のランダムIDでも照合し、既存の原本を置き換えない。
  stored.push({id:"legacy-random-id",userId:"legacy-owner",courseId,phaseKey,sessionId:evidence.sessionId,
    eventType:"assessment_snapshot",targetId:phaseKey,payload:evidence,clientTimestamp:new Date(),serverTimestamp:new Date()});
  phaseRows.set(scopeKey({userId:"legacy-owner",courseId,phaseKey}),{...initial,userId:"legacy-owner",summary:{assessmentEvidence:evidence}});
  const beforeLegacy=stored.length;
  const legacy=await completePhaseByUser({...user,id:"legacy-owner"},courseId,phaseKey,{assessmentEvidence:evidence});
  assert.equal(stored.length,beforeLegacy);assert.equal(legacy.phase.completedAt,initial.completedAt.toISOString());
  const beforeRetry=transactionAttempts;
  retryFailures=["P2034","P2002"];
  await completePhaseByUser(user,courseId,phaseKey,{assessmentEvidence:evidence});
  assert.equal(transactionAttempts,beforeRetry+3,"retry serialization/unique conflicts with a bounded budget");
  retryFailures=["P2034","P2034","P2034"];
  await assert.rejects(completePhaseByUser(user,courseId,phaseKey,{assessmentEvidence:evidence}),/fixture conflict/);
  const missingOwner={...user,id:"missing-owner"};
  const missing=await completePhaseByUser(missingOwner,courseId,phaseKey,{});
  assert.equal((missing.phase.summary as {assessmentEvidenceStatus:string}).assessmentEvidenceStatus,"missing");
  const missingEvents=stored.filter(e=>e.userId===missingOwner.id) as unknown as Parameters<typeof aggregateConcepts>[1];
  const missingSnapshot=aggregateConcepts(courseId,missingEvents,[],"missing")!;
  assert.ok(missingSnapshot.concepts.every(c=>c.state==="unobserved"));
  assert.equal(missingSnapshot.missingCompletionEvidence.length,1);
  const validBefore=aggregateConcepts(courseId,stored.filter(e=>e.userId===user.id && e.courseId===courseId) as unknown as Parameters<typeof aggregateConcepts>[1],[],"snapshot")!;
  await completePhaseByUser(user,courseId,phaseKey);
  const validAfter=aggregateConcepts(courseId,stored.filter(e=>e.userId===user.id && e.courseId===courseId) as unknown as Parameters<typeof aggregateConcepts>[1],[],"snapshot")!;
  assert.deepEqual(validBefore.concepts,validAfter.concepts,"missing completion does not erase reliable previous answers");
  const count = stored.length, writes = phases.length;
  for(const invalid of [null,{}, {...evidence,records:[]}]) {
    await assert.rejects(completePhaseByUser(user,courseId,phaseKey,{assessmentEvidence:invalid}),/回答証拠/);
    assert.equal(stored.length,count);assert.equal(phases.length,writes,"invalid evidence never starts persistence");
  }
  console.log("PASS: seven units evidence, delayed answers, completion retry/concurrency, unchanged feedback identity, separate relearning/owners, conflict rejection and bounded transaction retries");
}
void main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
