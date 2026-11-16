/**
 * CLI wrapper for offline HEXAD generation study (not the participant app).
 * Default mode is PREVIEW: it never contacts the OpenAI API.
 */
import "dotenv/config";
import { GENERATION_CONDITIONS, loadExperimentFiles, planJobs, runBatch,
  type GenerationCondition } from "./feedbackGenerationBatch";

const help = [
  "Offline HEXAD feedback generation test (STANDARD/TOP_1/MULTI only)",
  "",
  "From the back/ directory:",
  "  npm run feedback:generate -- --cases=<file.json> --profiles=<file.json>",
  "  npm run feedback:generate -- --cases=<file.json> --profiles=<file.json> --out=<directory> --execute --limit=2",
  "  npm run feedback:generate -- --cases=<file.json> --profiles=<file.json> --out=<directory> --execute --resume --full",
  "",
  "--cases=FILE       JSON array: [{ caseId: ..., input: <feedbackV1.input> }]",
  "--profiles=FILE    JSON object: { multi: [{ id: ..., scores: {...six types...} }] }",
  "--out=DIR          Private output directory. Must be empty on first execution.",
  "--repeat=N         Stage2 generations per profile and case; default 2.",
  "--conditions=LIST  Comma-separated subset of STANDARD,TOP_1,MULTI. Default all three.",
  "--execute          EXPLICIT permission to call the real LLM API and incur cost.",
  "--limit=N          Run up to N new samples (required unless --full).",
  "--full             Process all remaining planned samples; confirms large runs.",
  "--resume           Continue an existing output directory; reuse saved Stage1.",
  "--help             Print this help; never calls the API.",
  "",
  "OPENAI_API_KEY and OPENAI_MODEL must be configured for --execute.",
  "No Prisma writes, no Cloud Tasks, no HEXAD classification in this CLI.",
].join("\n");
type Options = { cases: string; profiles: string; out?: string; repeat: number;
  conditions: GenerationCondition[]; execute: boolean; full: boolean; resume: boolean; limit?: number };
function parse(argv: string[]): Options | null {
  if (argv.includes("--help") || argv.includes("-h")) return null;
  const values = new Map<string, string>();
  const flags = new Set<string>();
  const booleanFlags = new Set(["execute", "full", "resume"]);
  const namedOptions = new Set(["cases", "profiles", "out", "repeat", "conditions", "limit"]);
  for (let i = 0; i < argv.length; i++) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(argv[i]);
    if (!match) throw new Error("UNKNOWN_ARGUMENT: " + argv[i]);
    const name = match[1], inline = match[2];
    if (booleanFlags.has(name)) {
      if (inline !== undefined || flags.has(name)) throw new Error("INVALID_FLAG: " + name);
      flags.add(name);
    } else if (namedOptions.has(name)) {
      const value = inline !== undefined ? inline : argv[++i];
      if (!value || values.has(name)) throw new Error("INVALID_OPTION: " + name);
      values.set(name, value);
    } else throw new Error("UNKNOWN_OPTION: " + name);
  }
  const cases = values.get("cases"), profiles = values.get("profiles");
  if (!cases || !profiles) throw new Error("--cases and --profiles are required (see --help)");
  const repeat = values.has("repeat") ? Number(values.get("repeat")) : 2;
  const limit = values.has("limit") ? Number(values.get("limit")) : undefined;
  const conditions = values.has("conditions")
    ? (values.get("conditions") ?? "").split(",") as GenerationCondition[]
    : [...GENERATION_CONDITIONS];
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 100) throw new Error("INVALID_REPEAT");
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) throw new Error("INVALID_LIMIT");
  if (new Set(conditions).size !== conditions.length ||
      !conditions.length || conditions.some(c => !(GENERATION_CONDITIONS as readonly string[]).includes(c))) {
    throw new Error("INVALID_CONDITIONS");
  }
  const execute = flags.has("execute"), full = flags.has("full");
  if (full && limit !== undefined) throw new Error("Choose exactly one of --full or --limit=N");
  if (execute && !values.get("out")) throw new Error("--out=DIR is required for --execute");
  if (execute && !full && limit === undefined) throw new Error("--execute requires --limit=N or --full");
  return { cases, profiles, out: values.get("out"), repeat, conditions,
    execute, full, resume: flags.has("resume"), limit };
}
async function main() {
  const options = parse(process.argv.slice(2));
  if (!options) { console.log(help); return; }
  const model = process.env.OPENAI_MODEL?.trim() ?? "";
  const spec = await loadExperimentFiles(options.cases, options.profiles,
    options.repeat, options.conditions, model || "MODEL_NOT_SET");
  const jobs = planJobs(spec);
  const caseCount = spec.cases.length;
  console.log(JSON.stringify({
    mode: options.execute ? "EXECUTE" : "PREVIEW_ONLY",
    cases: caseCount, multiProfiles: spec.profiles.multi.length,
    repeat: options.repeat, conditions: options.conditions,
    plannedStage1Calls: caseCount, plannedStage2Calls: jobs.length,
    plannedTotalModelCalls: caseCount + jobs.length, model: model || "(unset)",
    fullStudyReference: { standard: 24, top1: 144, multi: 240 },
  }, null, 2));
  if (!options.execute) {
    console.log("PREVIEW complete. No files written and no LLM calls made.");
    return;
  }
  if (!process.env.OPENAI_API_KEY?.trim()) throw new Error("OPENAI_API_KEY_REQUIRED");
  if (!model) throw new Error("OPENAI_MODEL_REQUIRED: explicitly select a model for auditability");
  const result = await runBatch(spec, options.out!, {
    resume: options.resume, limit: options.full ? undefined : options.limit,
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.failed) process.exitCode = 1;
}
void main().catch(error => {
  console.error(error instanceof Error ? error.message : "UNKNOWN_GENERATION_CLI_ERROR");
  process.exitCode = 1;
});
