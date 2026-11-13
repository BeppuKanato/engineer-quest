/**
 * LLMによる大目標「型・達成条件・動機づけ表現」の提案。
 * コードは達成判定可能な型/パラメータのホワイトリストだけを用意し、
 * LLMはそこから2〜3件の目標を構成する。推薦理由もLLMが生成する。
 * goal.displayTextの先頭はコード生成の達成条件文とし、目標の意味と
 * 追跡する条件が食い違わないようにする。
 */
import OpenAI from "openai";
import { z } from "zod";

import { AppError } from "../error/appError";
import type { BigGoalCandidate } from "./bigGoal.candidates";
import { BIG_GOAL_TYPE_CATALOG } from "./bigGoal.types";
import { BIG_GOAL_SCORING_MODEL } from "./bigGoal.scoring";

export const BIG_GOAL_GENERATION_PROMPT_VERSION = "big-goal-generation-v2-2026-11-13";
const REASONING_EFFORT = "medium";

const HEXAD_DESCRIPTIONS: Record<string, string> = {
  Philanthropist: "他者への貢献、知識の共有や支援",
  Socialiser: "他者との交流、つながり",
  FreeSpirit: "自律性、探索、創作",
  Achiever: "達成、熟達、挑戦",
  Disruptor: "仕組みへの働きかけ、変化",
  Player: "報酬、収集、ポイント",
};

const proposalSchema = z.object({
  type: z.enum(["UNIT_COMPLETION", "ACHIEVEMENT", "CREATE_QUEST"]),
  courseId: z.string().nullable(),
  achievementId: z.string().nullable(),
  challenge: z.enum(["NONE", "NO_HINT", "FULL_CODE", "FIRST_ATTEMPT_80"]).nullable(),
  count: z.number().int().nullable(),
  motivation: z.string().trim().min(1).max(64),
  score: z.number().int().min(0).max(100),
  rationale: z.string().trim().min(1).max(400),
});
const responseSchema = z.object({ goals: z.array(proposalSchema).min(1).max(3) });
type Proposal = z.infer<typeof proposalSchema>;

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["goals"],
  properties: {
    goals: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "courseId", "achievementId", "challenge", "count", "motivation", "score", "rationale"],
        properties: {
          type: { type: "string", enum: ["UNIT_COMPLETION", "ACHIEVEMENT", "CREATE_QUEST"] },
          courseId: { type: ["string", "null"] },
          achievementId: { type: ["string", "null"] },
          challenge: { type: ["string", "null"], enum: ["NONE", "NO_HINT", "FULL_CODE", "FIRST_ATTEMPT_80", null] },
          count: { type: ["integer", "null"] },
          motivation: { type: "string" },
          score: { type: "integer", minimum: 0, maximum: 100 },
          rationale: { type: "string" },
        },
      },
    },
  },
} as const;

type GoalSpec = Pick<Proposal, "type" | "courseId" | "achievementId" | "challenge" | "count">;
function specOf(option: BigGoalCandidate): GoalSpec {
  if (option.type === "UNIT_COMPLETION") {
    const p = option.params as { courseId: string; challenge?: { noHint?: boolean; inputLevel?: string; minFirstAttemptRate?: number } };
    const challenge = p.challenge?.noHint ? "NO_HINT"
      : p.challenge?.inputLevel === "full" ? "FULL_CODE"
      : p.challenge?.minFirstAttemptRate === 0.8 ? "FIRST_ATTEMPT_80"
      : "NONE";
    return { type: "UNIT_COMPLETION", courseId: p.courseId, achievementId: null, challenge, count: null };
  }
  if (option.type === "ACHIEVEMENT") {
    return { type: "ACHIEVEMENT", courseId: null, achievementId: (option.params as { achievementId: string }).achievementId, challenge: null, count: null };
  }
  if (option.type === "CREATE_QUEST") {
    const p = option.params as { algorithmCourseId: string; count: number };
    return { type: "CREATE_QUEST", courseId: p.algorithmCourseId, achievementId: null, challenge: null, count: p.count };
  }
  throw new Error("UNSUPPORTED_GOAL_TYPE");
}
const keyOf = (spec: GoalSpec): string => JSON.stringify(spec);

