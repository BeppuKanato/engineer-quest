import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { HEXAD_TYPES, type HexadType } from "../service/feedbackHexadConditions";
import type { ResultRecord as GeneratorRecord } from "./feedbackGenerationBatch";
import {
  classifyPrompt, classificationFingerprint, hash, parseBlindSamples,
  parseClassifierConfig, parseJudgment, runClassificationBatch,
  type Bit, type ClassifierModel, type HexadLabels, type HexadReasons,
} from "./hexadClassifierBatch";
import { analyzeFromDirectories, fleissKappaBinary } from "./hexadClassificationAnalysis";

const full=(entries:Partial<Record<HexadType,Bit>>={}):HexadLabels=>
  Object.fromEntries(HEXAD_TYPES.map(t=>[t,entries[t]??0])) as HexadLabels;
const reasons=():HexadReasons=>
  Object.fromEntries(HEXAD_TYPES.map(t=>[t,"本文の該当表現を確認した／しなかった"])) as HexadReasons;
async function main(){
  const config=parseClassifierConfig(JSON.parse(await readFile(
    join(__dirname,"fixtures/hexad-classifiers.example.json"),"utf8")));
  assert.equal(config.models.length,3);
  assert.equal(config.models[0].model,"qwen3:30b");
  assert.equal(config.models[1].model,"mistral-small3.2");
  assert.equal(config.models[2].model,"phi4");
  const text="目標に向けて実践しましょう。協力して理解を確かめましょう。";
  const samples=parseBlindSamples([
    {sampleId:"s-standard",text:"探索範囲の考え方を確認しましょう。"},
    {sampleId:"s-top1",text:"達成できた点を確認し、次の目標へ進みましょう。"},
    {sampleId:"s-multi",text},
  ]);
  assert.throws(()=>parseBlindSamples([{sampleId:"id",text,condition:"MULTI"}]),/INVALID_BLIND_SAMPLE/);
  assert.throws(()=>parseBlindSamples([samples[0],samples[0]]),/DUPLICATE_BLIND_SAMPLE/);
  assert.throws(()=>parseClassifierConfig({models:[config.models[0],config.models[0]]}),/DUPLICATE_CLASSIFIER_ID/);
  assert.throws(()=>parseClassifierConfig({models:[{...config.models[0],baseURL:"http://api.example.com/v1"}]}),/REMOTE_CLASSIFIER_REQUIRES_HTTPS/);
  assert.throws(()=>parseJudgment({labels:{Achiever:2},reasons:{Achiever:"bad"}}));
  assert.throws(()=>parseJudgment({labels:full(),reasons:{...reasons(),Player:""}}),/CLASSIFIER_INVALID_REASON_Player/);
  assert.deepEqual(parseJudgment({labels:full({Achiever:1}),reasons:reasons()}).labels.Achiever,1);
  assert(classifyPrompt().includes("Achiever")&&classifyPrompt().includes("Disruptor"));
  assert(!classifyPrompt().includes("24"));
  assert.equal(fleissKappaBinary([[1,1,1],[0,0,0]]),1);
  assert.equal(fleissKappaBinary([[0,0,0]]),null);

  const temp=await mkdtemp(join(tmpdir(),"hexad-classify-"));
  try {
    const classified=join(temp,"classified"),generated=join(temp,"generated");
    await mkdir(generated);
    let callCount=0;
    const fakeCall=async(model:ClassifierModel,system:string,user:string)=>{
      callCount++;
      assert(system.includes("HEXAD")&&system.includes("Achiever"));
      assert(!system.includes("TOP_1")&&!system.includes("appliedTypes"));
      assert(samples.some(s=>s.text===user));
      const choices:Partial<Record<HexadType,Bit>>=
        user===samples[0].text ? {} :
          user===samples[1].text ? {Achiever:1} :
            {Achiever:1,Socialiser:model.id==="mistral-small-3.2"?0:1};
      return {output:JSON.stringify({labels:full(choices),reasons:reasons()}),
        responseId:"mock-"+model.id,usage:{completion_tokens:1}};
    };
    const first=await runClassificationBatch(samples,config.models,classified,{limit:2,call:fakeCall});
    assert.equal(first.planned,9);
    assert.equal(first.succeeded,2);
    assert.equal(callCount,2);
    await assert.rejects(runClassificationBatch(samples,config.models,classified,{limit:1,call:fakeCall}),/CLASSIFIER_OUTPUT_DIRECTORY_NOT_EMPTY/);
    await assert.rejects(runClassificationBatch([{...samples[0],text:"改変"},...samples.slice(1)],
      config.models,classified,{resume:true,limit:1,call:fakeCall}),/CLASSIFIER_RESUME_FINGERPRINT_MISMATCH/);
    const continued=await runClassificationBatch(samples,config.models,classified,{resume:true,call:fakeCall});
    assert.equal(continued.previousSuccesses,2);
    assert.equal(continued.succeeded,7);
    assert.equal(callCount,9);
    const noWork=await runClassificationBatch(samples,config.models,classified,{resume:true,call:fakeCall});
    assert.equal(noWork.attempted,0);
    assert.equal(classificationFingerprint(samples,config.models),JSON.parse(
      await readFile(join(classified,"manifest.json"),"utf8")).fingerprint);

    const generations:GeneratorRecord[]=[
      {sampleId:"s-standard",key:"one",caseId:"c1",condition:"STANDARD",
        profileId:"standard",repeatIndex:1,selectedType:null,scores:null,
        promptVersion:"v2",definitionVersion:"v1",model:"fixture",status:"success",
        createdAt:"2026-11-16",calls:[],
        nextGoalText:"探索範囲の考え方を確認しましょう。",feedbackText:"",
        recommendations:[],appliedTypes:[]},
      {sampleId:"s-top1",key:"two",caseId:"c1",condition:"TOP_1",
        profileId:"top1-Achiever",repeatIndex:1,selectedType:"Achiever",scores:null,
        promptVersion:"v2",definitionVersion:"v1",model:"fixture",status:"success",
        createdAt:"2026-11-16",calls:[],
        nextGoalText:"達成できた点を確認し、次の目標へ進みましょう。",feedbackText:"",
        recommendations:[],appliedTypes:["Achiever"]},
      {sampleId:"s-multi",key:"three",caseId:"c1",condition:"MULTI",
        profileId:"pair-achiever-socialiser",repeatIndex:1,selectedType:null,
        scores:{Achiever:24,Philanthropist:12,Socialiser:24,FreeSpirit:12,Player:12,Disruptor:12},
        promptVersion:"v2",definitionVersion:"v1",model:"fixture",status:"success",
        createdAt:"2026-11-16",calls:[],
        nextGoalText:text,feedbackText:"",recommendations:[],appliedTypes:["Achiever","Socialiser"]},
    ];
    await writeFile(join(generated,"results.jsonl"),
      generations.map(x=>JSON.stringify(x)).join("\n")+"\n");
    await writeFile(join(generated,"classifier-input.jsonl"),
      samples.map(x=>JSON.stringify(x)).join("\n")+"\n");
    const report=await analyzeFromDirectories(generated,classified,join(temp,"analysis"));
    assert.equal(report.generatedSuccesses,3);
    assert.equal(report.completeTriads,3);
    assert.equal(report.missingJudgments,0);
    const a=report.multiMetrics.find(x=>x.classifierId==="qwen3-30b"&&
      x.profileId==="ALL"&&x.metric==="all-applied-types-detected");
    const b=report.multiMetrics.find(x=>x.classifierId==="mistral-small-3.2"&&
      x.profileId==="ALL"&&x.metric==="all-applied-types-detected");
    assert.equal(a?.rate,1);
    assert.equal(b?.rate,0);
    assert.equal(report.agreement.find(x=>x.type==="six-label-exact-match")?.exactMatchRate,2/3);
    assert.equal(report.top1Target.find(x=>x.classifierId==="phi-4"&&
      x.type==="Achiever")?.rate,1);
    assert((await readFile(join(temp,"analysis","multi-metrics.csv"),"utf8")).includes("all-applied-types-detected"));
    const broken={...samples[0],text:"different"};
    await writeFile(join(generated,"classifier-input.jsonl"),
      [broken,...samples.slice(1)].map(x=>JSON.stringify(x)).join("\n")+"\n");
    await assert.rejects(analyzeFromDirectories(generated,classified,join(temp,"analysis")),
      /CLASSIFIER_GENERATION_INPUT_MISMATCH/);

    const errorDir=join(temp,"error");
    const bad=await runClassificationBatch(samples,config.models,errorDir,{
      limit:1,call:async()=>({output:{labels:full({Achiever:1}),reasons:{...reasons(),Player:""}}}),
    });
    assert.equal(bad.failed,1);
    const fixed=await runClassificationBatch(samples,config.models,errorDir,
      {resume:true,limit:1,call:fakeCall});
    assert.equal(fixed.succeeded,1);
  } finally {await rm(temp,{recursive:true,force:true});}
  console.log("PASS: blind six-label classification, independent model outputs, resume and descriptive aggregate");
}
void main().catch(e=>{console.error(e);process.exitCode=1;});
