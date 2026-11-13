/**
 * 大目標候補の適合度採点（Issue #366）。
 * 正本：実装仕様「2026-11-10_大目標モデル実装仕様」3章。
 * 本命の決定は研究者が作る優先順位表ではなく、LLM の適合度採点が担う。
 * LLM は候補集合の中でだけ選び、各候補にスコアと根拠を付ける。根拠は
 * 学習者の観測された状態に基づく具体的な文でなければならない。
 * PERSONALIZED のときだけ HEXAD スコアとコードブック（HEXAD の型の説明と
 * 目標型カタログの定義）を与え、解釈を根拠に含めさせる。解釈と根拠は
 * 呼び出しログに残り、事後の操作チェックに使える。
 * 採点の妥当性（候補の網羅・重複なし・スコア範囲・本命の一致）はコード側で
 * 機械検証し、LLM の本命指定と argmax が食い違う場合はコード側を正として
 * 不一致をログに残す。
 */
import OpenAI from "openai";
import { z } from "zod";

import { AppError } from "../error/appError";
import type { BigGoalCandidate } from "./bigGoal.candidates";
import { BIG_GOAL_TYPE_CATALOG } from "./bigGoal.types";

export const BIG_GOAL_SCORING_PROMPT_VERSION = "big-goal-scoring-v1-2026-11-10";
/** モデルは固定する（仕様3.2）。フィードバック生成の OPENAI_MODEL とは連動させない。 */
export const BIG_GOAL_SCORING_MODEL = "gpt-6-luna";
const REASONING_EFFORT = "low";

const HEXAD_SCORE_KEYS = [
  "Philanthropist",
  "Socialiser",
  "FreeSpirit",
  "Achiever",
  "Disruptor",
  "Player",
] as const;

const HEXAD_TYPE_DESCRIPTIONS: Record<(typeof HEXAD_SCORE_KEYS)[number], string> = {
  Philanthropist: "他者への貢献、知識の共有、誰かの役に立つことに動機づけられる。",
  Socialiser: "他者とのつながりや交流、コミュニティへの参加に動機づけられる。",
  FreeSpirit: "自律性、探索、自己表現や創作に動機づけられる。",
  Achiever: "達成、熟達、課題の克服や成長に動機づけられる。",
  Disruptor: "変化や攪拌、仕組みを変えることや他者への影響に動機づけられる。",
  Player: "報酬や収集、ポイントなどの見返りに動機づけられる。",
};

export type BigGoalScoringInput = {
  timing: "UNIT_START" | "ON_ACHIEVEMENT";
  startCourseId?: string | null;
  candidates: BigGoalCandidate[];
  /** 学習状態の要約（JSON 化できるもの） */
  learnerState: unknown;
  /** 初回利用時の申告（弱い手がかり）。保存先が未実装の間は null */
  declaredInfo: string | null;
  condition: "STANDARD" | "PERSONALIZED";
  /** PERSONALIZED のときだけ渡す。STANDARD では null のままにする */
  hexadScores: Record<string, number> | null;
};

export type ScoredCandidate = {
  candidateKey: string;
  score: number;
  rationale: string;
};

export type BigGoalScoringOutput = {
  /** 候補の並び順に整列した採点 */
  scores: ScoredCandidate[];
  /** コード側 argmax（同点は候補順で先のもの） */
  recommendedCandidateKey: string;
  llmRecommendedCandidateKey: string;
  model: string;
  promptVersion: string;
};

export type BigGoalCallLog = {
  stage: "scoring";
  promptVersion: string;
  settings: { model: string; reasoningEffort: string };
  prompt: unknown;
  result?: unknown;
  validation?: unknown;
  durationMs: number;
  error?: string;
};

type ScoringModelRequest = {
  model: string;
  messages: { role: "system" | "user"; content: string }[];
};
type ScoringModelResult = { content: string; responseId?: string; usage?: unknown };

export type BigGoalScoringDeps = {
  callModel?: (request: ScoringModelRequest) => Promise<ScoringModelResult>;
  onCallLog?: (log: BigGoalCallLog) => Promise<void> | void;
};

const scoringResponseSchema = z.object({
  scores: z.array(
    z.object({
      candidateKey: z.string().min(1),
      score: z.number().int().min(0).max(100),
      rationale: z.string().min(1),
    })
  ),
  recommendedCandidateKey: z.string().min(1),
});

const scoringJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["scores", "recommendedCandidateKey"],
  properties: {
    scores: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["candidateKey", "score", "rationale"],
        properties: {
          candidateKey: { type: "string" },
          score: { type: "integer", minimum: 0, maximum: 100 },
          rationale: { type: "string" },
        },
      },
    },
    recommendedCandidateKey: { type: "string" },
  },
} as const;

async function callScoringModel(request: ScoringModelRequest): Promise<ScoringModelResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: request.model,
    reasoning_effort: REASONING_EFFORT,
    messages: request.messages,
    response_format: {
      type: "json_schema",
      json_schema: { name: "big_goal_scoring", strict: true, schema: scoringJsonSchema },
    },
  });
  const content = completion.choices[0]?.message.content;
  if (!content)
    throw new AppError(502, "BIG_GOAL_SCORING_EMPTY_RESPONSE", "Scoring model returned an empty response");
  return { content, responseId: completion.id, usage: completion.usage };
}

