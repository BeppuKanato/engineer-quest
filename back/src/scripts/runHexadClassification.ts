/** Standalone HEXAD binary multi-label classification CLI. */
import "dotenv/config";
import { classifyPrompt, loadBlindFile, loadClassifierConfig,
  runClassificationBatch } from "./hexadClassifierBatch";

const HELP = [
  "HEXAD independent binary classification (Qwen3:30B / Mistral Small 3.2 / Phi-4).",
  "Usage (from back/):",
  "  npm run feedback:classify -- --input=.feedback-generation-results/study-01/classifier-input.jsonl",
  "  npm run feedback:classify -- --input=... --out=.feedback-classification-results/study-01 --execute --limit=3",
  "  npm run feedback:classify -- --input=... --out=.feedback-classification-results/study-01 --execute --resume --full",
  "Options:",
  "  --input=FILE        Required; ONLY the blind classifier-input.jsonl from generation CLI",
  "  --config=FILE       Default src/scripts/fixtures/hexad-classifiers.example.json",
  "  --models=ID,ID      Select classifier IDs from config (default all three)",
  "  --out=DIR           Private output directory (fresh directory first run)",
  "  --execute           Explicitly enable real API calls; otherwise preview only",
  "  --limit=N           At most N new model/sample calls (required unless --full)",
  "  --full              All unprocessed model/sample calls (explicit large-run consent)",
  "  --resume            Continue the same model+input fingerprint",
  "  --help              Print help without calling any models",
  "Output: classification-output.jsonl + manifest.json. No generator metadata is read.",
  "Use npm run feedback:classify:analyze to calculate detection and agreement.",
].join("\n");
const CONFIG = "src/scripts/fixtures/hexad-classifiers.example.json";
type Params = {input:string;config:string;models:string[]|null;out?:string;execute:boolean;full:boolean;
  resume:boolean;limit?:number};
function parse(args:string[]):Params|null {
  if (args.includes("--help") || args.includes("-h")) return null;
  const options=new Map<string,string>(),flags=new Set<string>();
  for(let i=0;i<args.length;i++){
    const match=/^--([a-z-]+)(?:=(.*))?$/.exec(args[i]);
    if(!match)throw new Error("UNKNOWN_ARGUMENT_"+args[i]);
    const name=match[1];
    if(["execute","resume","full"].includes(name)){
      if(match[2]!==undefined||flags.has(name))throw new Error("INVALID_FLAG_"+name);
      flags.add(name);
    }else if(["input","config","models","out","limit"].includes(name)){
      const val=match[2]!==undefined?match[2]:args[++i];
      if(!val||options.has(name))throw new Error("INVALID_OPTION_"+name);
      options.set(name,val);
    }else throw new Error("UNKNOWN_OPTION_"+name);
  }
  const input=options.get("input");
  if(!input)throw new Error("--input=FILE required");
  const out=options.get("out"),execute=flags.has("execute"),full=flags.has("full");
  const limit=options.has("limit")?Number(options.get("limit")):undefined;
  if(limit!==undefined&&(!Number.isInteger(limit)||limit<1))throw new Error("INVALID_LIMIT");
  if(full&&limit!==undefined)throw new Error("Choose --full OR --limit=N");
  if(execute&&(!out||(!full&&limit===undefined)))throw new Error("--execute requires --out and either --limit=N or --full");
  if(flags.has("resume")&&!execute)throw new Error("--resume requires --execute");
  const ids=options.get("models")?.split(",")??null;
  if(ids&&(!ids.length||new Set(ids).size!==ids.length||ids.some(x=>!x)))throw new Error("INVALID_MODEL_IDS");
  return {input,config:options.get("config")??CONFIG,models:ids,
    out,execute,full,resume:flags.has("resume"),limit};
}
async function main(){
  const args=parse(process.argv.slice(2));
  if(!args){console.log(HELP);return;}
  const [samples,config]=await Promise.all([loadBlindFile(args.input),loadClassifierConfig(args.config)]);
  const models=args.models?config.models.filter(m=>args.models?.includes(m.id)):config.models;
  if(!models.length||args.models&&models.length!==args.models.length)throw new Error("UNKNOWN_MODEL_ID");
  console.log(JSON.stringify({
    mode:args.execute?"EXECUTE":"PREVIEW_ONLY",
    samples:samples.length,models:models.map(m=>({id:m.id,model:m.model,baseURL:m.baseURL})),
    plannedCalls:samples.length*models.length,
    output:args.out??"(not written in preview)",
    classifierPromptLength:classifyPrompt().length,
  },null,2));
  if(!args.execute){console.log("No model calls made and no files written.");return;}
  const result=await runClassificationBatch(samples,models,args.out!,{
    resume:args.resume,limit:args.full?undefined:args.limit,
  });
  console.log(JSON.stringify(result,null,2));
  if(result.failed)process.exitCode=1;
}
void main().catch(e=>{console.error(e instanceof Error?e.message:"UNKNOWN_CLASSIFY_ERROR");process.exitCode=1;});
