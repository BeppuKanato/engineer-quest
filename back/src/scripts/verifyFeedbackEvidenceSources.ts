import assert from "node:assert/strict";
import fixtures from "./fixtures/feedbackEvidence.json";
import { buildEvidenceSources, prepareEvidenceInput } from "../service/feedbackV1.evidence";
import { analysisPrompt, generate, validateAnalysis, type Analysis, type Input, type Call } from "../service/feedbackV1.engine";

const base: Input = { learning: {}, bigGoal: null, state: {}, actions: [], targets: {}, hexad: null };
const selection = { nextGoal: "手順を確かめる", candidates: [{ nextStep: "手順を頭の中で追う", actionLabel: "手順を確認", actionId: null, targetId: null, capabilityId: "mental-rehearsal", purpose: "確認", reason: "記録を振り返る", personalizationAdjustment: null }] };
const payload = (input: Input) => JSON.parse(analysisPrompt(input).split("\n").at(-1)!);

async function main() {
  for (const fixture of fixtures) {
    const saved = { ...base, ...fixture.input } as Input;
    const original = structuredClone(saved);
    const input = prepareEvidenceInput(saved);
    assert.deepEqual(saved, original, "legacy input remains immutable");
    assert.deepEqual(prepareEvidenceInput(input), input, "hydration is idempotent");
    const jsonbInput = { ...input, evidenceSources: input.evidenceSources.map(e => ({ kind: e.kind, path: e.path, sourceId: e.sourceId })) };
    assert.deepEqual(prepareEvidenceInput(jsonbInput), input, "JSONB object key order does not change the registry");
    assert.deepEqual(payload(input).evidenceSources, input.evidenceSources);
    const analysis = structuredClone(fixture.analysis) as Analysis;
    if (fixture.case === "binary-search-check") {
      assert.throws(() => validateAnalysis(input, analysis), /UNKNOWN_EVIDENCE_SOURCE/, "bare bigGoal is still rejected");
      analysis.evidence = analysis.evidence.map(e => e.sourceId === "bigGoal" ? { ...e, sourceId: input.bigGoal!.sourceId! } : e);
      assert.equal(input.bigGoal!.sourceId, "feedback:big-goal");
      const current = prepareEvidenceInput({ ...saved, bigGoal: { ...saved.bigGoal!, sourceId: "goal:owned-goal" } });
      assert.ok(current.evidenceSources.some(e => e.sourceId === "goal:owned-goal" && e.path === "bigGoal"));
      validateAnalysis(current, { ...analysis, evidence: analysis.evidence.map(e => e.sourceId === "feedback:big-goal" ? { ...e, sourceId: "goal:owned-goal" } : e) });
    } else {
      for (const id of ["cmwem5uih0072oucncxzt34nq", "cmwem8for008coucne8xnhgqx", "cmwem8for008doucnpt7olzn5"]) {
        assert.ok(input.evidenceSources.some(e => e.sourceId === id && e.kind === "implementation"));
      }
    }
    validateAnalysis(input, analysis);
    const calls: string[] = [], logs: unknown[] = [];
    const call: Call = async (stage, prompt, personalized) => {
      calls.push(stage);
      assert.equal(personalized, false);
      if (stage === "analysis") assert.deepEqual(JSON.parse(prompt.split("\n").at(-1)!).evidenceSources, input.evidenceSources);
      return { output: stage === "analysis" ? analysis : selection, model: "fixture", responseId: stage, usage: null };
    };
    await generate(saved, call, async entry => { logs.push(entry); });
    assert.deepEqual(calls, ["analysis", "selection"]);
    assert.equal(logs.length, 3);
    // No state, metadata, payload, summary or requirement label can grant citation access.
    const poisoned: Input = { ...saved, state: { id: "other-learner" }, learning: { ...fixture.input.learning, payload: { sourceId: "payload-id" }, summary: { id: "summary-id" }, arbitraryId: "metadata-id" } };
    for (const id of ["forged", "other-learner", "payload-id", "summary-id", "metadata-id", "unit", "bigGoal"]) {
      const invalid = { ...analysis, evidence: [{ sourceId: id, fact: "記録", inference: false }] };
      assert.throws(() => validateAnalysis(poisoned, invalid), /UNKNOWN_EVIDENCE_SOURCE/);
      let selections = 0;
      const failureLogs: unknown[] = [];
      await assert.rejects(generate(poisoned, async stage => {
        if (stage === "selection") selections++;
        return { output: invalid, model: "fixture", responseId: stage, usage: null };
      }, async entry => { failureLogs.push(entry); }), /UNKNOWN_EVIDENCE_SOURCE/);
      assert.equal(selections, 0);
      assert.ok(JSON.stringify(failureLogs).includes("UNKNOWN_EVIDENCE_SOURCE"));
    }
    assert.throws(() => prepareEvidenceInput({ ...input, evidenceSources: [...input.evidenceSources, { sourceId: "forged", kind: "learning", path: "state" }] }), /INVALID_EVIDENCE_SOURCES/);
    const wrongClaim = structuredClone(analysis);
    wrongClaim.conceptClaims[0].sourceIds = [input.bigGoal!.sourceId!];
    assert.throws(() => validateAnalysis(input, wrongClaim), /INVALID_CONCEPT_EVIDENCE/);
    const unknownClaim = structuredClone(analysis);
    unknownClaim.conceptClaims[0].sourceIds = ["other-learner"];
    assert.throws(() => validateAnalysis(input, unknownClaim), /INVALID_CONCEPT_EVIDENCE/);
  }
  assert.deepEqual(buildEvidenceSources(base), []);
  const create: Input = { ...base, learning: { tests: [{ id: "test", results: [{ id: "not-a-source" }] }], submissions: [{ id: "submission", code: '{"id":"forged"}' }], hints: [{ id: "hint" }] } };
  assert.deepEqual(buildEvidenceSources(create).map(e => e.sourceId), ["test", "hint", "submission"]);
  console.log("PASS: saved P3/unit failure replay, goal references, implementation/assessment IDs, strict rejection, audit logs, two stages and legacy snapshots");
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