function buildSystemPrompt(condition: "STANDARD" | "PERSONALIZED"): string {
  const base = [
    "あなたはプログラミング学習支援アプリの大目標候補を採点する評価者です。",
    "与えられた候補集合の中だけで評価し、集合の外の目標を作ってはいけません。",
    "各候補に 0〜100 の整数の適合度スコアと根拠を付け、最も適合する候補を本命として指定してください。",
    "根拠は、学習者の観測された状態（進捗・成績・挑戦の様子）や申告情報に基づく具体的な文にしてください。「おすすめです」のような汎用的な文は不可です。",
    "スコアと根拠に、所要日数・期限などの時間指定を含めてはいけません。",
  ];
  if (condition === "STANDARD") return base.join("\n");
  const codebook = [
    "",
    "## コードブック：HEXAD の型の説明",
    ...HEXAD_SCORE_KEYS.map((key) => `- ${key}: ${HEXAD_TYPE_DESCRIPTIONS[key]}`),
    "",
    "## コードブック：大目標の型カタログ",
    ...Object.values(BIG_GOAL_TYPE_CATALOG).map((t) => `- ${t.label}: ${t.definition}`),
    "",
    "学習者の HEXAD スコア（各 4〜28）をコードブックで解釈し、その解釈を各候補の根拠に含めてください。解釈は後から検証できるよう、どの特性がどう効いたかを明示してください。",
  ];
  return [...base, ...codebook].join("\n");
}

export async function scoreBigGoalCandidates(
  input: BigGoalScoringInput,
  deps: BigGoalScoringDeps = {}
): Promise<BigGoalScoringOutput> {
  if (input.candidates.length === 0)
    throw new AppError(409, "NO_CANDIDATES", "No big goal candidates to score");
  const callModel = deps.callModel ?? callScoringModel;
  const model = BIG_GOAL_SCORING_MODEL;
  const promptInput = {
    timing: input.timing,
    startCourseId: input.startCourseId ?? null,
    candidates: input.candidates.map((c) => ({
      candidateKey: c.candidateKey,
      type: c.type,
      typeLabel: BIG_GOAL_TYPE_CATALOG[c.type].label,
      params: c.params,
      displayText: c.displayText,
    })),
    learnerState: input.learnerState,
    declaredInfo: input.declaredInfo,
    ...(input.condition === "PERSONALIZED" ? { hexadScores: input.hexadScores } : {}),
  };
  const request: ScoringModelRequest = {
    model,
    messages: [
      { role: "system", content: buildSystemPrompt(input.condition) },
      { role: "user", content: JSON.stringify(promptInput) },
    ],
  };
  const startedAt = Date.now();
  const log: BigGoalCallLog = {
    stage: "scoring",
    promptVersion: BIG_GOAL_SCORING_PROMPT_VERSION,
    settings: { model, reasoningEffort: REASONING_EFFORT },
    prompt: promptInput,
    durationMs: 0,
  };
  try {
    const completion = await callModel(request);
    log.durationMs = Date.now() - startedAt;
    const parsedJson: unknown = JSON.parse(completion.content);
    const parsed = scoringResponseSchema.parse(parsedJson);
    log.result = { ...parsed, responseId: completion.responseId, usage: completion.usage };

    // 機械検証：全候補がちょうど1回ずつ採点されていること。
    const candidateKeys = input.candidates.map((c) => c.candidateKey);
    const scoredKeys = parsed.scores.map((s) => s.candidateKey);
    if (
      scoredKeys.length !== candidateKeys.length ||
      new Set(scoredKeys).size !== scoredKeys.length ||
      !candidateKeys.every((key) => scoredKeys.includes(key))
    ) {
      throw new AppError(502, "BIG_GOAL_SCORING_INVALID", "Scoring did not cover each candidate exactly once");
    }
    if (!candidateKeys.includes(parsed.recommendedCandidateKey)) {
      throw new AppError(502, "BIG_GOAL_SCORING_INVALID", "Recommended candidate is outside the candidate set");
    }
    // 本命はコード側 argmax を正とする（同点は候補順で先）。
    const byKey = new Map(parsed.scores.map((s) => [s.candidateKey, s]));
    const orderedScores = candidateKeys.map((key) => byKey.get(key)!);
    let recommended = orderedScores[0];
    for (const score of orderedScores) {
      if (score.score > recommended.score) recommended = score;
    }
    log.validation = {
      llmRecommendedCandidateKey: parsed.recommendedCandidateKey,
      codeRecommendedCandidateKey: recommended.candidateKey,
      consistent: parsed.recommendedCandidateKey === recommended.candidateKey,
    };
    await deps.onCallLog?.(log);
    return {
      scores: orderedScores,
      recommendedCandidateKey: recommended.candidateKey,
      llmRecommendedCandidateKey: parsed.recommendedCandidateKey,
      model,
      promptVersion: BIG_GOAL_SCORING_PROMPT_VERSION,
    };
  } catch (error) {
    log.durationMs = Date.now() - startedAt;
    log.error = error instanceof Error ? error.message : "BIG_GOAL_SCORING_FAILED";
    await Promise.resolve(deps.onCallLog?.(log)).catch(() => undefined);
    if (error instanceof AppError) throw error;
    throw new AppError(502, "BIG_GOAL_SCORING_FAILED", "Big goal scoring failed");
  }
}
