import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseCases, parseProfiles, planJobs, runBatch, snapshotForJob,
  type ResultRecord, type BatchSettings } from "./feedbackGenerationBatch";
import { HEXAD_TYPES } from "../service/feedbackHexadConditions";
import type { V2LlmCall } from "../service/feedbackV2.engine";

async function main() {
  const cases = parseCases(JSON.parse(await readFile(join(__dirname, "fixtures/feedback-generation-cases.example.json"), "utf8")));
  const profiles = parseProfiles(JSON.parse(await readFile(join(__dirname, "fixtures/feedback-generation-profiles.example.json"), "utf8")));
  const settings: BatchSettings = {
    cases, profiles, repeat: 2, conditions: ["STANDARD", "TOP_1", "MULTI"],
    model: "test-fixture-model",
  };
  const jobs = planJobs(settings);
  assert.equal(jobs.length, 34, "1 case × (1 STANDARD + 6 TOP1 + 10 MULTI) × 2");
  assert.equal(jobs.filter(j => j.condition === "TOP_1").length, 12);
  assert.equal(jobs.filter(j => j.condition === "MULTI").length, 20);
  assert.equal(new Set(jobs.map(j => j.sampleId)).size, jobs.length);
  const firstTop = jobs.find(j => j.condition === "TOP_1");
  assert(firstTop);
  const promptContext = snapshotForJob(cases[0].input, firstTop).experimentV2.promptContext;
  assert.equal(promptContext?.kind, "single");
  assert(!JSON.stringify(promptContext).includes("24"));
  assert.throws(() => parseCases([cases[0], cases[0]]), /DUPLICATE_CASE_ID/);
  assert.throws(() => parseProfiles({multi:[{id:"bad",scores: { Achiever: 29 }}]}), /INVALID_HEXAD_SCORES/);

  let supportCalls = 0, composeCalls = 0;
  const mock: V2LlmCall = async (stage, prompt) => {
    if (stage === "support") {
      supportCalls++;
      assert(!prompt.includes("HEXAD"));
      return { model: "test-fixture", responseId: "support-" + supportCalls, usage: { input_tokens: 12 },
        output: {
          schemaVersion: "support-plan-v1",
          supportPlan: {
            educationalGoal:"探索範囲を確認する",currentStateSummary:"回答を修正した",
            feedbackLevels:["FP"],feedUp:null,feedBack:"再回答があった",feedForward:"図を確認する",
            uncertainty:[],evidenceIds:[],
          },
          approvedCandidates:[{candidateId:"C1",educationalReason:"同一単元の復習",
            evidenceIds:[],expectedPractice:"比較結果を説明する"}],
        },
      };
    }
    composeCalls++;
    const details = JSON.parse(prompt.slice(prompt.lastIndexOf("\n") + 1)) as {
      hexadContext: null | {kind:"single";type:string} | {kind:"multi";scores:unknown};
      approvedCandidates: Array<{candidateId:string}>;
    };
    const appliedTypes = details.hexadContext?.kind === "single"
      ? [details.hexadContext.type]
      : details.hexadContext?.kind === "multi" ? [HEXAD_TYPES[0], HEXAD_TYPES[2]] : [];
    return { model:"test-fixture",responseId:"compose-"+composeCalls,usage:{output_tokens:15},
      output:{
        schemaVersion:"feedback-result-v1",nextGoalText:"比較して残す範囲を確かめる",
        feedbackText:"探索範囲を更新する手順を振り返る",
        recommendations:[{candidateId:details.approvedCandidates[0].candidateId,
          nextStepText:"図で残す範囲を追う",reasonText:"同じ判断をもう一度確認できる"}],
        hexadAudit:details.hexadContext
          ? {appliedTypes,rationale:"テスト用の選択"} : null,
      },
    };
  };
  const directory = await mkdtemp(join(tmpdir(), "feedback-generation-cli-"));
  try {
    const out = join(directory, "results");
    const part = await runBatch(settings, out, { limit: 5, call: mock });
    assert.equal(part.succeeded, 5);
    assert.equal(part.stage1Calls, 1);
    assert.equal(part.stage2Calls, 5);
    assert.equal(supportCalls, 1);
    await assert.rejects(runBatch(settings, out, { limit: 1, call: mock }), /OUTPUT_DIRECTORY_NOT_EMPTY/);
    await assert.rejects(runBatch({ ...settings, repeat: 3 }, out, { resume: true, limit: 1, call: mock }),
      /RESUME_FINGERPRINT_MISMATCH/);

    const resumed = await runBatch(settings, out, { resume: true, limit: 3, call: mock });
    assert.equal(resumed.previousSuccesses, 5);
    assert.equal(resumed.stage1Calls, 0);
    assert.equal(resumed.succeeded, 3);
    assert.equal(supportCalls, 1);
    const full = await runBatch(settings, out, { resume: true, call: mock });
    assert.equal(full.succeeded, 26);
    assert.equal(full.stage1Calls, 0);
    assert.equal(supportCalls, 1);
    assert.equal(composeCalls, 34);

    const results = (await readFile(join(out,"results.jsonl"),"utf8")).trim().split("\n")
      .map(line=>JSON.parse(line) as ResultRecord);
    assert.equal(results.length, 34);
    assert(results.every(result => result.status === "success"));
    const blind = (await readFile(join(out,"classifier-input.jsonl"),"utf8")).trim().split("\n")
      .map(line=>JSON.parse(line) as Record<string,unknown>);
    assert.equal(blind.length, 34);
    assert(blind.every(row=>Object.keys(row).sort().join(",") === "sampleId,text"),
      "Classifier input must exclude condition, HEXAD scores, and generator's appliedTypes");
    assert(!JSON.stringify(blind).includes("test-fixture-model"));
    assert.equal((await readFile(join(out,"stage1.jsonl"),"utf8")).trim().split("\n").length,1);

    // A failed Stage2 must NOT erase the already validated Stage1 plan.
    const errorOut = join(directory,"failure-resume");
    const failCompose: V2LlmCall = async (stage, prompt, schema) => {
      if (stage === "compose") throw new Error("TEST_COMPOSE_TIMEOUT");
      return mock(stage,prompt,schema);
    };
    const failed = await runBatch(settings, errorOut, {limit:1,call:failCompose});
    assert.equal(failed.failed,1);
    assert.equal(failed.stage1Calls,1);
    const before = supportCalls;
    const repaired = await runBatch(settings, errorOut, {resume:true,limit:1,call:mock});
    assert.equal(repaired.succeeded,1);
    assert.equal(repaired.stage1Calls,0);
    assert.equal(supportCalls,before);
    assert.equal((await readFile(join(errorOut,"classifier-input.jsonl"),"utf8")).trim().split("\n").length,1);
  } finally {
    await rm(directory,{recursive:true,force:true});
  }
  console.log("PASS: 3-arm batch counts, frozen Stage1, resume and blind classifier export");
}
void main().catch(error=>{console.error(error);process.exitCode=1;});
