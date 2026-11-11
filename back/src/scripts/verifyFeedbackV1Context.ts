/** 所有者限定クエリと両実験条件の共通入力をメモリfixtureで検証する。 */
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma";
import { buildFeedbackV1Context } from "../service/feedbackV1.context";
import { analysisPrompt } from "../service/feedbackV1.engine";
import * as achievements from "../service/achievement.service";
import * as goals from "../service/bigGoal.service";
async function main() {
  const db = prisma as unknown as Record<string, unknown>;
  const courseId="course-algorithm-breadth-first-search-v1";
  let condition="STANDARD";
  let assigned=true;
  const phaseRows=[{id:"progress",phaseKey:"bfs-check",courseId,status:"COMPLETED",summary:{firstAttemptCorrect:1,totalQuestions:2},startedAt:new Date(),completedAt:new Date()}];
  const user={id:"owner",firebaseUid:"uid",experience:0,selectedTargetAchievementId:null,hexadResponse:{questionnaireVersion:"hexad-test",philanthropistScore:4,socialiserScore:8,freeSpiritScore:12,achieverScore:16,disruptorScore:20,playerScore:24}};
  db.user={findUnique:async()=>({...user,experimentAssignments:assigned?[{condition,assignedAt:new Date(0)}]:[]})};
  db.course={findUnique:async()=>({id:courseId,title:"幅優先探索"}),findMany:async()=>[{id:courseId,title:"幅優先探索"}]};
  db.unitLearningProgress={findUnique:async()=>({status:"IN_PROGRESS"}),findMany:async()=>[]};
  db.phaseLearningProgress={findMany:async()=>phaseRows};
  db.learningEvent={findMany:async({where}:{where:{userId:string;courseId:string}})=>{
    assert.equal(where.userId,"owner");assert.equal(where.courseId,courseId);
    return [{id:"answer",courseId,phaseKey:"bfs-check",targetId:"take-next",sessionId:"tab",eventType:"answer_attempt",clientTimestamp:new Date(),serverTimestamp:new Date(),
      payload:{correct:false,attempt:1,assessmentId:"bfs-check",assessmentSessionId:"s",assessmentStartedAt:1}}];
  }};
  for (const name of ["createQuest","knowledgeCard","achievement","questPost","feedbackV1","createQuestFeedback"]) db[name]={findMany:async()=>[]};
  (achievements as {getAchievementsByUser:unknown}).getAchievementsByUser=async()=>[];
  (goals as {getActiveBigGoal:unknown}).getActiveBigGoal=async()=>null;
  const standard=await buildFeedbackV1Context("uid","phase",`${courseId}:bfs-check:bfs-code-mapping`);
  condition="PERSONALIZED";
  const personalized=await buildFeedbackV1Context("uid","phase",`${courseId}:bfs-check:bfs-code-mapping`);
  assert.equal(standard.input.hexad,null); assert.ok(personalized.input.hexad);
  // 要求ごとの不変スナップショットIDだけは異なる。内容と分析条件は同じ。
  const normalize=(input:unknown)=>JSON.stringify(input).replace(/"id":"[a-f0-9-]{36}"/g,'"id":"snapshot"');
  assert.equal(normalize(standard.input.learning),normalize(personalized.input.learning));
  assert.equal(normalize(analysisPrompt(standard.input)),normalize(analysisPrompt({...standard.input,hexad:personalized.input.hexad})));
  assert.deepEqual(standard.input.actions,personalized.input.actions);
  const learning=standard.input.learning as {conceptSnapshot:{concepts:{state:string}[]}};
  assert.equal(learning.conceptSnapshot.concepts[0].state,"needs_check");
  assert.ok(standard.input.targets[23].some(t=>t.id==="bfs-code-mapping"));
  await assert.rejects(buildFeedbackV1Context("uid","phase",`${courseId}:bfs-check:bfs-implementation`),/Invalid next phase/);
  assigned=false;
  await assert.rejects(buildFeedbackV1Context("uid","phase",`${courseId}:bfs-check`),/Experiment assignment/);
  console.log("PASS: owner-scoped evidence, immutable common snapshot, STANDARD/PERSONALIZED parity, HEXAD isolation, allowed next phase, assignment guard");
}
void main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
