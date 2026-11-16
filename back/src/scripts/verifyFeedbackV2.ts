import assert from "node:assert/strict";
import { resolveHexadCondition, type HexadScores } from "../service/feedbackHexadConditions";
import {
  availableFeedbackCandidates, stage1Prompt, stage2Input, stage2Prompt,
  validateStage1, validateStage2, generateFeedbackV2,
  type FeedbackV2Input, type SupportPlanResult, type ComposedFeedbackResult,
} from "../service/feedbackV2.engine";

const scores: HexadScores = {
  Achiever: 24, Philanthropist: 12, Socialiser: 24,
  FreeSpirit: 12, Player: 12, Disruptor: 12,
};
const base: FeedbackV2Input = {
  learning: { id: "learning-1", answers: [{ id: "answer-1", correct: false, answer: "drop-left" }] },
  state: { history: [] }, bigGoal: null, hexad: null,
  actions: [{ id: 4, label: "復習する", purpose: "比較結果と残す側を確認する", condition: "同一単元", targetIds: ["phase-2"] }],
  targets: { 4: [{ id:"phase-2", href:"/courses/roadmap/u/learn?phase=phase-2",
    name:"動きの説明",learningContent:"比較結果と探索範囲の更新" }] },
  experimentV2: resolveHexadCondition("TOP_1", scores, "Achiever"),
};
const candidates = availableFeedbackCandidates(base);
assert.equal(candidates[0].candidateId, "C1");
assert(candidates.some(x => x.action.kind === "self_action"));
assert(!stage1Prompt(base, candidates).includes("Achiever"), "HEXAD must not reach Stage1");
assert(!stage1Prompt(base, candidates).includes("HEXAD"));

const plan: SupportPlanResult = {
  schemaVersion: "support-plan-v1",
  supportPlan: {
    educationalGoal:"探索範囲の更新を確認する",currentStateSummary:"回答を修正した",
    feedbackLevels:["FP"],feedUp:"次の確認点",feedBack:"回答を修正",feedForward:"図を見直す",
    uncertainty:["誤答原因は未確定"],evidenceIds:["learning-1", "invented-source"],
  },
  approvedCandidates:[{
    candidateId:"C1",educationalReason:"同じ概念を復習",
    evidenceIds:["answer-1"],expectedPractice:"比較したあと残す範囲を説明する",
  }],
};
const checked = validateStage1(base, plan, candidates);
assert.equal(checked.discardedEvidenceIds, 1);
const input = stage2Input(base, checked, candidates);
assert.equal(input.hexadContext?.kind, "single");
assert(stage2Prompt(input).includes("Achiever"));
assert(!stage2Prompt(input).includes("Socialiser\",\"definition"));
const composed: ComposedFeedbackResult = {
  schemaVersion:"feedback-result-v1",
  nextGoalText:"残す側を説明する",
  feedbackText:"比較結果と範囲の関係を整理する",
  recommendations:[{candidateId:"C1",nextStepText:"図の更新を追う",reasonText:"同じ判断を確認する"}],
  hexadAudit:{appliedTypes:["Achiever"],rationale:"達成感のある目標を強調"},
};
assert.equal(validateStage2(input, composed).recommendations[0].candidateId,"C1");
assert.throws(()=>validateStage2(input,{...composed,recommendations:[{...composed.recommendations[0],candidateId:"C999"}]}),/V2_CANDIDATE_NOT_APPROVED/);
assert.throws(()=>validateStage1(base,{...plan,approvedCandidates:[{...plan.approvedCandidates[0],candidateId:"C999"}]},candidates),/V2_CANDIDATE_NOT_AVAILABLE/);
assert.throws(()=>validateStage2(input,{...composed,hexadAudit:{appliedTypes:["Player"],rationale:"誤り"}}),/V2_SINGLE_TYPE_MISMATCH/);

const calls: string[] = [];
const logs: unknown[] = [];
const result = await generateFeedbackV2(base, async (stage,prompt)=>{
  calls.push(stage);
  assert.equal(stage === "support", !prompt.includes("Achiever"));
  return { output: stage==="support" ? plan : composed, responseId:stage, model:"fixture", usage:null };
}, async x=>{ logs.push(x); });
assert.deepEqual(calls,["support","compose"]);
assert.equal(result.selection.nextGoal,composed.nextGoalText);
assert.equal(result.validation.actionHref,"/courses/roadmap/u/learn?phase=phase-2");
assert.deepEqual(result.hexadAudit?.appliedTypes,["Achiever"]);
assert.equal(logs.length,4); // two stages, source ID repair, final validation

const standard: FeedbackV2Input={...base,experimentV2:resolveHexadCondition("STANDARD",null)};
const standardFacts=stage2Input(standard,validateStage1(standard,plan,candidates),candidates);
assert.equal(standardFacts.hexadContext,null);
assert.throws(()=>validateStage2(standardFacts,composed),/V2_STANDARD_HEXAD_LEAK/);

const multi: FeedbackV2Input={...base,experimentV2:resolveHexadCondition("MULTI",scores)};
const multiFacts=stage2Input(multi,validateStage1(multi,plan,candidates),candidates);
assert.equal(multiFacts.hexadContext?.kind,"multi");
assert.equal(validateStage2(multiFacts,{...composed,hexadAudit:{appliedTypes:["Achiever","Socialiser"],rationale:"双方を考慮"}}).hexadAudit?.appliedTypes.length,2);
console.log("PASS: frozen Stage1 contract, HEXAD isolation, short candidate IDs, Stage2 audit and compatibility");
