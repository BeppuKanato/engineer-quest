import assert from "node:assert/strict";
import { resolveHexadCondition, type HexadScores } from "../service/feedbackHexadConditions";
import {
  availableFeedbackCandidates, stage1Prompt, stage2Input, stage2Prompt,
  validateStage1, validateStage2, generateFeedbackV2, supportPlanSchema, FEEDBACK_V2_PROMPT_VERSION,
  type FeedbackV2Input, type SupportPlanResult, type ComposedFeedbackResult,
} from "../service/feedbackV2.engine";

async function main() {
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
assert.equal(FEEDBACK_V2_PROMPT_VERSION, "feedback-four-arm-two-stage-2026-11-18-v5");
assert(stage1Prompt(base, candidates).includes("【学習状況の分析】"));
assert(stage1Prompt(base, candidates).includes("【チューターへの引き継ぎ】"));

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
// Recommendation-reaction history is intentionally excluded from both
// generation stages, while learning-answer history remains available.
const priorRecommendation = "RECOMMENDATION_REACTION_PRIVATE_MARKER";
const withReactions: FeedbackV2Input = {
  ...base,
  state: { history: [{ actionId: 4, interaction: "IGNORED", note: priorRecommendation }] },
};
const isolatedStage1 = stage1Prompt(withReactions, availableFeedbackCandidates(withReactions));
const isolatedStage2 = stage2Input(withReactions, checked, candidates);
assert(!isolatedStage1.includes(priorRecommendation));
assert(!JSON.stringify(isolatedStage2).includes(priorRecommendation));
assert(!stage2Prompt(isolatedStage2).includes(priorRecommendation));
assert(!Object.prototype.hasOwnProperty.call(isolatedStage2.appContext, "reactionSummary"));

// The same assessment event may contain multiple questions. Stage2 must
// receive each question's full attempt history even if only one source ID was
// selected in the support plan.
const withQuestionHistory: FeedbackV2Input = {
  ...base,
  learning: {
    ...base.learning as object,
    currentPhase: { id: "phase-3" },
    conceptSnapshot: {
      concepts: [{ kind: "assessment", conceptId: "binary-search:range", label: "探索範囲",
        evidence: [
          { phaseKey: "phase-3", assessmentId: "check", questionId: "q1",
            questionLabel: "比較結果", attempts: [{number:1,correct:true,answer:{kind:"choice",choiceId:"correct"},sessionId:"S"}] },
          { phaseKey: "phase-3", assessmentId: "check", questionId: "q2",
            questionLabel: "残す範囲", attempts: [
              {number:1,correct:false,answer:{kind:"choice",choiceId:"drop-left"},sessionId:"S"},
              {number:2,correct:true,answer:{kind:"choice",choiceId:"drop-right"},sessionId:"S"},
            ] },
        ] }],
    },
  },
};
const hydrated = stage2Input(withQuestionHistory, validateStage1(withQuestionHistory, plan, availableFeedbackCandidates(withQuestionHistory)), availableFeedbackCandidates(withQuestionHistory));
assert.equal(hydrated.contextFacts.filter(x=>x.sourceId.startsWith("question-history-")).length, 2);
assert(hydrated.contextFacts.some(x=>x.statement.includes("drop-left") && x.statement.includes("drop-right")));

assert(stage2Prompt(input).includes("Achiever"));
assert(stage2Prompt(input).includes("【学習者への伝え方】"));
assert(stage2Prompt(input).includes("与えられたHEXAD特性に基づく動機づけの傾向"));
assert(stage2Prompt(input).includes("新しい機能・報酬・他者の存在を作らない"));
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
assert.equal(logs.length,5); // two stages, validated support plan, source ID repair, final validation
const validatedLog = logs.find(x => (x as {stage?:string}).stage === "support-plan-validated") as { plan: unknown } | undefined;
assert(validatedLog, "only validated stage-1 output should be frozen");
const frozen = supportPlanSchema.parse(validatedLog.plan);
const retryStages: string[] = [];
const retried = await generateFeedbackV2(base, async (stage) => {
  retryStages.push(stage);
  if (stage !== "compose") throw new Error("Stage1 must never be regenerated after a validated plan");
  return { output: composed, responseId: "reused", model: "fixture", usage: null };
}, async () => {}, frozen);
assert.deepEqual(retryStages, ["compose"]);
assert.equal(retried.selection.nextGoal, composed.nextGoalText);
assert.equal(retried.supportPlan.supportPlan.educationalGoal, frozen.supportPlan.educationalGoal);
// Invalid historical data cannot override the current support/candidate schemas.
await assert.rejects(
  () => generateFeedbackV2(base, async () => { throw new Error("model must not be called"); },
    async () => {}, { ...frozen, approvedCandidates: [{ ...frozen.approvedCandidates[0], candidateId: "C999" }] }),
  /V2_CANDIDATE_NOT_AVAILABLE/,
);

const standard: FeedbackV2Input={...base,experimentV2:resolveHexadCondition("STANDARD",null)};
const standardFacts=stage2Input(standard,validateStage1(standard,plan,candidates),candidates);
assert.equal(standardFacts.hexadContext,null);
assert(stage2Prompt(standardFacts).includes("【学習者への伝え方】"));
assert(!stage2Prompt(standardFacts).includes("与えられたHEXAD特性に基づく動機づけの傾向"));
assert(stage2Prompt(standardFacts).includes("hexadAuditはnullとする。"));
assert.throws(()=>validateStage2(standardFacts,composed),/V2_STANDARD_HEXAD_LEAK/);

const multi: FeedbackV2Input={...base,experimentV2:resolveHexadCondition("MULTI",scores)};
const multiFacts=stage2Input(multi,validateStage1(multi,plan,candidates),candidates);
assert.equal(multiFacts.hexadContext?.kind,"multi");
assert.equal(validateStage2(multiFacts,{...composed,hexadAudit:{appliedTypes:["Achiever","Socialiser"],rationale:"双方を考慮"}}).hexadAudit?.appliedTypes.length,2);
console.log("PASS: frozen Stage1 contract, HEXAD isolation, short candidate IDs, Stage2 audit and compatibility");

}
void main().catch(error => { console.error(error); process.exitCode = 1; });
