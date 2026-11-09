import type { LearningContent } from "../../player/content.types";
import type { VocabularyEntry } from "../../bfs/motivation/motivation.types";

/**
 * フェーズ1の Canvas は場面ごとに3種の図を持つ（基準データ §3 フェーズ1）。
 * - array: 主教材の数字。場面1だけは同じ数字を並び替えて「並んでいない」状態を示し（Issue #329）、
 *   それ以外の場面は小さい順に並んだ主教材そのもの。描画は共通配列基盤（player の ArrayDrawing）へ委譲する。
 * - guess: 1〜100 の数当てゲームの候補の帯。真ん中を聞いて片側を捨てた状態を表す。
 * - halving: 候補の数が半分ずつ減っていく件数の列。
 * 配列上の状態語彙（探索範囲・中央・範囲外）はフェーズ2の盤面型で扱い、
 * フェーズ1の図は「探す値の強調」と数当ての帯に絞る（基準データ §0）。
 * 出口の形は BFS・バブルソート フェーズ1の仕組みに合わせる（{ label, nextPhase }）。
 */
export type BinarySearchMotivationVisual =
  | {
      readonly kind: "array";
      /** 並べる数字。order が "sorted" の場面では主教材の小さい順の配列、そのままの順で並べる。 */
      readonly values: readonly number[];
      /**
       * 並び方。"sorted" は小さい順（この単元の探索の前提）。
       * "unsorted" は場面1専用で、並んでいないから端から順に見るしかないことを示す（Issue #329 の決定）。
       */
      readonly order: "sorted" | "unsorted";
      /** 探す値。この場面で探す対象を示さない場合は null。 */
      readonly target: number | null;
    }
  | {
      readonly kind: "guess";
      /** 候補全体の範囲（両端含む）。 */
      readonly low: number;
      readonly high: number;
      /** いま真ん中として聞いた数。まだ聞いていない場面では null。 */
      readonly asked: number | null;
      /** 答えの後に残った候補の範囲（両端含む）。答えが返る前は null。 */
      readonly remaining: readonly [number, number] | null;
    }
  | {
      readonly kind: "halving";
      /** 半分に絞るたびの候補の数。最後は 1 になる。 */
      readonly counts: readonly number[];
    };

export type BinarySearchMotivationCanvasState = {
  readonly data: { readonly kind: "binary-search-motivation" };
  readonly state: {
    readonly visual: BinarySearchMotivationVisual;
    readonly exit: { label: string; nextPhase: 2 } | null;
  };
  /** array の場面で「探す値」のマスを示す強調。それ以外の場面では空にする。 */
  readonly highlights: readonly { kind: "cell"; id: number }[];
};

export type BinarySearchMotivationContent = LearningContent<BinarySearchMotivationCanvasState> & {
  readonly stageName: "導入";
  readonly vocabulary: readonly VocabularyEntry[];
};

export function validateBinarySearchMotivationCanvas(canvas: BinarySearchMotivationCanvasState): void {
  if (canvas.data.kind !== "binary-search-motivation") {
    throw new Error("Unknown binary search motivation canvas kind");
  }
  const { visual, exit } = canvas.state;
  if (exit !== null) {
    if (!exit.label.trim() || exit.nextPhase !== 2) {
      throw new Error("Motivation exit must name phase 2");
    }
    // 出口は落ち着いた場面でのみ出す。数当ての途中（聞いて絞り込んだ直後）の場面には置かない。
    if (visual.kind === "guess" && (visual.asked !== null || visual.remaining !== null)) {
      throw new Error("Motivation exit requires a settled board");
    }
  }

  if (visual.kind === "array") {
    const { values, order, target } = visual;
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("Array scene needs at least one value");
    }
    values.forEach((value, index) => {
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`Array value must be a finite, non-negative number: index ${index}`);
      }
    });
    if (order === "sorted") {
      // 探索の前提は「小さい順に並んでいる」こと。前提を担う場面で並んでいない配列は教材データの誤りとして弾く。
      values.forEach((value, index) => {
        if (index > 0 && value <= values[index - 1]) {
          throw new Error("Array scene values must be in ascending order");
        }
      });
    } else {
      // 並んでいない場面（場面1）は、同じ値の重複があると「探す値」のマスが一意に決まらないため弾く。
      if (new Set(values).size !== values.length) {
        throw new Error("Unsorted array scene values must be distinct");
      }
      // 小さい順に並んでしまっている配列は「並んでいない」場面として成立しない。
      if (values.every((value, index) => index === 0 || value > values[index - 1])) {
        throw new Error("Unsorted array scene must not be in ascending order");
      }
    }
    if (target !== null && !values.includes(target)) {
      throw new Error("Target must be one of the values");
    }
    // 強調は「探す値」のマスだけを指す。探す値が無い場面では強調も無い。
    const expected = target === null ? [] : [values.indexOf(target)];
    const actual = canvas.highlights.map((highlight) => highlight.id);
    if (canvas.highlights.some((highlight) => highlight.kind !== "cell")
      || actual.length !== expected.length
      || actual.some((id, index) => id !== expected[index])) {
      throw new Error("Array scene highlights must point at the target cell only");
    }
    return;
  }

  if (canvas.highlights.length > 0) {
    throw new Error("Highlights belong to array scenes only");
  }

  if (visual.kind === "guess") {
    const { low, high, asked, remaining } = visual;
    if (!Number.isInteger(low) || !Number.isInteger(high) || low < 1 || high < low) {
      throw new Error("Guess range is invalid");
    }
    if (asked !== null && (!Number.isInteger(asked) || asked < low || asked > high)) {
      throw new Error("Asked number must be inside the guess range");
    }
    if (asked === null && remaining !== null) {
      throw new Error("Remaining range needs an asked number first");
    }
    if (remaining !== null) {
      const [restLow, restHigh] = remaining;
      if (!Number.isInteger(restLow) || !Number.isInteger(restHigh)
        || restLow < low || restHigh > high || restLow > restHigh) {
        throw new Error("Remaining range must stay inside the guess range");
      }
      // 残った範囲は、聞いた数自身を含まず、その片側だけに寄っていなければならない。
      if (asked !== null && restLow <= asked && asked <= restHigh) {
        throw new Error("Remaining range must exclude the asked number");
      }
      if (asked !== null && restLow < asked && restHigh > asked) {
        throw new Error("Remaining range must be on one side of the asked number");
      }
    }
    return;
  }

  const { counts } = visual;
  if (!Array.isArray(counts) || counts.length < 2) {
    throw new Error("Halving scene needs at least two counts");
  }
  counts.forEach((count, index) => {
    if (!Number.isInteger(count) || count < 1) {
      throw new Error("Halving counts must be positive integers");
    }
    if (index > 0 && count !== Math.ceil(counts[index - 1] / 2)) {
      throw new Error("Halving counts must halve (rounding up) each step");
    }
  });
  if (counts[counts.length - 1] !== 1) {
    throw new Error("Halving counts must end at 1");
  }
}