export type GoalGenerationInput = {
  timing: "UNIT_START" | "ON_ACHIEVEMENT";
  startCourseId: string | null;
  eligible: BigGoalCandidate[];
  learnerState: unknown;
  declaredInfo: string | null;
  condition: "STANDARD" | "PERSONALIZED";
  hexadScores: Record<string, number> | null;
};

export type GeneratedGoal = BigGoalCandidate & { score: number; rationale: string };
export type GoalGenerationOutput = {
  candidates: GeneratedGoal[];
  scores: { candidateKey: string; score: number; rationale: string }[];
  recommendedCandidateKey: string;
  llmRecommendedCandidateKey: string;
  model: string;
  promptVersion: string;
};
export type GenerationCallLog = {
  stage: "generation";
  promptVersion: string;
  settings: { model: string; reasoningEffort: string };
  prompt: unknown;
  result?: unknown;
  validation?: unknown;
  durationMs: number;
  error?: string;
};
type ModelRequest = { model: string; messages: { role: "system" | "user"; content: string }[] };
type ModelResult = { content: string; responseId?: string; usage?: unknown };
export type GoalGenerationDeps = {
  callModel?: (request: ModelRequest) => Promise<ModelResult>;
  onCallLog?: (log: GenerationCallLog) => Promise<void> | void;
};

async function callGenerationModel(request: ModelRequest): Promise<ModelResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: request.model,
    reasoning_effort: REASONING_EFFORT,
    messages: request.messages,
    response_format: {
      type: "json_schema",
      json_schema: { name: "big_goal_generation", strict: true, schema: jsonSchema },
    },
  });
  const content = response.choices[0]?.message.content;
  if (!content) throw new AppError(502, "BIG_GOAL_GENERATION_EMPTY", "Goal generation returned no content");
  return { content, responseId: response.id, usage: response.usage };
}

function systemPrompt(personalized: boolean, goalCount: number): string {
  const instructions = [
    "あなたはプログラミング学習アプリの大目標を提案します。",
    "固定された文章の採点ではなく、利用できる目標の型と条件を組み合わせて" + goalCount + "件の異なる目標を提案してください。",
    "達成条件はallowedSpecsに存在する組み合わせのみ使用します。型・対象ID・挑戦条件を変更した架空の活動や、測定不能な条件を作らないでください。",
    "rationaleは観測した学習状況に基づいて記述し、観測していない学力を推測しないでください。",
    "motivationはその目標に取り組む気持ちを支える短い一言です。新しい達成条件、期限、数値、報酬の約束を加えてはいけません。",
    "各候補に適合度0〜100を付け、重複する条件を提案しないでください。",
    "実現可能性と学習上の妥当性をHEXADより優先します。"
  ];
  if (personalized) {
    instructions.push("以下のHEXAD特性と各得点を、目標の方向性・優先順位・表現の動機づけに利用します。");
    for (const [name, description] of Object.entries(HEXAD_DESCRIPTIONS)) instructions.push(name + ": " + description);
    instructions.push("最上位タイプだけで機械的に決めず、他のスコアとの関係も考慮してください。");
  } else {
    instructions.push("HEXADや性格特性を推測・使用しないでください。");
  }
  return instructions.join("\n");
}

