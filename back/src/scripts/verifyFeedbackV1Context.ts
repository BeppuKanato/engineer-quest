/** 所有者限定クエリと両実験条件の共通入力をメモリfixtureで検証する。 */
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma";
import { buildFeedbackV1Context } from "../service/feedbackV1.context";
import { analysisPrompt, selectionPrompt, validateAnalysis, type Analysis } from "../service/feedbackV1.engine";
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
  let unitStatus = "IN_PROGRESS";
  db.unitLearningProgress={findUnique:async({where}:{where:{userId_courseId:{userId:string}}})=>{ assert.equal(where.userId_courseId.userId,"owner"); return {status:unitStatus,completedAt:new Date()}; },findMany:async()=>[]};
  db.phaseLearningProgress={findMany:async({where}:{where:{userId:string}})=>{assert.equal(where.userId,"owner");return phaseRows;}};
  db.learningEvent={findMany:async({where}:{where:{userId:string;courseId:string}})=>{
    assert.equal(where.userId,"owner");assert.equal(where.courseId,courseId);
    return [{id:"answer",courseId,phaseKey:"bfs-check",targetId:"take-next",sessionId:"tab",eventType:"answer_attempt",clientTimestamp:new Date(1000),serverTimestamp:new Date(1000),
      payload:{correct:false,attempt:1,assessmentId:"bfs-check",assessmentSessionId:"s",assessmentStartedAt:1}}];
  }};
  for (const name of ["createQuest","knowledgeCard","achievement","questPost","feedbackV1","createQuestFeedback"]) db[name]={findMany:async()=>[]};
  (achievements as {getAchievementsByUser:unknown}).getAchievementsByUser=async()=>[];
  (goals as {getActiveBigGoal:unknown}).getActiveBigGoal=async(userId:string)=>{
    assert.equal(userId,"owner");
    return {id:"owned-goal",userId,type:"UNIT_COMPLETION",params:{courseId},displayText:"単元を完了する",status:"ACTIVE",confirmedAt:null};
  };
  (goals as {loadBigGoalFacts:unknown}).loadBigGoalFacts=async(userId:string)=>{
    assert.equal(userId,"owner");return {unitStatus,phases:phaseRows};
  };
  // 直近で達成した大目標の照会もDBを使わないfixtureに差し替える。
  let recentlyClosed = false;
  db.bigGoal={findFirst:async({where}:{where:{userId:string}})=>{
    assert.equal(where.userId,"owner");
    return recentlyClosed ? {id:"closed-goal",userId:where.userId,type:"UNIT_COMPLETION",params:{courseId},displayText:"単元を完了する",status:"ACHIEVED",confirmedAt:null} : null;
  }};
  const standard=await buildFeedbackV1Context("uid","phase",`${courseId}:bfs-check:bfs-code-mapping`);
  condition="PERSONALIZED";
  const personalized=await buildFeedbackV1Context("uid","phase",`${courseId}:bfs-check:bfs-code-mapping`);
  assert.equal(standard.input.bigGoal?.sourceId,"goal:owned-goal");
  assert.ok(standard.input.evidenceSources?.some(e=>e.sourceId==="answer" && e.kind==="assessment"));
  assert.ok(standard.input.evidenceSources?.some(e=>e.sourceId==="goal:owned-goal" && e.path==="bigGoal"));
  assert.equal(standard.input.hexad,null); assert.ok(personalized.input.hexad);
  // 要求ごとの不変スナップショットIDだけは異なる。内容と分析条件は同じ。
  const normalize=(input:unknown)=>JSON.stringify(input).replace(/"id":"[a-f0-9-]{36}"/g,'"id":"snapshot"');
  assert.equal(normalize(standard.input.learning),normalize(personalized.input.learning));
  assert.equal(normalize(analysisPrompt(standard.input)),normalize(analysisPrompt({...standard.input,hexad:personalized.input.hexad})));
  assert.deepEqual(standard.input.actions,personalized.input.actions);
  assert.deepEqual(standard.input.stageGoals,personalized.input.stageGoals);
  const analysis:Analysis={currentState:"回答を記録しました",conceptClaims:[],understood:[],needsImprovement:[],uncertain:[],evidence:[{sourceId:"answer",fact:"記録",inference:false}]};
  const prompt=selectionPrompt(standard.input,analysis);
  const selectionInput=JSON.parse(prompt.slice(prompt.lastIndexOf("\n")+1));
  assert.deepEqual(selectionInput.stageGoals,{current:{phaseKey:"bfs-check",goal:"動きの確認問題"},next:{phaseKey:"bfs-code-mapping",goal:"動きとコードの対応"}});
  assert.equal(analysisPrompt(standard.input),analysisPrompt({...standard.input,stageGoals:null}),"selection-only structure does not change analysis input");
  const learning=standard.input.learning as {conceptSnapshot:{concepts:{state:string}[]}};
  assert.equal(learning.conceptSnapshot.concepts[0].state,"needs_check");
  assert.ok(standard.input.targets[23].some(t=>t.id==="bfs-code-mapping"));
  await assert.rejects(buildFeedbackV1Context("uid","phase",`${courseId}:bfs-check:bfs-implementation`),/Invalid next phase/);
  unitStatus="COMPLETED";recentlyClosed=true;
  const completed=await buildFeedbackV1Context("uid","unit",courseId);
  assert.equal(completed.input.bigGoal?.sourceId,"goal:closed-goal");
  assert.equal(completed.input.bigGoal?.status,"ACHIEVED");
  assert.ok(!completed.input.evidenceSources?.some(e=>e.sourceId==="goal:owned-goal"));
  assert.throws(()=>validateAnalysis(completed.input,{...analysis,evidence:[{sourceId:"goal:other-learner",fact:"記録",inference:false}]}),/UNKNOWN_EVIDENCE_SOURCE/);
  assigned=false;
  await assert.rejects(buildFeedbackV1Context("uid","phase",`${courseId}:bfs-check`),/Experiment assignment/);
  console.log("PASS: owner-scoped evidence, immutable common snapshot, STANDARD/PERSONALIZED parity, HEXAD isolation, allowed next phase, assignment guard");
}
void main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
