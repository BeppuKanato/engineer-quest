import assert from "node:assert/strict";
import { zodTextFormat } from "openai/helpers/zod";
import type { ZodTypeAny } from "zod";
import fixture from "./fixtures/feedbackImplementationClaim.json";
import { aggregateConcepts, conceptDefinitions } from "../service/feedbackConcepts";
import { analysisSchema, analysisGenerationSchema, analysisPrompt, claimableConcepts, generate, validateAnalysis, type Analysis, type Input, type Call } from "../service/feedbackV1.engine";
import { prepareEvidenceInput } from "../service/feedbackV1.evidence";

const base: Input = { learning: {}, bigGoal: null, state: {}, actions: [], targets: {}, hexad: null };
const selection = { nextGoal: "手順を確かめる", candidates: [{ nextStep: "手順を頭の中で追う", actionLabel: "手順を確認", actionId: null, targetId: null, capabilityId: "mental-rehearsal", purpose: "確認", reason: "記録を振り返る", personalizationAdjustment: null }] };
const toFormat = zodTextFormat as unknown as (schema: ZodTypeAny, name: string) => { strict: boolean; schema: Record<string, unknown> };

async function main() {
  const input = prepareEvidenceInput({ ...base, ...fixture.input } as Input);
  const original = structuredClone(fixture.analysis) as Analysis;
  const rawCopy = structuredClone(original);
  assert.doesNotThrow(() => analysisSchema.parse(original), "stored-result schema stays backward compatible");
  assert.throws(() => validateAnalysis(input, original), /INVALID_CONCEPT_CLAIM/);
  const registry = new Set(input.evidenceSources.map(e => e.sourceId));
  assert.ok(original.evidence.every(e => registry.has(e.sourceId)), "original failure was not an unknown evidence ID");
  const schema = analysisGenerationSchema(input);
  assert.equal(schema.safeParse(original).success, false, "the actual response format excludes the implementation claim");
  const eligible = claimableConcepts(input);
  assert.equal(eligible.length, 5);
  assert.ok(eligible.every(c => c.conceptId !== "binary-search:implementation"));
  const corrected = { ...original, conceptClaims: original.conceptClaims.filter(c => c.conceptId !== "binary-search:implementation") };
  assert.doesNotThrow(() => schema.parse(corrected));
  validateAnalysis(input, corrected);
  // Implementation facts and their source IDs remain available in evidence/text.
  assert.ok(corrected.evidence.some(e => e.sourceId === "cmweobgpm0074jnbhdd5tdikp"));
  const payload = JSON.parse(analysisPrompt(input).split("\n").at(-1)!);
  assert.deepEqual(payload.claimableConcepts, eligible);
  assert.deepEqual(payload.learning, input.learning);
  const wrongState = structuredClone(corrected);
  wrongState.conceptClaims[0].state = "needs_check";
  assert.equal(schema.safeParse(wrongState).success, false);
  assert.throws(() => validateAnalysis(input, wrongState), /INVALID_CONCEPT_CLAIM/);
  const wrongEvidence = structuredClone(corrected);
  wrongEvidence.conceptClaims[0].sourceIds = ["cmweobgpm0074jnbhdd5tdikp"];
  assert.equal(schema.safeParse(wrongEvidence).success, false);
  assert.throws(() => validateAnalysis(input, wrongEvidence), /INVALID_CONCEPT_EVIDENCE/);
  for (const sourceId of ["forged", "goal:other-learner"]) {
    assert.throws(() => validateAnalysis(input, { ...corrected, evidence: [{ sourceId, fact: "記録", inference: false }] }), /UNKNOWN_EVIDENCE_SOURCE/);
  }
  const calls: string[] = [], logs: { stage?: string; output?: unknown }[] = [];
  const call: Call = async (stage, prompt, personalized, generationSchema) => {
    calls.push(stage);
    assert.equal(personalized, false);
    if (stage === "analysis") {
      assert.ok(generationSchema, "generate passes the constrained schema to the real SDK caller");
      assert.equal(generationSchema.safeParse(original).success, false);
      generationSchema.parse(corrected);
      assert.deepEqual(JSON.parse(prompt.split("\n").at(-1)!).claimableConcepts, eligible);
    }
    return { output: stage === "analysis" ? corrected : selection, model: "fixture", responseId: stage, usage: null };
  };
  const result = await generate(input, call, async entry => { logs.push(entry as typeof logs[number]); });
  assert.deepEqual(calls, ["analysis", "selection"]);
  assert.equal(result.validation.valid, true);
  assert.deepEqual(logs.find(l => l.stage === "analysis")?.output, corrected);
  assert.deepEqual(original, rawCopy, "failure audit output is not silently filtered or changed");
  let selectionCalls = 0;
  await assert.rejects(generate(input, async stage => {
    if (stage === "selection") selectionCalls++;
    return { output: original, model: "fixture", responseId: stage, usage: null };
  }), /INVALID_CONCEPT_CLAIM/);
  assert.equal(selectionCalls, 0, "runtime validation still rejects unconstrained/custom model output");

  // Zero, single, and multiple eligible variants must all serialize through the SDK.
  for (const unit of conceptDefinitions) {
    const emptySnapshot = aggregateConcepts(unit.courseId, [], [], "snapshot")!;
    const unobserved = { ...base, learning: { conceptSnapshot: emptySnapshot } };
    const zero = analysisGenerationSchema(unobserved);
    assert.deepEqual(claimableConcepts(unobserved), []);
    assert.equal(zero.safeParse(corrected).success, false);
    assert.equal(zero.safeParse({ ...corrected, conceptClaims: [] }).success, true);
    // Also exercise one eligible assessment with implementation present in all seven units.
    const singleSnapshot = structuredClone(emptySnapshot);
    const concept = singleSnapshot.concepts.find(c => c.kind === "assessment")!;
    concept.attemptedQuestions = 1; concept.state = "needs_check";
    concept.evidence[0].first = { sourceId: "answer", sessionId: "session", startedAt: 1, number: 1, correct: false, confirmed: true, recordedAt: 1, observedAt: 1 };
    concept.evidence[0].latest = concept.evidence[0].first;
    const singleInput = { ...base, learning: { conceptSnapshot: singleSnapshot } };
    const one = analysisGenerationSchema(singleInput);
    assert.equal(claimableConcepts(singleInput).length, 1);
    assert.equal(one.safeParse({ ...corrected, conceptClaims: [{ conceptId: concept.conceptId, state: "needs_check", sourceIds: ["answer"], observation: "誤答を記録" }] }).success, true);
    for (const candidate of [zero, one, schema, analysisGenerationSchema(base)]) {
      const format = toFormat(candidate, "analysis");
      assert.equal(format.strict, true);
      assert.ok(format.schema);
    }
  }
  const personalized = { ...input, hexad: { questionnaireVersion: "test", scoreRange: [4, 28] as [number, number], scores: { Philanthropist: 4, Socialiser: 8, FreeSpirit: 12, Achiever: 16, Disruptor: 20, Player: 24 } } };
  assert.equal(analysisPrompt(input), analysisPrompt(personalized));
  assert.deepEqual(toFormat(schema, "analysis").schema, toFormat(analysisGenerationSchema(personalized), "analysis").schema);
  console.log("PASS: saved unit failure, assessment-only response schema/prompt, implementation evidence preserved, strict validation, all seven units, zero/single/multiple concepts and HEXAD parity");
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
