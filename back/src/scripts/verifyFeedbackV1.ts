import { summarizeReaction } from "../service/feedbackV1.observation";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { analysisPrompt, selectionPrompt, generate, validateSelection, type Input, type Analysis, type Selection, type Call } from "../service/feedbackV1.engine";

async function main() {
  const input: Input = { learning: { answers: [{ id: "answer-1", code: "RAW_CODE_SENTINEL", isCorrect: true }] }, state: { posts: Array.from({ length: 101 }, (_, i) => ({ id: `post-${i}`, body: `body-${i}`, comments: [{ body: `reply-${i}` }] })), history: [{ status: "PRESENTED" }] }, actions: [{ id: 9, label: "復習", purpose: "理解の確認", condition: "獲得済み", targetIds: ["card-1", "card-2"] }], targets: { 9: [{ id: "card-1", href: "/knowledge-cards?cardId=card-1" }, { id: "card-2", href: "/knowledge-cards?cardId=card-2" }] }, hexad: null };
  const analysis: Analysis = { currentState: "テストに合格した", understood: ["基本操作"], needsImprovement: [], uncertain: ["応用の理解は未観測"], evidence: [{ sourceId: "answer-1", fact: "正答した", inference: false }] };
  const selection: Selection = { nextGoal: "操作の理由を説明する", nextStep: "カードで確認する", actionLabel: "カードを開く", actionId: 9, targetId: "card-2", purpose: "理解の確認", reason: "基本操作を根拠とする", personalizationAdjustment: null };
  const personalized: Input = { ...input, hexad: { questionnaireVersion: "hexad-24-ja-v1", scoreRange: [4, 28], scores: { Philanthropist: 20, Socialiser: 8, FreeSpirit: 24, Achiever: 28, Disruptor: 8, Player: 16 } } };
  const adjusted: Selection = { ...selection, personalizationAdjustment: { scores: Object.entries(personalized.hexad!.scores).map(([trait, score]) => ({ trait, score })), interpretation: "6得点を比較", selectionEffect: "学習上同じ行動が妥当", goalWording: "理解の達成を強調", stepWording: "自力確認を強調", reasonWording: "理由を明示", learningBasis: "answer-1", limitation: "効果の客観的証明ではない", actionId: 9, targetId: "card-2" } };
  assert.equal(analysisPrompt(input), analysisPrompt(personalized));
  assert(!analysisPrompt(personalized).includes("Achiever"));
  assert(!analysisPrompt(input).includes("post-100"));
  assert(selectionPrompt(input, analysis).includes("reply-100"));
  assert(!selectionPrompt(input, analysis).includes("RAW_CODE_SENTINEL"));
  assert(!selectionPrompt(input, analysis).includes("hexad-24-ja-v1"));
  assert(selectionPrompt(personalized, analysis).includes("hexad-24-ja-v1"));
  for (const [context, output] of [[input, selection], [personalized, adjusted]] as const) {
    const calls: string[] = []; const saved: unknown[] = [];
    const call: Call = async (stage, prompt, hasHexad) => { calls.push(stage); assert.equal(hasHexad, stage === "selection" && !!context.hexad); return { output: stage === "analysis" ? analysis : output, model: "test-model", responseId: stage, usage: { input_tokens: prompt.length, output_tokens: 100 } }; };
    const result = await generate(context, call, async entry => { saved.push(entry); });
    assert.deepEqual(calls, ["analysis", "selection"]);
    assert.equal(result.validation.actionHref, "/knowledge-cards?cardId=card-2");
    assert.equal(saved.length, 3);
    assert.equal(result.selection.personalizationAdjustment === null, !context.hexad);
  }
  assert.throws(() => validateSelection(input, { ...selection, actionId: 22 }), /ACTION_NOT_ALLOWED/);
  assert.throws(() => validateSelection(input, { ...selection, targetId: "unowned-card" }), /TARGET_NOT_AVAILABLE/);
  assert.throws(() => validateSelection(input, adjusted), /STANDARD_HEXAD_LEAK/);
  assert.throws(() => validateSelection(personalized, selection), /HEXAD_SELECTION_MISMATCH/);
  const tampered = structuredClone(adjusted); tampered.personalizationAdjustment!.scores[0].score++;
  assert.throws(() => validateSelection(personalized, tampered), /HEXAD_SCORE_MISMATCH/);
  const mismatch = structuredClone(adjusted); mismatch.personalizationAdjustment!.targetId = "card-1";
  assert.throws(() => validateSelection(personalized, mismatch), /HEXAD_SELECTION_MISMATCH/);
  const failures: unknown[] = [];
  await assert.rejects(generate(input, async () => { throw new Error("MODEL_DOWN"); }, async entry => { failures.push(entry); }), /MODEL_DOWN/);
  assert.equal(failures.length, 1);
  for (const route of ["knowledge-cards", "courses/roadmap/[courseId]", "quest-board/[postId]", "mission/[missionId]/play", "create/quests/[questId]/work", "history", "achievements", "profile"]) assert(existsSync(`../front/src/app/${route}/page.tsx`), route);
  await assert.rejects(generate(input, async () => ({ output: { ...analysis, evidence: [{ sourceId: "invented", fact: "fact", inference: false }] }, model: "test", responseId: "test", usage: null })), /UNKNOWN_EVIDENCE_SOURCE/);
  const choice = { type: "NAVIGATION_SELECTED", data: { choiceId: "first", selectedAt: "2026-11-03T01:00:00Z", expected: "/knowledge-cards?cardId=one" } };
  const arrival = { type: "ARRIVED", data: { choiceId: "first", actual: "/knowledge-cards?cardId=one" } };
  assert.equal(summarizeReaction([choice, arrival]).judgement, "MATCH");
  assert.equal(summarizeReaction([choice, { ...arrival, data: { ...arrival.data, actual: "/history" } }]).judgement, "MISMATCH");
  assert.equal(summarizeReaction([choice]).judgement, "PENDING");
  assert.equal(summarizeReaction([choice, { type: "ARRIVED", data: { choiceId: "later", actual: choice.data.expected } }]).judgement, "PENDING");
  assert.equal(summarizeReaction([{ type: "PRESENTED", data: {} }, { type: "PRESENTED", data: {} }]).presented, true);
  assert.equal(summarizeReaction([choice, { ...arrival, data: { ...arrival.data, actual: "/knowledge-cards" } }]).judgement, "MISMATCH");
  console.log("PASS: STANDARD/PERSONALIZED inputs, sequential stages, audit logs, full board data, HEXAD validation, invalid targets, model failures and destination routes");
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
