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
export const HEXAD_DEFINITION_VERSION = "hexad-framing-ja-2026-11-v2";
export const HEXAD_DEFINITIONS: Record<HexadType, string> = {
  Achiever: "課題への挑戦、技能の向上、達成や熟達を価値として捉える傾向",
  Philanthropist: "他者への支援、貢献、意味のある目的への関与を価値として捉える傾向",
  Socialiser: "他者との交流、つながり、協働を価値として捉える傾向",
  FreeSpirit: "選択の自由、自律性、発見、創造的な探究を価値として捉える傾向",
  Player: "ポイント、バッジ、報酬など外的な報酬を価値として捉える傾向",
  Disruptor: "既存の仕組みを変えること、独自の試み、変化への影響を価値として捉える傾向",
};

/** v6 framing blocks for single-type conditions (TOP_1/ROULETTE). Each block is
 * the type description plus how to frame the purpose sentence in the main
 * recommendation's reason; the recommended actions themselves stay unchanged.
 * Source: https://docs.google.com/document/d/1___iyMG-1-QDucFOYZ6X5S0hbbfaHVNulzGBGC8Z-rs
 * Design rationale: https://docs.google.com/document/d/1bExbe1GC5ZEavbKxgMTyxVh9gER49XbXwW-L_X9GCXs
 * MULTI keeps the short HEXAD_DEFINITIONS above: its all-types wording is
 * undecided and MULTI is outside the current experiment design.
 */
export const HEXAD_FRAMING_BLOCKS: Record<HexadType, string> = {
  Achiever: "この学習者は、課題を完了して前に進むこと、困難な挑戦に取り組んで自らを証明することに動機づけられる傾向がある。焦点は報酬ではなく、「できるようになった」という有能感そのものにある。\n書き方：主な推薦の理由では、学習記録に残っている達成を根拠に、何ができるようになったかと、次の一歩で届く到達点を具体的に書く。到達点は、単元完了や次の単元への前進として、また復習では弱点が埋まってできるようになることとして示す。行動の難度と、それに挑むことで確かめられる力にも触れ、挑戦として提示する。",
  Philanthropist: "この学習者は、自分の行動や努力が持つ意味のために動く傾向がある。利他的で、見返りを期待せずに与えることを厭わない。他者との関わりでは、関わりそのものよりも、他者を助けるための関わりを重視する。\n書き方：主な推薦の理由では、その行動が次の単元や後の理解にどうつながるかを一文で示し、努力の長期的な意味が伝わるようにする。掲示板への投稿や作るクエストなどの推薦では、その成果が他の学習者の学びに使える形になることに触れ、誰かの役に立つ形になるという切り口で書く。自分の言葉で整理する行動、復習、次の単元へ進む行動でも、今の学びが先の理解や、将来ほかの学習者を助けたり知見を共有したりする場面での力につながるという切り口で、努力の持つ意味を示す。",
  Socialiser: "この学習者は、他者と関わり、社会的なつながりを作ること自体を目的として動く傾向がある。他者を助けるためではなく、関わりそのものに関心がある。\n書き方：主な推薦の理由では、他者との関わりや、学んだことが人とつながる形になる点を切り口にする。掲示板への投稿、他の学習者が解く問題を作る行動、他の学習者の投稿を見る行動では、その関わりを理由の中で明示する。自分の言葉で整理する行動や知識カードの復習では、学んだ内容が人に説明できる・共有できる形になるという点に触れる。",
  FreeSpirit: "この学習者は、外部からの統制なしに、自分を表現し、行動する自由を重視する傾向がある。システムの中で創造し、探索することを好み、システムの範囲そのものを変えようとはしない。\n書き方：主な推薦の理由では、学習者が自分で選び、自分のやり方で進められる点に触れる。復習では、対象や順序を自分で選んで進められる点に触れ、その選択の余地を切り口にする。新しい単元や題材を推薦する場合は、そこで初めて出会う考え方に触れ、探索として示す。",
  Player: "この学習者は、得られるもののために動く傾向がある。活動の種類によらず、システムの中で報酬を得ることを重視し、焦点は有能感ではなく外から得られる報酬にある。\n書き方：主な推薦の理由では、その行動で得られるもの（実績や知識カードなど、アプリに実在する獲得物）を目的の一文に挙げ、何が得られるかを具体的に示す。獲得物の蓄積が表示される場面（単元完了時の実績のまとめなど）や、知識カードが続けて得られる場面では、これまでの獲得に今回の行動が加わる形で書き、積み上がっていく様子を切り口にする。",
  Disruptor: "この学習者は、変化の引き金になることに動機づけられる傾向がある。システムの境界を試し、さらに押し広げようとする。混乱させること自体が目的ではなく、システムを改善する方向に働くこともある。\n書き方：主な推薦の理由では、受け身で用意された課題をこなす枠を超え、自分の手で新しいアプローチを試したり、学び方そのものを変えていける点に触れる。自分で問題を作る行動の推薦では、既存の問題を解く側から、新しい問題を生み出して仕組みを動かす側に回る点を書く。どの行動でも、これまでの当たり前とは違う角度から切り込める点や、変化を起こせる面白さを切り口にして書く。",
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
      promptContext: { kind: "single", type, definition: HEXAD_FRAMING_BLOCKS[type] },
      audit: { scores: { ...scores }, selectedType: type, top1Ties: ties, rouletteWeights: null, rouletteProbabilities: null },
    };
  }
  const drawn = selectRoulette(scores, random);
  return {
    condition, definitionVersion: HEXAD_DEFINITION_VERSION,
    promptContext: { kind: "single", type: drawn.type, definition: HEXAD_FRAMING_BLOCKS[drawn.type] },
    audit: { scores: { ...scores }, selectedType: drawn.type, top1Ties: [],
      rouletteWeights: drawn.weights, rouletteProbabilities: drawn.probabilities },
  };
}