/** 生成結果の構造化条件が、コードで確認した達成可能な条件に完全一致する場合のみ採用する。 */
export async function generateBigGoalProposals(
  input: GoalGenerationInput,
  deps: GoalGenerationDeps = {}
): Promise<GoalGenerationOutput> {
  if (!input.eligible.length) throw new AppError(409, "NO_CANDIDATES", "No verifiable goal configuration");
  if (input.condition === "PERSONALIZED" && !input.hexadScores) {
    throw new AppError(409, "HEXAD_RESPONSE_REQUIRED", "HEXAD scores required");
  }
  const allowed = new Map(input.eligible.map(option => [keyOf(specOf(option)), option]));
  const goalCount = Math.min(3, allowed.size);
  const promptInput = {
    timing: input.timing,
    startCourseId: input.startCourseId,
    learnerState: input.learnerState,
    declaredInfo: input.declaredInfo,
    // 目標の表示文ではなく、実装が検証できる型・パラメータの組だけ渡す。
    allowedSpecs: input.eligible.map(option => specOf(option)),
    definitions: Object.fromEntries(
      Object.entries(BIG_GOAL_TYPE_CATALOG).filter(([, item]) => item.activated).map(([type, item]) => [type, item.definition])
    ),
    ...(input.condition === "PERSONALIZED" ? { hexadScores: input.hexadScores } : {}),
  };
  const request: ModelRequest = {
    model: BIG_GOAL_SCORING_MODEL,
    messages: [
      { role: "system", content: systemPrompt(input.condition === "PERSONALIZED", goalCount) },
      { role: "user", content: JSON.stringify(promptInput) },
    ],
  };
  const log: GenerationCallLog = {
    stage: "generation",
    promptVersion: BIG_GOAL_GENERATION_PROMPT_VERSION,
    settings: { model: BIG_GOAL_SCORING_MODEL, reasoningEffort: REASONING_EFFORT },
    prompt: promptInput,
    durationMs: 0,
  };
  const started = Date.now();
  try {
    const model = deps.callModel ?? callGenerationModel;
    const response = await model(request);
    const parsed = responseSchema.parse(JSON.parse(response.content));
    if (parsed.goals.length !== goalCount) throw new Error("INVALID_GOAL_COUNT");
    const chosen = new Set<string>();
    const candidates: GeneratedGoal[] = parsed.goals.map(goal => {
      const spec: GoalSpec = {
        type: goal.type, courseId: goal.courseId, achievementId: goal.achievementId,
        challenge: goal.challenge, count: goal.count,
      };
      const key = keyOf(spec);
      const option = allowed.get(key);
      if (!option) throw new Error("GOAL_NOT_FEASIBLE");
      if (chosen.has(key)) throw new Error("DUPLICATE_GOAL_CONDITION");
      chosen.add(key);
      // 達成条件をコード側の固定文で示し、LLMの一言は付記として分離する。
      // 数値や期限の追加を防ぐ（LLMの一言に新しい達成条件を持たせない）。
      if (/[0-9０-９]|[%％]|期限|以内|必ず/.test(goal.motivation)) throw new Error("GOAL_MOTIVATION_ADDS_CONSTRAINT");
      return {
        ...option,
        displayText: option.displayText + " — " + goal.motivation,
        score: goal.score,
        rationale: goal.rationale,
      };
    });
    const top = candidates.reduce((best, candidate) => candidate.score > best.score ? candidate : best, candidates[0]);
    log.result = { ...parsed, responseId: response.responseId, usage: response.usage };
    log.validation = { valid: true, acceptedKeys: candidates.map(c => c.candidateKey) };
    log.durationMs = Date.now() - started;
    await deps.onCallLog?.(log);
    return {
      candidates,
      scores: candidates.map(c => ({ candidateKey: c.candidateKey, score: c.score, rationale: c.rationale })),
      recommendedCandidateKey: top.candidateKey,
      llmRecommendedCandidateKey: top.candidateKey,
      model: BIG_GOAL_SCORING_MODEL,
      promptVersion: BIG_GOAL_GENERATION_PROMPT_VERSION,
    };
  } catch (error) {
    log.durationMs = Date.now() - started;
    log.error = error instanceof Error ? error.message : "BIG_GOAL_GENERATION_FAILED";
    await Promise.resolve(deps.onCallLog?.(log)).catch(() => undefined);
    throw new AppError(502, "BIG_GOAL_GENERATION_FAILED", log.error);
  }
}
