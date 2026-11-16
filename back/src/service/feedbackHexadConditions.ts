/**
 * HEXAD feedback condition policy (v2).
 * Type definitions are operational descriptions, not diagnostic labels.
 * Do not expose score snapshots to the LLM for TOP_1/ROULETTE.
 */
export const HEXAD_TYPES = [
  "Achiever", "Philanthropist", "Socialiser", "FreeSpirit", "Player", "Disruptor",
] as const;
export type HexadType = typeof HEXAD_TYPES[number];
export type HexadScores = Record<HexadType, number>;
export type ResearchFeedbackCondition = "STANDARD" | "TOP_1" | "ROULETTE" | "MULTI";

// Review wording and its source before locking the participant experiment.
export const HEXAD_DEFINITION_VERSION = "hexad-operational-ja-2026-11-v1";
export const HEXAD_DEFINITIONS: Record<HexadType, string> = {
  Achiever: "課題への挑戦、技能の向上、達成や熟達を価値として捉える傾向",
  Philanthropist: "他者への支援、貢献、意味のある目的への関与を価値として捉える傾向",
  Socialiser: "他者との交流、つながり、協働を価値として捉える傾向",
  FreeSpirit: "選択の自由、自律性、発見、創造的な探究を価値として捉える傾向",
  Player: "ポイント、バッジ、報酬など外的な報酬を価値として捉える傾向",
  Disruptor: "既存の仕組みを変えること、独自の試み、変化への影響を価値として捉える傾向",
};
export type SingleTypeContext = {
  kind: "single";
  type: HexadType;
  definition: string;
};
export type MultiTypeContext = {
  kind: "multi";
  scores: HexadScores;
  definitions: Record<HexadType, string>;
};
export type HexadPromptContext = null | SingleTypeContext | MultiTypeContext;
export type HexadDecision = {
  condition: ResearchFeedbackCondition;
  definitionVersion: typeof HEXAD_DEFINITION_VERSION;
  promptContext: HexadPromptContext;
  audit: {
    scores: HexadScores | null;
    selectedType: HexadType | null;
    top1Ties: HexadType[];
    rouletteWeights: Record<HexadType, number> | null;
    rouletteProbabilities: Record<HexadType, number> | null;
  };
};

export function assertHexadScores(value: unknown): asserts value is HexadScores {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("HEXAD_SCORES_REQUIRED");
  const row = value as Record<string, unknown>;
  if (HEXAD_TYPES.some(type => !Number.isInteger(row[type]) || Number(row[type]) < 4 || Number(row[type]) > 28) ||
      Object.keys(row).length !== HEXAD_TYPES.length) throw new Error("INVALID_HEXAD_SCORES");
}
function pickIndex(weights: number[], random: () => number): number {
  const r = random();
  if (!Number.isFinite(r) || r < 0 || r >= 1) throw new Error("INVALID_RANDOM_VALUE");
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new Error("ROULETTE_NO_ELIGIBLE_TYPE");
  const threshold = r * total;
  let cursor = 0;
  for (let i = 0; i < weights.length; i++) {
    cursor += weights[i];
    if (cursor > threshold) return i;
  }
  return weights.length - 1;
}

/** TOP-1 tie is resolved ONCE and the returned type must be persisted per learner. */
export function selectTop1(scores: HexadScores, random: () => number = Math.random): { type: HexadType; ties: HexadType[] } {
  assertHexadScores(scores);
  const max = Math.max(...HEXAD_TYPES.map(type => scores[type]));
  const ties = HEXAD_TYPES.filter(type => scores[type] === max);
  return { type: ties[pickIndex(ties.map(() => 1), random)], ties };
}

/** ROULETTE is sampled once per NEW feedback, not once per failed retry. */
export function selectRoulette(scores: HexadScores, random: () => number = Math.random) {
  assertHexadScores(scores);
  const values = HEXAD_TYPES.map(type => Math.max(0, scores[type] - 16));
  const total = values.reduce((a, b) => a + b, 0);
  // No arbitrary fallback until participant assignment and analysis rules are agreed.
  if (total === 0) throw new Error("ROULETTE_NO_ELIGIBLE_TYPE");
  const weights = Object.fromEntries(HEXAD_TYPES.map((type, i) => [type, values[i]])) as Record<HexadType, number>;
  const probabilities = Object.fromEntries(HEXAD_TYPES.map((type, i) => [type, values[i] / total])) as Record<HexadType, number>;
  return { type: HEXAD_TYPES[pickIndex(values, random)], weights, probabilities };
}

/**
 * Produce the versioned condition-specific prompt context and a separate audit
 * record. Only promptContext is allowed in Stage2 LLM input.
 */
export function resolveHexadCondition(
  condition: ResearchFeedbackCondition,
  scores: HexadScores | null,
  fixedTop1: HexadType | null = null,
  random: () => number = Math.random,
): HexadDecision {
  if (condition === "STANDARD") return {
    condition, definitionVersion: HEXAD_DEFINITION_VERSION, promptContext: null,
    audit: { scores: scores ? { ...scores } : null, selectedType: null, top1Ties: [], rouletteWeights: null, rouletteProbabilities: null },
  };
  assertHexadScores(scores);
  if (condition === "MULTI") return {
    condition, definitionVersion: HEXAD_DEFINITION_VERSION,
    promptContext: { kind: "multi", scores: { ...scores }, definitions: { ...HEXAD_DEFINITIONS } },
    audit: { scores: { ...scores }, selectedType: null, top1Ties: [], rouletteWeights: null, rouletteProbabilities: null },
  };
  if (condition === "TOP_1") {
    const max = Math.max(...HEXAD_TYPES.map(type => scores[type]));
    const ties = HEXAD_TYPES.filter(type => scores[type] === max);
    // Fixed choice must exist in the initially tied highest group. Fail closed
    // on an inconsistent saved assignment rather than silently redrawing.
    if (fixedTop1 && !ties.includes(fixedTop1)) throw new Error("TOP1_FIXED_TYPE_MISMATCH");
    const type = fixedTop1 ?? selectTop1(scores, random).type;
    return {
      condition, definitionVersion: HEXAD_DEFINITION_VERSION,
      promptContext: { kind: "single", type, definition: HEXAD_DEFINITIONS[type] },
      audit: { scores: { ...scores }, selectedType: type, top1Ties: ties, rouletteWeights: null, rouletteProbabilities: null },
    };
  }
  const drawn = selectRoulette(scores, random);
  return {
    condition, definitionVersion: HEXAD_DEFINITION_VERSION,
    promptContext: { kind: "single", type: drawn.type, definition: HEXAD_DEFINITIONS[drawn.type] },
    audit: { scores: { ...scores }, selectedType: drawn.type, top1Ties: [],
      rouletteWeights: drawn.weights, rouletteProbabilities: drawn.probabilities },
  };
}
