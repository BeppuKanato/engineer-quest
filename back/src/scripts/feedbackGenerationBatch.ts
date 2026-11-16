/**
 * Offline HEXAD feedback generation experiment.
 *
 * Never touches Prisma, participant assignments, Cloud Tasks or application tables.
 * All conditions for one case use the SAME validated Stage1 result.
 */
import { createHash } from "node:crypto";
import { appendFile, chmod, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  FEEDBACK_V2_PROMPT_VERSION,
  generateFeedbackV2,
  supportPlanSchema,
  v2OpenAiCall,
  type FeedbackV2Input,
  type SupportPlanResult,
  type V2LlmCall,
} from "../service/feedbackV2.engine";
import { HEXAD_TYPES, HEXAD_DEFINITION_VERSION, assertHexadScores, resolveHexadCondition,
  type HexadScores, type HexadType } from "../service/feedbackHexadConditions";
import type { Input } from "../service/feedbackV1.engine";

export const GENERATION_CONDITIONS = ["STANDARD", "TOP_1", "MULTI"] as const;
export type GenerationCondition = typeof GENERATION_CONDITIONS[number];
export type Case = { caseId: string; input: Input };
export type MultiProfile = { id: string; scores: HexadScores };
export type GenerationProfileConfig = { multi: MultiProfile[] };
export type BatchSettings = {
  cases: Case[];
  profiles: GenerationProfileConfig;
  repeat: number;
  conditions: GenerationCondition[];
  model: string;
};
export type GenerationJob = {
  caseId: string;
  condition: GenerationCondition;
  profileId: string;
  repeatIndex: number;
  selectedType: HexadType | null;
  scores: HexadScores | null;
  key: string;
  sampleId: string;
};

