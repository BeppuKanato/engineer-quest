/**
 * Descriptive summaries for offline HEXAD binary multi-label classification.
 * No inference that model judgments are gold labels or independent participants.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { HEXAD_TYPES, type HexadType } from "../service/feedbackHexadConditions";
import { classificationFingerprint, hash, parseBlindSamples, parseClassifierConfig,
  parseJudgment, type BlindSample, type ClassificationResult,
  type ClassifierModel, type HexadLabels } from "./hexadClassifierBatch";
import type { ResultRecord as GenerationRecord } from "./feedbackGenerationBatch";

type Rate = { numerator: number; denominator: number; rate: number | null };
type NamedRate = Rate & { metric: string; classifierId?: string;
  condition?: string; profileId?: string; type?: HexadType };
export type Agreement = {
  type: HexadType | "six-label-exact-match";
  evaluatedSamples: number; agreementCount: number; exactMatchRate: number | null;
  fleissKappa: number | null;
};
export type Analysis = {
  schemaVersion: string; classifiedModels: string[];
  generatedSuccesses: number; completeTriads: number; missingJudgments: number;
  perType: NamedRate[]; top1Target: NamedRate[];
  multiMetrics: NamedRate[]; agreement: Agreement[];
};
const rate = (n: number, d: number): Rate => ({
  numerator:n,denominator:d,rate:d ? n/d : null,
});
export function fleissKappaBinary(rows: Array<readonly [0|1,0|1,0|1]>): number|null {
  if (!rows.length) return null;
  const pi=rows.map(bits=>{
    const ones=bits.reduce<number>((sum,b)=>sum+b,0),zeros=3-ones;
    return (ones*(ones-1)+zeros*(zeros-1))/(3*2);
  });
  const observed=pi.reduce((a,b)=>a+b,0)/pi.length;
  const positives=rows.reduce((sum,bits)=>sum+bits.reduce<number>((a,b)=>a+b,0),0);
  const p1=positives/(3*rows.length),p0=1-p1;
  const expected=p0*p0+p1*p1;
  // Always-one or always-zero: kappa is undefined, not perfect accuracy.
  if(Math.abs(1-expected)<1e-12)return null;
  return (observed-expected)/(1-expected);
}
function allTypes(value: unknown): value is HexadType[] {
  return Array.isArray(value)&&new Set(value).size===value.length&&
    value.every(x=>typeof x==="string"&&(HEXAD_TYPES as readonly string[]).includes(x));
}
export function computeAnalysis(
  generation: GenerationRecord[], classified: ClassificationResult[],
  models: ClassifierModel[],
): Analysis {
  const generated = new Map<string,GenerationRecord>();
  for(const entry of generation){
    if(entry.status!=="success")continue;
    if(!entry.sampleId||!["STANDARD","TOP_1","MULTI"].includes(entry.condition))throw new Error("INVALID_GENERATION_RECORD");
    if(entry.condition!=="STANDARD"&&!allTypes(entry.appliedTypes))throw new Error("MISSING_OR_INVALID_GENERATOR_APPLIED_TYPES");
    if(generated.has(entry.sampleId)){
      const old=generated.get(entry.sampleId);
      if(old?.key!==entry.key)throw new Error("DUPLICATE_GENERATION_SAMPLE");
    }
    generated.set(entry.sampleId,entry);
  }
  const modelIds=models.map(m=>m.id);
  if(new Set(modelIds).size!==modelIds.length)throw new Error("DUPLICATE_MODEL_IDS");
  const bySample=new Map<string,Map<string,HexadLabels>>();
  for(const entry of classified){
    if(entry.status!=="success")continue;
    if(!modelIds.includes(entry.classifierId))throw new Error("UNEXPECTED_CLASSIFIER_ID");
    if(!generated.has(entry.sampleId))throw new Error("CLASSIFICATION_SAMPLE_NOT_GENERATED");
    if(!entry.labels||!entry.reasons)throw new Error("CLASSIFICATION_MISSING_LABELS");
    const judged=parseJudgment({labels:entry.labels,reasons:entry.reasons});
    const model=bySample.get(entry.sampleId)??new Map<string,HexadLabels>();
    if(model.has(entry.classifierId)){
      const previous=model.get(entry.classifierId);
      if(JSON.stringify(previous)!==JSON.stringify(judged.labels))throw new Error("CONFLICTING_CLASSIFIER_SUCCESS");
    }else model.set(entry.classifierId,judged.labels);
    bySample.set(entry.sampleId,model);
  }
  const rows=[...generated.values()];
  const perType: NamedRate[]=[];
  const top1Target: NamedRate[]=[];
  const multiMetrics: NamedRate[]=[];
  const conditions=["STANDARD","TOP_1","MULTI"] as const;
  for(const m of models){
    for(const condition of conditions){
      const population=rows.filter(x=>x.condition===condition);
      const judged=population.filter(x=>bySample.get(x.sampleId)?.has(m.id));
      for(const type of HEXAD_TYPES){
        const positive=judged.filter(x=>bySample.get(x.sampleId)?.get(m.id)?.[type]===1).length;
        perType.push({metric:"type-detection",classifierId:m.id,condition,type,
          ...rate(positive,judged.length)});
      }
    }
    for(const type of HEXAD_TYPES){
      const relevant=rows.filter(x=>x.condition==="TOP_1"&&x.selectedType===type)
        .filter(x=>bySample.get(x.sampleId)?.has(m.id));
      const positive=relevant.filter(x=>bySample.get(x.sampleId)?.get(m.id)?.[type]===1).length;
      top1Target.push({metric:"designated-type-detection",classifierId:m.id,type,
        ...rate(positive,relevant.length)});
    }
    const allMulti=rows.filter(x=>x.condition==="MULTI");
    const groups=["ALL",...new Set(allMulti.map(x=>x.profileId))];
    for(const profileId of groups){
      const population=profileId==="ALL"?allMulti:allMulti.filter(x=>x.profileId===profileId);
      const adopted=population.filter(x=>x.appliedTypes&&x.appliedTypes.length>=2);
      const below=population.filter(x=>x.appliedTypes?.some(type=>Number(x.scores?.[type])<=16));
      const judged=adopted.filter(x=>bySample.get(x.sampleId)?.has(m.id));
      const allDetected=judged.filter(x=>x.appliedTypes?.every(type=>
        bySample.get(x.sampleId)?.get(m.id)?.[type]===1)).length;
      multiMetrics.push({metric:"multi-type-self-reported",classifierId:m.id,profileId,
        ...rate(adopted.length,population.length)});
      multiMetrics.push({metric:"all-applied-types-detected",classifierId:m.id,profileId,
        ...rate(allDetected,judged.length)});
      multiMetrics.push({metric:"low-score-type-self-reported",classifierId:m.id,profileId,
        ...rate(below.length,population.length)});
      multiMetrics.push({metric:"all-detected-classification-coverage",classifierId:m.id,profileId,
        ...rate(judged.length,adopted.length)});
    }
  }
  const triads=rows.filter(x=>modelIds.length===3&&modelIds.every(id=>
    bySample.get(x.sampleId)?.has(id)));
  const agreement: Agreement[]=HEXAD_TYPES.map(type=>{
    const judgments=triads.map(x=>modelIds.map(id=>bySample.get(x.sampleId)?.get(id)?.[type]) as
      [0|1,0|1,0|1]);
    const matching=judgments.filter(x=>x[0]===x[1]&&x[1]===x[2]).length;
    const fraction=rate(matching,judgments.length);
    return {type,evaluatedSamples:fraction.denominator,agreementCount:fraction.numerator,
      exactMatchRate:fraction.rate,fleissKappa:fleissKappaBinary(judgments)};
  });
  const sixMatch=triads.filter(x=>{
    const vectors=modelIds.map(id=>bySample.get(x.sampleId)?.get(id));
    return HEXAD_TYPES.every(type=>vectors[0]?.[type]===vectors[1]?.[type]&&
      vectors[1]?.[type]===vectors[2]?.[type]);
  });
  agreement.push({type:"six-label-exact-match",evaluatedSamples:triads.length,
    agreementCount:sixMatch.length,exactMatchRate:rate(sixMatch.length,triads.length).rate,
    fleissKappa:null});
  const missingJudgments=rows.reduce((sum,x)=>sum+modelIds.filter(id=>
    !bySample.get(x.sampleId)?.has(id)).length,0);
  return {schemaVersion:"offline-hexad-classification-analysis-v1",
    classifiedModels:modelIds,generatedSuccesses:rows.length,completeTriads:triads.length,
    missingJudgments,perType,top1Target,multiMetrics,agreement};
}
function toCsv(rows:Array<Record<string,unknown>>):string {
  if(!rows.length)return "";
  const columns=Object.keys(rows[0]);
  const escape=(value:unknown):string=>{
    const s=value===undefined||value===null?"":String(value);
    return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  };
  return [columns.join(","),...rows.map(row=>columns.map(k=>escape(row[k])).join(","))].join("\n")+"\n";
}
async function jsonl<T>(path:string):Promise<T[]>{
  const raw=await readFile(path,"utf8");
  return raw.trim()?raw.trim().split("\n").map(line=>JSON.parse(line) as T):[];
}
function textFromGeneration(row:GenerationRecord):string {
  return [row.nextGoalText,row.feedbackText,
    ...(row.recommendations??[]).map(r=>[r.nextStepText,r.reasonText].join("。"))]
    .filter(Boolean).join("\n");
}
export async function analyzeFromDirectories(generationDir:string,classificationDir:string,
  outputDir:string):Promise<Analysis> {
  const [rawGeneration,rawBlind,classified,manifest]=await Promise.all([
    jsonl<GenerationRecord>(resolve(generationDir,"results.jsonl")),
    jsonl<unknown>(resolve(generationDir,"classifier-input.jsonl")),
    jsonl<ClassificationResult>(resolve(classificationDir,"classification-output.jsonl")),
    readFile(resolve(classificationDir,"manifest.json"),"utf8"),
  ]);
  const blind=parseBlindSamples(rawBlind);
  const settings=JSON.parse(manifest) as {models?:unknown;fingerprint?:string};
  const models=parseClassifierConfig({models:settings.models}).models;
  if(settings.fingerprint!==classificationFingerprint(blind,models)){
    throw new Error("CLASSIFIER_GENERATION_INPUT_MISMATCH");
  }
  const source=new Map(blind.map(x=>[x.sampleId,x]));
  const successes=new Map(rawGeneration.filter(x=>x.status==="success").map(x=>[x.sampleId,x]));
  if(source.size!==successes.size)throw new Error("GENERATOR_BLIND_SAMPLE_COUNT_MISMATCH");
  for(const row of successes.values()){
    if(source.get(row.sampleId)?.text!==textFromGeneration(row))throw new Error("GENERATOR_BLIND_TEXT_MISMATCH");
  }
  for(const row of classified){
    if(!source.has(row.sampleId)||hash(source.get(row.sampleId)?.text??"")!==row.sourceHash){
      throw new Error("CLASSIFIER_SOURCE_HASH_MISMATCH");
    }
    if(row.status==="success"&&row.model!==models.find(m=>m.id===row.classifierId)?.model){
      throw new Error("CLASSIFIER_MODEL_MISMATCH");
    }
  }
  const analysis=computeAnalysis([...successes.values()],classified,models);
  const out=resolve(outputDir);
  await mkdir(out,{recursive:true,mode:0o700});
  await writeFile(resolve(out,"analysis-summary.json"),JSON.stringify(analysis,null,2)+"\n",{mode:0o600});
  await writeFile(resolve(out,"type-detection.csv"),toCsv(analysis.perType),{mode:0o600});
  await writeFile(resolve(out,"top1-target-detection.csv"),toCsv(analysis.top1Target),{mode:0o600});
  await writeFile(resolve(out,"multi-metrics.csv"),toCsv(analysis.multiMetrics),{mode:0o600});
  await writeFile(resolve(out,"classifier-agreement.csv"),toCsv(analysis.agreement),{mode:0o600});
  return analysis;
}
