import { summarizeReaction } from "../service/feedbackV1.observation";
import assert from "node:assert/strict";
import { generate, analysisSchema, selectionSchema, validateSelection, validateAnalysis, analysisPrompt, selectionPrompt, type Input, type Analysis, type Candidate } from "../service/feedbackV1.engine";
import { aggregateConcepts, conceptDefinitions } from "../service/feedbackConcepts";
async function main() {
  const unit = conceptDefinitions[0];
  const event = {id:"answer",phaseKey:"bfs-check",eventType:"answer_attempt",targetId:"take-next",sessionId:"tab",clientTimestamp:new Date(),serverTimestamp:new Date(),
    payload:{assessmentId:"bfs-check",assessmentSessionId:"s",assessmentStartedAt:1,attempt:1,correct:false}};
  const conceptSnapshot = aggregateConcepts(unit.courseId,[event],[],"snapshot")!;
  const input: Input = {learning:{conceptSnapshot},state:{stage:"動きの確認問題"},actions:[{id:4,label:"復習",purpose:"確認",condition:"完了済み",targetIds:["bfs-check"]}],
    targets:{4:[{id:"bfs-check",href:"/courses/roadmap/bfs/learn?phase=bfs-check"}]},hexad:null,bigGoal:null};
  const analysis: Analysis = {currentState:"探索順序の設問に誤答が記録されています。図で取り出す順序を確かめられます。",understood:[],needsImprovement:["探索順序"],uncertain:[],
    evidence:[{sourceId:"answer",fact:"探索順序の設問への誤答",inference:false}],conceptClaims:[{conceptId:"bfs:order",state:"needs_check",sourceIds:["answer"],observation:"直近は誤答"}]};
  const candidates: Candidate[] = [
    {nextStep:"図を開いて次に取り出す場所を追う",reason:"探索順序の直近の回答を確かめるため",purpose:"探索順序の確認",actionLabel:"図を確認する",actionId:4,targetId:"bfs-check",capabilityId:null,personalizationAdjustment:null},
    {nextStep:"取り出す順番を頭の中でたどる",reason:"同じ順序を自分で再現できるか確かめるため",purpose:"手順の整理",actionLabel:"頭の中で追う",actionId:null,targetId:null,capabilityId:"mental-rehearsal",personalizationAdjustment:null},
    {nextStep:"先に入れた場所から取り出す理由を言葉にする",reason:"図で追った順番とキューの規則を結びつけるため",purpose:"規則の説明",actionLabel:"理由を整理する",actionId:null,targetId:null,capabilityId:"explain-reasoning",personalizationAdjustment:null},
  ];
  for (const n of [1,2,3]) {
    const logs: unknown[]=[];
    const result = await generate(input,async(stage)=>({output:stage==="analysis"?analysis:{nextGoal:"キューから取り出す順序を説明する",candidates:candidates.slice(0,n)},model:"fixture",responseId:stage,usage:null}),async log=>{logs.push(log);});
    assert.equal(result.selection.candidates?.length,n);
    assert.equal(result.validation.candidates.length,n);
    assert.equal(result.validation.candidates[0].actionHref,input.targets[4][0].href);
    if(n>1) assert.equal(result.validation.candidates[1].actionHref,null);
    assert.equal(logs.length,3);
  }
  assert.throws(()=>selectionSchema.parse({nextGoal:"確認",candidates:[]}));
  assert.throws(()=>selectionSchema.parse({nextGoal:"確認",candidates:[...candidates,...candidates]}));
  assert.doesNotThrow(()=>selectionSchema.parse({nextGoal:"目標".repeat(300),candidates:[{...candidates[0],nextStep:"手順".repeat(300),reason:"理由".repeat(300),actionLabel:"行動".repeat(100),purpose:"目的".repeat(100)}]}));
  assert.doesNotThrow(()=>analysisSchema.parse({...analysis,currentState:"学習状況".repeat(300)}));
  assert.throws(()=>selectionSchema.parse({nextGoal:" ",candidates:[candidates[0]]}));
  const select = (cs:Candidate[])=>({nextGoal:"確認",...cs[0],candidates:cs});
  assert.doesNotThrow(()=>validateSelection(input,select([candidates[0],candidates[0]])),"duplicate text and targets are allowed");
  const sameTarget=validateSelection(input,select([candidates[0],{...candidates[0],nextStep:"同じ図で発見済みの場所を確認する"}]));
  assert.equal(sameTarget.candidates[0].actionHref,sameTarget.candidates[1].actionHref);
  assert.notEqual(sameTarget.candidates[0].candidateId,sameTarget.candidates[1].candidateId);
  assert.throws(()=>validateSelection(input,select([{...candidates[1],capabilityId:"unavailable-auto-solver"}])),/ACTION_NOT_ALLOWED/);
  assert.throws(()=>validateSelection(input,select([{...candidates[0],targetId:"unavailable"}])),/TARGET_NOT_AVAILABLE/);
  assert.throws(()=>validateSelection({...input,targets:{4:[{id:"bfs-check",href:"https://example.com"}]}},select([candidates[0]])),/UNSAFE/);
  assert.doesNotThrow(()=>validateSelection({...input,actions:[],targets:{}},select([candidates[1]])),"no URLs available still permits a useful method");
  assert.throws(()=>validateAnalysis(input,{...analysis,conceptClaims:[{...analysis.conceptClaims[0],state:"confirmed"}]}),/INVALID_CONCEPT_CLAIM/);
  assert.throws(()=>validateAnalysis(input,{...analysis,conceptClaims:[{...analysis.conceptClaims[0],sourceIds:["invented"]}]}),/INVALID_CONCEPT_EVIDENCE/);
  assert.throws(()=>validateAnalysis(input,{...analysis,currentState:"完全に理解しました"}),/UNSUPPORTED/);
  assert.throws(()=>validateAnalysis(input,{...analysis,currentState:"99問に正答しました"}),/UNSUPPORTED_NUMERIC_CLAIM/);
  assert.throws(()=>validateAnalysis(input,{...analysis,currentState:"理解度は100%です"}),/UNSUPPORTED_LEARNING_JUDGEMENT/);
  const hexad = {questionnaireVersion:"test",scoreRange:[4,28] as [number,number],scores:{Philanthropist:4,Socialiser:8,FreeSpirit:12,Achiever:16,Disruptor:20,Player:24}};
  for (const type of ["UNIT_COMPLETION","ACHIEVEMENT","CREATE_QUEST","INTEGRATION","SHARING"]) {
    const goal={displayText:`目標-${type}`,type,condition:{target:"goal-target"},progress:{outcome:"ONGOING",fraction:null,detail:{}},status:"ACTIVE",confirmedAt:null,daysSinceConfirmed:null};
    const common={...input,bigGoal:goal};
    assert.equal(analysisPrompt(common),analysisPrompt({...common,hexad}));
    assert.ok(selectionPrompt(common,analysis).includes(goal.displayText));
    assert.ok(!analysisPrompt({...common,hexad}).includes('questionnaireVersion'));
  }
  // 全候補に正確なHEXAD記録を要求し、後続候補の改ざんも拒否する。
  const adjusted=candidates.map(c=>({...c,personalizationAdjustment:{scores:Object.entries(hexad.scores).map(([trait,score])=>({trait,score})),interpretation:"関係を考慮",selectionEffect:"順序",goalWording:"目標",stepWording:"手順",reasonWording:"理由",learningBasis:"answer",limitation:"効果は未検証",actionId:c.actionId,targetId:c.targetId}}));
  assert.doesNotThrow(()=>validateSelection({...input,hexad},select(adjusted)));
  assert.throws(()=>validateSelection(input,select(adjusted)),/STANDARD_HEXAD_LEAK/);
  adjusted[2].personalizationAdjustment.scores[0].score++;
  assert.throws(()=>validateSelection({...input,hexad},select(adjusted)),/HEXAD_SCORE_MISMATCH/);
  const reactions = summarizeReaction([
    ...[1,2,3].map(n=>({type:"PRESENTED",data:{candidateId:`candidate-${n}`,order:n}})),
    {type:"VIEWED",data:{candidateId:"candidate-2"}},
    {type:"CLICKED",data:{candidateId:"candidate-2",notSelectedCandidateIds:["candidate-1","candidate-3"],choiceId:"first",selectedAt:"2026-11-11T00:00:00Z",expected:"/two"}},
    {type:"ARRIVED",data:{candidateId:"candidate-2",choiceId:"first",actual:"/two"}},
  ]);
  assert.equal(reactions.judgement,"MATCH");
  assert.deepEqual(reactions.candidates.map(c=>[c.candidateId,c.firstSelected,c.explicitlyNotSelected,c.viewportObserved]),[["candidate-1",false,true,false],["candidate-2",true,false,true],["candidate-3",false,true,false]]);
  console.log("PASS: 1–3 mixed candidates, limits, offline fallback, URL/capability validation, grounded claims, all goal types, HEXAD per candidate");
}
void main().catch(e=>{console.error(e);process.exitCode=1;});
