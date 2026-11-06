/**
 * 配列（棒）用の Canvas（GraphDrawing / MazeGridDrawing に対する配列版）。
 * 正本: docs/concept/bubble-sort-unit-baseline.md §4、docs/concept/learning-player-ui.md §2。
 * 状態は「値そのもの」と意味のある範囲（比べているペア・確定済みの右端）だけを持ち、
 * 教材データへ色の HEX 値は持ち込まない（意味は描画側が playerTokens へ変換する）。
 * 棒の高さで表せるよう、値は有限な非負数に限る。
 */
export type ArrayBarsCanvasState = {
  readonly data: {
    readonly kind: "array-bars";
  };
  readonly state: {
    /** 並べ替えの対象。左から右へ位置（インデックス）0, 1, 2, ... と数える。 */
    readonly values: readonly number[];
    /** 今まさに比べている隣同士のペア [左の位置, 右の位置]。比べていない場面では null。 */
    readonly comparing: readonly [number, number] | null;
    /** この位置以上は並び順が確定済み。values.length なら未確定のみ、0 なら全て確定。 */
    readonly fixedFrom: number;
  };
  readonly highlights: readonly { kind: "cell"; id: number }[];
};

/** 型付き教材の参照整合性をロード時に検証し、不正な配列を黙って再生しない。 */
export function validateArrayBarsCanvas(canvas: ArrayBarsCanvasState): void {
  if (canvas.data.kind !== "array-bars") throw new Error("Unknown array bars canvas kind");
  const { values, comparing, fixedFrom } = canvas.state;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Array bars need at least one value");
  }
  values.forEach((value, index) => {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Array value must be a finite, non-negative number: index ${index}`);
    }
  });
  if (!Number.isInteger(fixedFrom) || fixedFrom < 0 || fixedFrom > values.length) {
    throw new Error(`fixedFrom out of range: ${fixedFrom}`);
  }
  if (comparing !== null) {
    if (!Array.isArray(comparing) || comparing.length !== 2) {
      throw new Error("Comparing must be a pair of positions");
    }
    const [left, right] = comparing;
    if (!Number.isInteger(left) || !Number.isInteger(right) || right !== left + 1) {
      throw new Error("Comparing must be an adjacent pair");
    }
    if (left < 0 || right >= values.length) {
      throw new Error(`Comparing out of range: ${left},${right}`);
    }
    // 確定済みの範囲はもう比べない。ペア全体が未確定範囲に収まらなければならない。
    if (right >= fixedFrom) {
      throw new Error("Comparing must stay inside the unfixed range");
    }
  }
  const highlighted = new Set<number>();
  for (const highlight of canvas.highlights) {
    if (highlight.kind !== "cell" || !Number.isInteger(highlight.id) || highlight.id < 0 || highlight.id >= values.length) {
      throw new Error(`Unknown array highlight: ${highlight.id}`);
    }
    if (highlighted.has(highlight.id)) throw new Error(`Duplicate highlight: ${highlight.id}`);
    highlighted.add(highlight.id);
  }
}
