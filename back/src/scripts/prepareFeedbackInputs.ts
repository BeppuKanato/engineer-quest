/** Offline export normalization/material enrichment. No DB and no model calls. */
import { readFile,writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { parseCases } from "./feedbackGenerationBatch";
import { prepareSavedFeedbackInput } from "../service/feedbackInputPreparation";
async function main() {
  const args=new Map(process.argv.slice(2).map(a=>{const i=a.indexOf("=");return i<0?[a,""]:[a.slice(0,i),a.slice(i+1)];}));
  for(const key of args.keys())if(!["--input","--out","--assume-current-materials"].includes(key))throw new Error("UNKNOWN_OPTION: "+key);
  const source=args.get("--input"),destination=args.get("--out");
  if(!source||!destination||resolve(source)===resolve(destination))throw new Error("Provide distinct --input=FILE --out=FILE [--assume-current-materials]");
  const raw=await readFile(source,"utf8"),value=JSON.parse(raw);
  const extracted=Array.isArray(value)&&value.length===1&&typeof value[0]?.cases_json==="string"?JSON.parse(value[0].cases_json):value;
  const cases=parseCases(extracted).map(c=>({...c,input:prepareSavedFeedbackInput(c.input,args.has("--assume-current-materials"))}));
  await writeFile(destination,JSON.stringify(cases,null,2)+"\n",{encoding:"utf8",flag:"wx"});
  console.log(JSON.stringify({cases:cases.length,sourceSha256:createHash("sha256").update(raw).digest("hex"),output:resolve(destination),assumedCurrentMaterials:args.has("--assume-current-materials"),dbCalls:0,llmCalls:0}));
}
void main().catch(error=>{console.error(error instanceof Error?error.message:"INPUT_PREPARATION_FAILED");process.exitCode=1;});
