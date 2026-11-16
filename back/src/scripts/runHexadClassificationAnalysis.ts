/** Offline analysis CLI. Reads generation audit only AFTER model classification. */
import { analyzeFromDirectories } from "./hexadClassificationAnalysis";

const HELP=[
  "Offline HEXAD classification analysis: detection and inter-model agreement.",
  "From back/:",
  "  npm run feedback:classify:analyze -- --generated=.feedback-generation-results/study-01 --classified=.feedback-classification-results/study-01",
  "Options:",
  "  --generated=DIR    Directory containing generator results.jsonl and blind classifier-input.jsonl",
  "  --classified=DIR   Directory containing classification-output.jsonl and manifest.json",
  "  --out=DIR          Output directory (default: classified/analysis)",
  "No API/DB calls; writes summary JSON and CSV tables.",
].join("\n");
function parse(args:string[]):{generated:string;classified:string;out:string}|null {
  if(args.includes("--help")||args.includes("-h"))return null;
  const opts=new Map<string,string>();
  for(let i=0;i<args.length;i++){
    const m=/^--(generated|classified|out)(?:=(.+))?$/.exec(args[i]);
    if(!m)throw new Error("UNKNOWN_ARGUMENT_"+args[i]);
    const name=m[1],value=m[2]??args[++i];
    if(!value||opts.has(name))throw new Error("INVALID_OPTION_"+name);
    opts.set(name,value);
  }
  const generated=opts.get("generated"),classified=opts.get("classified");
  if(!generated||!classified)throw new Error("--generated and --classified are required");
  return {generated,classified,out:opts.get("out")??classified+"/analysis"};
}
async function main(){
  const args=parse(process.argv.slice(2));
  if(!args){console.log(HELP);return;}
  const summary=await analyzeFromDirectories(args.generated,args.classified,args.out);
  console.log(JSON.stringify({
    output:args.out,generatedSuccesses:summary.generatedSuccesses,
    classifierModels:summary.classifiedModels,
    completeTriads:summary.completeTriads,
    missingJudgments:summary.missingJudgments,
    multiOverall:summary.multiMetrics.filter(x=>x.profileId==="ALL"),
  },null,2));
}
void main().catch(e=>{console.error(e instanceof Error?e.message:"UNKNOWN_ANALYSIS_ERROR");process.exitCode=1;});
