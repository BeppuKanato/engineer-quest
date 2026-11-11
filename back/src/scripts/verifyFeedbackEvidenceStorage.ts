/** メモリ内の保存アダプタだけを使用し、DB・ネットワークには接続しない。 */
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma";
import { completePhaseByUser } from "../service/learning.service";
import * as achievements from "../service/achievement.service";
import * as goals from "../service/bigGoal.service";
import { aggregateConcepts, conceptDefinitions } from "../service/feedbackConcepts";

async function main() {
  const db = prisma as unknown as Record<string, unknown>;
  (achievements as {evaluateAchievementsForUser: unknown}).evaluateAchievementsForUser = async()=>[];
  (goals as {evaluateBigGoalsForUser: unknown}).evaluateBigGoalsForUser = async()=>[];
  db.course = { findFirst: async()=>({id:conceptDefinitions[0].courseId,version:1}) };
  const stored: Record<string, unknown>[] = [];
  const phases: {phaseKey:string;status:string;summary:unknown}[] = [];
  const tx = {
    learningEvent: { create: async({data}:{data:Record<string,unknown>})=>{stored.push({...data,id:`event-${stored.length}`,serverTimestamp:new Date()});} },
    phaseLearningProgress: { upsert: async({create}:{create:{phaseKey:string;summary:unknown}})=>{
      assert.ok(stored.length, "evidence persisted before completed progress");
      const phase = {...create,status:"COMPLETED",startedAt:new Date(),completedAt:new Date()}; phases.push(phase); return phase;
    } },
    unitLearningProgress: { upsert: async()=>({}) },
    knowledgeCardPhaseScheduleEntry: { findUnique: async()=>null },
  };
  db.$transaction = async(work:(client:unknown)=>Promise<unknown>)=>work(tx);
  // 非同期キューが一件も到着していなくても完了APIだけで全設問が集約できる。
  for (const unit of conceptDefinitions) {
    for (const phaseKey of [...new Set(unit.concepts.flatMap(c=>c.questions.map(q=>q.phaseKey)))]) {
      const questions = unit.concepts.flatMap(c=>c.questions).filter(q=>q.phaseKey===phaseKey);
      const evidence = {version:1,assessmentId:phaseKey,sessionId:`session-${phaseKey}`,startedAt:1,
        records:questions.map(q=>({questionId:q.questionId,attempts:[{number:1,correct:false},{number:2,correct:true}]}))};
      await completePhaseByUser({id:"owner",knowledgeCardTableNumber:1},unit.courseId,phaseKey,{assessmentEvidence:evidence});
      const events = stored.filter(e=>e.courseId===unit.courseId) as unknown as Parameters<typeof aggregateConcepts>[1];
      const snapshot = aggregateConcepts(unit.courseId,events,phases,"frozen")!;
      for (const q of questions) assert.ok(snapshot.concepts.flatMap(c=>c.evidence).find(e=>e.questionId===q.questionId && e.phaseKey===q.phaseKey)?.latest?.correct);
      const before = JSON.stringify(snapshot);
      // 同一セッション再保存とキューからの遅延・重複・順不同の初回誤答。
      await completePhaseByUser({id:"owner",knowledgeCardTableNumber:1},unit.courseId,phaseKey,{assessmentEvidence:evidence});
      const late = {...events.at(-1)!,id:"late",eventType:"answer_attempt",targetId:questions[0].questionId,payload:{assessmentId:phaseKey,assessmentSessionId:evidence.sessionId,assessmentStartedAt:1,attempt:1,correct:false}};
      assert.deepEqual(aggregateConcepts(unit.courseId,[late,...events,late].reverse(),phases,"frozen"),snapshot);
      assert.equal(JSON.stringify(snapshot),before,"snapshot remains immutable");
    }
  }
  const count = stored.length;
  await assert.rejects(completePhaseByUser({id:"owner",knowledgeCardTableNumber:1},conceptDefinitions[0].courseId,"bfs-check",{}),/回答証拠/);
  assert.equal(stored.length,count,"invalid completion never starts persistence");
  console.log("PASS: seven units completion snapshots, no queued events, delayed/duplicate answers, atomic ordering, invalid evidence");
}
void main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