const safeName = /^[a-zA-Z0-9._-]+$/;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function ensureUnique(values: string[], label: string) {
  if (new Set(values).size !== values.length) throw new Error("DUPLICATE_" + label);
}
export function parseCases(input: unknown): Case[] {
  if (!Array.isArray(input) || input.length === 0) throw new Error("CASES_MUST_BE_NONEMPTY_ARRAY");
  const cases = input.map((item: unknown): Case => {
    if (!isRecord(item) || typeof item.caseId !== "string" || !safeName.test(item.caseId) ||
        !isRecord(item.input)) throw new Error("INVALID_GENERATION_CASE");
    const source = item.input;
    if (!Array.isArray(source.actions) || !isRecord(source.targets) ||
        !("learning" in source) || !("state" in source) || !("bigGoal" in source)) {
      throw new Error("INVALID_CASE_INPUT: expected feedbackV1.input snapshot (learning/state/actions/targets/bigGoal)");
    }
    // The experiment always supplies the condition. Strip any old per-user
    // HEXAD, assignment, and source registry before the fixed Stage1 call.
    const base = { ...source };
    delete base.hexad;
    delete base.experimentV2;
    delete base.evidenceSources;
    return { caseId: item.caseId, input: { ...base, hexad: null } as Input };
  });
  ensureUnique(cases.map(item => item.caseId), "CASE_ID");
  return cases;
}
export function parseProfiles(input: unknown): GenerationProfileConfig {
  if (!isRecord(input) || !Array.isArray(input.multi) || !input.multi.length) {
    throw new Error("MULTI_PROFILES_REQUIRED");
  }
  const multi = input.multi.map((row: unknown): MultiProfile => {
    if (!isRecord(row) || typeof row.id !== "string" || !safeName.test(row.id)) {
      throw new Error("INVALID_MULTI_PROFILE");
    }
    assertHexadScores(row.scores);
    return { id: row.id, scores: { ...row.scores } };
  });
  ensureUnique(multi.map(row => row.id), "MULTI_PROFILE_ID");
  return { multi };
}
export function planJobs(settings: BatchSettings): GenerationJob[] {
  if (!Number.isInteger(settings.repeat) || settings.repeat < 1 || settings.repeat > 100) {
    throw new Error("INVALID_REPEAT_COUNT");
  }
  if (!settings.conditions.length ||
      new Set(settings.conditions).size !== settings.conditions.length ||
      settings.conditions.some(c => !(GENERATION_CONDITIONS as readonly string[]).includes(c))) {
    throw new Error("INVALID_CONDITIONS");
  }
  const variants: Array<Pick<GenerationJob, "condition" | "profileId" | "selectedType" | "scores">> = [];
  if (settings.conditions.includes("STANDARD")) {
    variants.push({ condition: "STANDARD", profileId: "standard", selectedType: null, scores: null });
  }
  if (settings.conditions.includes("TOP_1")) {
    for (const type of HEXAD_TYPES) {
      const scores = Object.fromEntries(HEXAD_TYPES.map(t => [t, t === type ? 24 : 12])) as HexadScores;
      variants.push({ condition: "TOP_1", profileId: "top1-" + type, selectedType: type, scores });
    }
  }
  if (settings.conditions.includes("MULTI")) {
    for (const profile of settings.profiles.multi) {
      variants.push({ condition: "MULTI", profileId: profile.id, selectedType: null, scores: profile.scores });
    }
  }
  return settings.cases.flatMap(experimentCase => variants.flatMap(variant =>
    Array.from({ length: settings.repeat }, (_, i) => {
      const key = JSON.stringify([experimentCase.caseId, variant.condition, variant.profileId, i + 1]);
      return {
        ...variant, caseId: experimentCase.caseId, repeatIndex: i + 1,
        key, sampleId: "s-" + digest(key).slice(0, 20),
      };
    })));
}
export function snapshotForJob(input: Input, job: GenerationJob): FeedbackV2Input {
  const condition = job.condition;
  const decision = condition === "STANDARD"
    ? resolveHexadCondition("STANDARD", null)
    : condition === "TOP_1"
      ? resolveHexadCondition("TOP_1", job.scores, job.selectedType)
      : resolveHexadCondition("MULTI", job.scores);
  // A new object for each attempt prevents a run from modifying the case base.
  return { ...input, hexad: null, experimentV2: decision };
}
export function experimentFingerprint(settings: BatchSettings): string {
  return digest(JSON.stringify({
    cases: settings.cases, profiles: settings.profiles, repeat: settings.repeat,
    conditions: settings.conditions, model: settings.model,
    promptVersion: FEEDBACK_V2_PROMPT_VERSION,
    definitionVersion: HEXAD_DEFINITION_VERSION,
  }));
}
async function jsonl<T>(filename: string): Promise<T[]> {
  let raw: string;
  try { raw = await readFile(filename, "utf8"); }
  catch (error) {
    if (isRecord(error) && error.code === "ENOENT") return [];
    throw error;
  }
  return raw.trim() ? raw.trim().split("\n").map(line => JSON.parse(line) as T) : [];
}
async function appendJsonl(filename: string, record: unknown) {
  await appendFile(filename, JSON.stringify(record) + "\n", { encoding: "utf8", mode: 0o600 });
}
type Stage1Record = {
  caseId: string; promptVersion: string; plan: SupportPlanResult; savedAt: string;
};
export type ResultRecord = {
  sampleId: string; key: string; caseId: string;
  condition: GenerationCondition; profileId: string; repeatIndex: number;
  selectedType: HexadType | null; scores: HexadScores | null;
  promptVersion: string; definitionVersion: string; model: string;
  status: "success" | "error"; createdAt: string;
  nextGoalText?: string; feedbackText?: string;
  recommendations?: { candidateId: string; nextStepText: string; reasonText: string }[];
  appliedTypes?: HexadType[]; hexadRationale?: string | null;
  calls: Array<{ stage: string; model?: string; responseId?: string; usage?: unknown; durationMs?: number }>;
  error?: string;
};
function classifierText(result: ResultRecord): string {
  return [result.nextGoalText, result.feedbackText,
    ...(result.recommendations ?? []).map(r => [r.nextStepText, r.reasonText].join("。"))]
    .filter(Boolean).join("\n");
}
export type BatchRunResult = {
  planned: number; previousSuccesses: number; attempted: number;
  succeeded: number; failed: number; stage1Calls: number; stage2Calls: number;
  outDir: string;
};
/**
 * Incremental, resumable, one-model-call-at-a-time runner.
 * Limit bounds NEW attempts in this invocation. Any error stops the batch
 * after persisting its record so that operator can inspect before resume.
 */
