import type { LearningContent } from "../../player/content.types";

/**
 * 二分探索の盤面型（基準データ §4）。フェーズ2で定義し、フェーズ3〜7と
 * トレース変換が同じスナップショットを再利用する。以後のフェーズは
 * step.id と canvas を直接参照する（表示や再生順から探索過程を逆算しない）。
 *
 * セル状態は単元側の語彙で持つ。
 * - discarded: 範囲外（捨てた部分）。もう答えの候補ではない。
 * - in-range: 探索範囲の中にあり、まだ候補として残っている。
 * - center: いま見ている真ん中（中央）。
 * - found: 探す値が見つかった位置（確定）。
 * 描画は共通配列基盤へ委譲し、色はプレイヤートークンへ写す
 * （discarded＝完了グレー相当、in-range＝未処理の白、center と found＝処理中の青。
 * found は中央と区別するため強調リングを重ねる）。
 *
 * lo / hi / mid はそのステップ時点の探索変数（範囲は両端含む）。
 * 範囲を示す前（導入ステップ）だけ lo / hi / mid をすべて null にする。
 * 捨てるステップでは、捨てた側のセル（中央を除く）が先に discarded になり、
 * lo / hi の更新は次の「残った範囲」のステップで表す（1ステップ1変化）。
 */
export type BinarySearchCellStatus = "discarded" | "in-range" | "center" | "found";

export type BinarySearchExecutionCanvasState = {
  readonly data: { readonly kind: "binary-search-execution" };
  readonly state: {
    /** 小さい順に並んだ数字。左から右へ位置（インデックス）0, 1, 2, ... と数える。 */
    readonly values: readonly number[];
    /** 探す値。フェーズ2は主教材の発見ケースだけを扱うため、必ず values の中にある。 */
    readonly target: number;
    /** 探索範囲の左端と右端（両端含む）。範囲提示前は null。 */
    readonly lo: number | null;
    readonly hi: number | null;
    /** いま見ている（直前に見た）真ん中の位置。見ていないステップでは null。 */
    readonly mid: number | null;
    /** 位置ごとのセル状態。values と同じ長さで、位置の順に並ぶ。 */
    readonly cells: readonly BinarySearchCellStatus[];
  };
  /** 強調は「探す値の提示（範囲提示前）」と「発見セルの確定」だけに使う。 */
  readonly highlights: readonly { kind: "cell"; id: number }[];
};

export type BinarySearchExecutionContent = LearningContent<BinarySearchExecutionCanvasState> & {
  readonly stageName: "動きの説明";
};

const cellStatuses: readonly string[] = ["discarded", "in-range", "center", "found"];

/** 型付き教材の参照整合性をロード時に検証し、不正な盤面を黙って再生しない。 */
export function validateBinarySearchExecutionCanvas(canvas: BinarySearchExecutionCanvasState): void {
  if (canvas.data.kind !== "binary-search-execution") {
    throw new Error("Unknown binary search execution canvas kind");
  }
  const { values, target, lo, hi, mid, cells } = canvas.state;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Binary search board needs at least one value");
  }
  values.forEach((value, index) => {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Board value must be a finite, non-negative number: index ${index}`);
    }
    // この単元の前提は「小さい順に並んでいる」こと。並んでいない配列は教材データの誤りとして弾く。
    if (index > 0 && value <= values[index - 1]) {
      throw new Error("Board values must be in ascending order");
    }
  });
  if (!values.includes(target)) {
    throw new Error("Target must be one of the values in phase 2");
  }
  if (!Array.isArray(cells) || cells.length !== values.length) {
    throw new Error("Cells must cover every position");
  }
  cells.forEach((status, index) => {
    if (!cellStatuses.includes(status)) throw new Error(`Unknown cell status: index ${index}`);
  });

  const centers = cells.flatMap((status, index) => (status === "center" ? [index] : []));
  const founds = cells.flatMap((status, index) => (status === "found" ? [index] : []));
  if (centers.length > 1) throw new Error("At most one center cell");
  if (founds.length > 1) throw new Error("At most one found cell");
  if (founds.length === 1 && values[founds[0]] !== target) {
    throw new Error("Found cell must hold the target value");
  }

  if (lo === null || hi === null) {
    // 範囲提示前の盤面では、範囲も中央もまだ無い。
    if (lo !== null || hi !== null || mid !== null) {
      throw new Error("Range must be introduced as a whole (lo, hi, mid are null together)");
    }
    if (cells.some((status) => status !== "in-range")) {
      throw new Error("Before the range is introduced every cell is in-range");
    }
  } else {
    if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < 0 || hi >= values.length || lo > hi) {
      throw new Error(`Range out of board: ${lo}..${hi}`);
    }
    if (mid !== null && (!Number.isInteger(mid) || mid < lo || mid > hi)) {
      throw new Error(`Mid must stay inside the range: ${mid}`);
    }
    // 中央セルと mid は一致させる。発見時は mid がそのまま発見位置を指す。
    if (centers.length === 1 && mid !== centers[0]) {
      throw new Error("Center cell must be the mid position");
    }
    if (mid !== null && founds.length === 0 && cells[mid] !== "center") {
      throw new Error("Mid position must be the center cell");
    }
    if (founds.length === 1 && mid !== null && mid !== founds[0]) {
      throw new Error("Mid must point at the found cell once found");
    }
    // 範囲の外はすべて捨てた部分になる。
    cells.forEach((status, index) => {
      if ((index < lo || index > hi) && status !== "discarded") {
        throw new Error(`Cell outside the range must be discarded: index ${index}`);
      }
    });
    // 範囲の中で捨てられるのは、中央の片側だけ（捨てるステップの途中経過）。
    // 中央がいない確定済みの盤面では、範囲の中に捨てたセルは残らない。
    const droppedInside = cells.flatMap((status, index) =>
      status === "discarded" && index >= lo && index <= hi ? [index] : []);
    if (droppedInside.length > 0) {
      if (mid === null) throw new Error("Dropped cells inside the range require a mid position");
      const onLeft = droppedInside.every((index) => index < mid!);
      const onRight = droppedInside.every((index) => index > mid!);
      if (!onLeft && !onRight) throw new Error("Dropped cells inside the range must stay on one side of mid");
      // 捨てた部分は範囲の端から中央へ連続する（飛び飛びに捨てることはない）。
      if (onLeft && droppedInside.some((index, order) => index !== lo + order)) {
        throw new Error("Dropped cells must continue from the range edge");
      }
      if (onRight && droppedInside.some((index, order) => index !== hi - (droppedInside.length - 1 - order))) {
        throw new Error("Dropped cells must continue from the range edge");
      }
    }
  }

  const highlighted = new Set<number>();
  for (const highlight of canvas.highlights) {
    if (highlight.kind !== "cell" || !Number.isInteger(highlight.id) || highlight.id < 0 || highlight.id >= values.length) {
      throw new Error(`Unknown board highlight: ${highlight.id}`);
    }
    if (highlighted.has(highlight.id)) throw new Error(`Duplicate highlight: ${highlight.id}`);
    highlighted.add(highlight.id);
    // 強調は発見セルの確定か、範囲提示前に探す値を示す場合だけに限る。
    const isFound = cells[highlight.id] === "found";
    const isIntroducedTarget = lo === null && values[highlight.id] === target;
    if (!isFound && !isIntroducedTarget) {
      throw new Error("Highlights are limited to the found cell or the introduced target");
    }
  }
}
