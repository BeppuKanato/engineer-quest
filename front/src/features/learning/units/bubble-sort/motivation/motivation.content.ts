import { defineLearningContent } from "../../../player/content.types";
import {
  bubbleSortComparisons, bubbleSortMainValues, runBubbleSort,
} from "../bubbleSort";
import {
  validateBubbleSortMotivationCanvas, type BubbleSortMotivationCanvasState, type BubbleSortMotivationContent,
} from "./motivation.types";

/**
 * 基準データ §3 フェーズ1。場面の配列は §1 の検証済みトレース（主教材 [4, 2, 5, 1, 3]）から組み立てる。
 * 用語（バブルソート）はフェーズ1では出さず、名称付けは後続フェーズに置く。
 */
const comparisons = bubbleSortComparisons(bubbleSortMainValues);
const afterFirstSwap = comparisons[0].after; // 1周目 j=0: (4, 2) を交換して [2, 4, 5, 1, 3]
const afterFiveMoves = comparisons[2].after; // 1周目 j=2: (5, 1) を交換して [2, 4, 1, 5, 3]
const afterFirstPass = comparisons[3].after; // 1周目おわり: [2, 4, 1, 3, 5]（5 が右端に確定）
const sorted = runBubbleSort(bubbleSortMainValues); // [1, 2, 3, 4, 5]

function scene(
  values: readonly number[],
  state: Partial<BubbleSortMotivationCanvasState["state"]> = {},
  highlights: BubbleSortMotivationCanvasState["highlights"] = [],
): BubbleSortMotivationCanvasState {
  return {
    data: { kind: "array-bars" },
    state: { values, comparing: null, fixedFrom: values.length, exit: null, ...state },
    highlights,
  };
}

const sequence = defineLearningContent<BubbleSortMotivationCanvasState>({
  version: 1, kind: "step-sequence", id: "bubble-sort-motivation", phase: 1, intervalMs: 3500,
  steps: [
    {
      id: "scrambled-start", caption: "ゲームのスコアを、小さい順に並べ替えたい場面があります。",
      canvas: scene(bubbleSortMainValues),
    },
    {
      id: "sorted-goal", caption: "目指すのは、このように小さい順にきれいに並んだ状態です。",
      canvas: scene(sorted),
    },
    {
      id: "compare-first", caption: "並べ替え方は、隣同士を比べて、左が大きければ入れ替えるだけです。",
      canvas: scene(bubbleSortMainValues, { comparing: [0, 1] }),
    },
    {
      id: "first-swap", caption: "4 と 2 を比べると、左の 4 が大きいので入れ替わりました。",
      canvas: scene(afterFirstSwap, {}, [{ kind: "cell", id: 0 }, { kind: "cell", id: 1 }]),
    },
    {
      id: "five-moves-right", caption: "5 と 1 を比べて入れ替わると、大きな 5 が右へ動きました。",
      canvas: scene(afterFiveMoves, {}, [{ kind: "cell", id: 2 }, { kind: "cell", id: 3 }]),
    },
    {
      id: "first-pass-end", caption: "1周すると、一番大きい 5 が右端に決まります。",
      canvas: scene(afterFirstPass, { fixedFrom: 4 }),
    },
    {
      id: "complete-and-exit", caption: "残りの範囲も同じことをくり返すと、全体が小さい順に並びます。",
      canvas: scene(sorted, { fixedFrom: 0, exit: { label: "動きの説明へ進む", nextPhase: 2 } }),
    },
  ],
}, validateBubbleSortMotivationCanvas);

export const bubbleSortMotivationContent: BubbleSortMotivationContent = {
  ...sequence, stageName: "導入",
  vocabulary: [
    { concept: "compare", everyday: "比べる", technical: "比較", firstStepId: "compare-first", usage: "隣同士の大小を確かめる操作。フェーズ1では日常語のまま使い、記号では表さない。" },
    { concept: "swap", everyday: "入れ替える", technical: "交換", firstStepId: "first-swap", usage: "2つの値の位置を取り替える操作。「比べる」とセットで使い、条件は左の方が大きいこと。" },
  ],
};

for (const entry of bubbleSortMotivationContent.vocabulary) {
  if (!sequence.steps.some((step) => step.id === entry.firstStepId)) throw new Error("Unknown vocabulary introduction step");
}
