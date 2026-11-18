import assert from "node:assert/strict";
import { aggregateConcepts,conceptDefinitions,validateEvidence } from "../service/feedbackConcepts";
import { currentMaterialUnit,currentMaterialVersion,enrichLearningMaterials,globalConceptId,record,relatedCourseIds,selectRelatedEvidence } from "../service/feedbackMaterials";
import { prepareSavedFeedbackInput } from "../service/feedbackInputPreparation";
import { availableFeedbackCandidates,stage1Prompt,stage2Input,stage2Prompt,validateStage1,type FeedbackV2Input,type SupportPlanResult } from "../service/feedbackV2.engine";
import { resolveHexadCondition } from "../service/feedbackHexadConditions";

let questionCount=0;
for(const definition of conceptDefinitions) {
 const unit=currentMaterialUnit(definition.courseId)!;
 assert(unit);
 for(const assessment of unit.assessments) {
  const evidence={version:3,materialVersion:currentMaterialVersion(assessment.id),assessmentId:assessment.id,sessionId:"s",startedAt:1,
   records:assessment.questions.map(q=>({questionId:q.id,attempts:[{number:1,correct:true,answer:q.correctAnswer}]}))};
  validateEvidence(unit.courseId,assessment.phaseKey,evidence,true);
  questionCount+=assessment.questions.length;
  assert.throws(()=>validateEvidence(unit.courseId,assessment.phaseKey,{...evidence,materialVersion:"sha256:"+"0".repeat(64)},true));
  const wrong=structuredClone(evidence);wrong.records[0].attempts[0].correct=false;
  assert.throws(()=>validateEvidence(unit.courseId,assessment.phaseKey,wrong,true),/INVALID_MATERIAL_ANSWER/);
  const event={id:"event",phaseKey:assessment.phaseKey,eventType:"assessment_snapshot",targetId:assessment.id,sessionId:"s",payload:evidence,clientTimestamp:new Date(10),serverTimestamp:new Date(10)};
  const snapshot=aggregateConcepts(unit.courseId,[event],[{phaseKey:assessment.phaseKey,status:"COMPLETED",summary:{assessmentEvidence:evidence}}],"snapshot");
  const learning=enrichLearningMaterials({id:"learning",unit:{id:unit.courseId},currentPhase:{id:assessment.phaseKey},conceptSnapshot:snapshot});
  const concepts=record(record(learning).conceptSnapshot).concepts as {evidence:{attempts:unknown[];materials:unknown[];materialStatus:string}[]}[];
  assert.equal(concepts.flatMap(c=>c.evidence).filter(q=>q.materialStatus==="resolved").length,assessment.questions.length);
  assert(concepts.flatMap(c=>c.evidence).filter(q=>!q.attempts.length).every(q=>!q.materials.length));
  const mixed=enrichLearningMaterials({unit:{id:unit.courseId},conceptSnapshot:{concepts:[{conceptId:"mixed",evidence:[{phaseKey:assessment.phaseKey,questionId:assessment.questions[0].id,attempts:[{materialVersion:evidence.materialVersion},{}]}]}]}});
  const mixedQuestion=(record(record(mixed).conceptSnapshot).concepts as {evidence:{materialStatus:string;materials:{verification:string}[]}[]}[])[0].evidence[0];
  assert.equal(mixedQuestion.materialStatus,"partially-resolved");
  assert.equal(mixedQuestion.materials[0].verification,"recorded-with-answer");
  const input:FeedbackV2Input={learning,state:{history:[{note:"REACTION_MUST_NOT_LEAK"}]},hexad:null,bigGoal:null,
   actions:[{id:4,label:"復習",purpose:"学習",condition:"利用可",targetIds:["review"]}],targets:{4:[{id:"review",href:"/review",name:"復習",learningContent:unit.intro}]},experimentV2:resolveHexadCondition("STANDARD",null)};
  const candidates=availableFeedbackCandidates(input);
  const plan:SupportPlanResult={schemaVersion:"support-plan-v1",supportPlan:{educationalGoal:"確認",currentStateSummary:"記録",feedbackLevels:["FP"],feedUp:null,feedBack:null,feedForward:null,uncertainty:[],evidenceIds:[]},approvedCandidates:[{candidateId:candidates[0].candidateId,educationalReason:"教材の規則を確認",expectedPractice:"手順を説明",evidenceIds:[]}]};
  const first=stage1Prompt(input,candidates),second=stage2Prompt(stage2Input(input,validateStage1(input,plan,candidates),candidates));
  assert(first.includes('"recorded-with-answer"'));
  assert(second.includes('recorded-with-answer'));
  assert(!first.includes("REACTION_MUST_NOT_LEAK")&&!second.includes("REACTION_MUST_NOT_LEAK"));
  assert(!first.includes("HEXAD"));
  assert.equal(stage2Input(input,validateStage1(input,plan,candidates),candidates).hexadContext,null);
  const frozen=JSON.stringify(input);
  prepareSavedFeedbackInput(input);
  assert.equal(JSON.stringify(input),frozen,"offline conversion must preserve source snapshot");
  if(definition.kind==="bubble-sort"&&assessment.phase===5) {
    const legacy=structuredClone(input);
    const legacyConcepts=record(record(legacy.learning).conceptSnapshot).concepts as {evidence:{attempts:Record<string,unknown>[]}[]}[];
    legacyConcepts.flatMap(c=>c.evidence).flatMap(q=>q.attempts).forEach(a=>delete a.materialVersion);
    const unknown=prepareSavedFeedbackInput(legacy);
    assert(JSON.stringify(unknown.learning).includes("unversioned-answer"));
    const assumed=prepareSavedFeedbackInput(legacy,true);
    assert(JSON.stringify(assumed.learning).includes("explicit-legacy-assumption"));
    const broken=structuredClone(legacy);
    const brokenConcepts=record(record(broken.learning).conceptSnapshot).concepts as {evidence:{attempts:Record<string,unknown>[]}[]}[];
    brokenConcepts.flatMap(c=>c.evidence).flatMap(q=>q.attempts)[0].answer={kind:"choice",choiceId:"invented"};
    assert.throws(()=>prepareSavedFeedbackInput(broken,true),/INVALID_MATERIAL_ANSWER/);
  }
 }
}
assert.equal(questionCount,150);
assert.equal(globalConceptId("bubble-sort:flow"),null);
assert.equal(globalConceptId("binary-search:flow"),null,"matching suffix does not mean equivalent learning goal");
assert.deepEqual(relatedCourseIds(conceptDefinitions[0].courseId,conceptDefinitions),[conceptDefinitions[1].courseId]);
const linked=selectRelatedEvidence({conceptSnapshot:{concepts:[{conceptId:"bfs:discovered"}]}},{conceptSnapshot:{courseId:"dfs",concepts:[{conceptId:"dfs:discovered",evidence:[{questionId:"same-rule",attempts:[{correct:false}]}]},{conceptId:"dfs:order",evidence:[{questionId:"different-rule",attempts:[{correct:false}]}]}]}});
assert.equal(linked.length,1);assert.equal(linked[0].question.questionId,"same-rule");
console.log("PASS: 7 units/150 questions, versioned answers/materials, invalid-reference and correctness rejection, both LLM stages, immutable saved inputs and explicit cross-unit mapping");