export async function runBatch(settings: BatchSettings, outDirInput: string, options: {
  resume?: boolean; limit?: number; call?: V2LlmCall;
} = {}): Promise<BatchRunResult> {
  const outDir = resolve(outDirInput);
  const fingerprint = experimentFingerprint(settings);
  const jobs = planJobs(settings);
  const manifestPath = resolve(outDir, "manifest.json");
  const stagePath = resolve(outDir, "stage1.jsonl");
  const resultPath = resolve(outDir, "results.jsonl");
  const blindPath = resolve(outDir, "classifier-input.jsonl");
  const call = options.call ?? v2OpenAiCall;
  if (options.limit !== undefined && (!Number.isInteger(options.limit) || options.limit < 1)) {
    throw new Error("INVALID_LIMIT");
  }
  await mkdir(outDir, { recursive: true, mode: 0o700 });
  await chmod(outDir, 0o700);
  if (options.resume) {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { fingerprint?: string };
    if (manifest.fingerprint !== fingerprint) throw new Error("RESUME_FINGERPRINT_MISMATCH");
  } else {
    if ((await readdir(outDir)).length) throw new Error("OUTPUT_DIRECTORY_NOT_EMPTY: choose a fresh --out or --resume");
    await writeFile(manifestPath, JSON.stringify({
      schemaVersion: "offline-hexad-generation-v1",
      fingerprint, model: settings.model, promptVersion: FEEDBACK_V2_PROMPT_VERSION,
      definitionVersion: HEXAD_DEFINITION_VERSION, conditions: settings.conditions,
      caseCount: settings.cases.length, multiProfileCount: settings.profiles.multi.length,
      repeat: settings.repeat, planned: jobs.length, createdAt: new Date().toISOString(),
    }, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  }
  const stage1ByCase = new Map<string, SupportPlanResult>();
  for (const entry of await jsonl<Stage1Record>(stagePath)) {
    if (entry.promptVersion !== FEEDBACK_V2_PROMPT_VERSION) throw new Error("STAGE1_VERSION_MISMATCH");
    stage1ByCase.set(entry.caseId, supportPlanSchema.parse(entry.plan));
  }
  const previous = await jsonl<ResultRecord>(resultPath);
  const successes = new Map(previous.filter(r => r.status === "success").map(r => [r.key, r]));
  const previousSuccesses = successes.size;
  let attempted = 0, succeeded = 0, failed = 0, stage1Calls = 0, stage2Calls = 0;
  const caseById = new Map(settings.cases.map(item => [item.caseId, item]));
  try {
    for (const job of jobs) {
      if (successes.has(job.key)) continue;
      if (options.limit !== undefined && attempted >= options.limit) break;
      attempted++;
      const meta: ResultRecord = {
        sampleId: job.sampleId, key: job.key, caseId: job.caseId,
        condition: job.condition, profileId: job.profileId, repeatIndex: job.repeatIndex,
        selectedType: job.selectedType, scores: job.scores,
        model: settings.model, promptVersion: FEEDBACK_V2_PROMPT_VERSION,
        definitionVersion: HEXAD_DEFINITION_VERSION,
        status: "error", createdAt: new Date().toISOString(), calls: [],
      };
      const experimentCase = caseById.get(job.caseId);
      if (!experimentCase) throw new Error("UNKNOWN_CASE");
      const input = snapshotForJob(experimentCase.input, job);
      try {
        const output = await generateFeedbackV2(input, async (stage, prompt, schema) => {
          if (stage === "support") stage1Calls++;
          else stage2Calls++;
          return call(stage, prompt, schema);
        }, async item => {
          if (!isRecord(item)) return;
          if (item.stage === "support-plan-validated" && !stage1ByCase.has(job.caseId)) {
            const plan = supportPlanSchema.parse(item.plan);
            await appendJsonl(stagePath, {
              caseId: job.caseId, promptVersion: FEEDBACK_V2_PROMPT_VERSION,
              plan, savedAt: new Date().toISOString(),
            } satisfies Stage1Record);
            stage1ByCase.set(job.caseId, plan);
          }
          if (item.stage === "support" || item.stage === "compose") {
            meta.calls.push({
              stage: item.stage, model: typeof item.model === "string" ? item.model : undefined,
              responseId: typeof item.responseId === "string" ? item.responseId : undefined,
              usage: item.usage, durationMs: typeof item.durationMs === "number" ? item.durationMs : undefined,
            });
          }
        }, stage1ByCase.get(job.caseId));
        meta.status = "success";
        meta.nextGoalText = output.composedFeedback.nextGoalText;
        meta.feedbackText = output.composedFeedback.feedbackText;
        meta.recommendations = output.composedFeedback.recommendations;
        meta.appliedTypes = output.composedFeedback.hexadAudit?.appliedTypes ?? [];
        meta.hexadRationale = output.composedFeedback.hexadAudit?.rationale ?? null;
        succeeded++;
        successes.set(job.key, meta);
        await appendJsonl(resultPath, meta);
        process.stdout.write("OK " + job.sampleId + " (" + (previousSuccesses + succeeded) + "/" + jobs.length + ")\n");
      } catch (error) {
        failed++;
        meta.error = error instanceof Error ? error.message.slice(0, 400) : "UNKNOWN_ERROR";
        await appendJsonl(resultPath, meta);
        process.stderr.write("FAILED " + job.sampleId + ": " + meta.error + "\n");
        break;
      }
    }
  } finally {
    // Recreate from successful result records: no score, condition, or generator
    // claimed types may be exposed to the independent HEXAD classifier.
    const classifierRows = jobs
      .map(job => successes.get(job.key))
      .filter((r): r is ResultRecord => Boolean(r))
      .map(r => ({ sampleId: r.sampleId, text: classifierText(r) }));
    await writeFile(blindPath,
      classifierRows.map(r => JSON.stringify(r)).join("\n") + (classifierRows.length ? "\n" : ""),
      { mode: 0o600 });
  }
  return { planned: jobs.length, previousSuccesses, attempted, succeeded, failed,
    stage1Calls, stage2Calls, outDir };
}

export async function loadExperimentFiles(casesFile: string, profilesFile: string, repeat: number,
  conditions: GenerationCondition[], model: string): Promise<BatchSettings> {
  const [casesSource, profilesSource] = await Promise.all([
    readFile(casesFile, "utf8"), readFile(profilesFile, "utf8"),
  ]);
  return {
    cases: parseCases(JSON.parse(casesSource)),
    profiles: parseProfiles(JSON.parse(profilesSource)),
    repeat, conditions, model,
  };
}
