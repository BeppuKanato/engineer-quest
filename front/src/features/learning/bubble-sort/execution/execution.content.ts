import { defineLearningContent, type LearningStep } from "../../player/content.types";
import {
  bubbleSortComparisons, bubbleSortMainValues, runBubbleSort,
} from "../bubbleSort";
import {
  validateBubbleSortExecutionCanvas, type BubbleSortExecutionCanvasState, type BubbleSortExecutionContent,
} from "./execution.types";

/**
 * 基準データ §3 フェーズ2。配列は bubbleSort.ts の実行記録（契約 bubble-sort-v1 と
 * 同じ手順の比較列）から組み立て、手書きしない。ステップIDは
 * compare-<何周目>-<比べる位置 j> / pass-end-<何周目> とし、フェーズ3が
 * 場面として直接参照できる（例: compare-1-1 は1周目の2回目の比較まで終えた状態）。
 */
const values = bubbleSortMainValues;
const comparisons = bubbleSortComparisons(values);
const sorted = runBubbleSort(values);

/** 各周の終わりに、その周で確定する値を指すキャプション（周の数と同数だけ必要）。 */
const passEndCaptions: readonly string[] = [
  "一番大きい 5 が、右端に決まりました。",
  "次に大きい 4 が、5 の左隣に決まりました。",
  "3 が、4 の左隣に決まりました。",
  "2 が、3 の左隣に決まりました。",
];
const passCount = comparisons.at(-1)!.pass;
if (passEndCaptions.length !== passCount) throw new Error("Pass-end captions must cover every pass");

function snapshot(
  stepValues: readonly number[],
  comparing: readonly [number, number] | null,
  fixedFrom: number,
  swappedPair: readonly [number, number] | null,
): BubbleSortExecutionCanvasState {
  return {
    data: { kind: "array-bars" },
    state: { values: stepValues, comparing, fixedFrom },
    highlights: swappedPair === null ? [] : swappedPair.map((id) => ({ kind: "cell" as const, id })),
  };
}

const steps: LearningStep<BubbleSortExecutionCanvasState>[] = [
  {
    id: "initial", caption: "5つの数が、バラバラに並んでいます。",
    canvas: snapshot(values, null, values.length, null),
  },
];
comparisons.forEach((comparison, index) => {
  const pair: readonly [number, number] = [comparison.j, comparison.j + 1];
  steps.push({
    id: `compare-${comparison.pass}-${comparison.j}`,
    caption: `${comparison.pair[0]} と ${comparison.pair[1]} を比べて、${comparison.swapped ? "入れ替えます" : "そのままにします"}。`,
    // その周の間は、まだ確定した範囲はない（確定は周の終わりのステップで示す）。
    canvas: snapshot(comparison.after, pair, values.length - (comparison.pass - 1), comparison.swapped ? pair : null),
  });
  const isLastOfPass = index === comparisons.length - 1 || comparisons[index + 1].pass !== comparison.pass;
  if (isLastOfPass) {
    steps.push({
      id: `pass-end-${comparison.pass}`,
      caption: passEndCaptions[comparison.pass - 1],
      canvas: snapshot(comparison.after, null, values.length - comparison.pass, null),
    });
  }
});
steps.push({
  id: "complete", caption: "並び替えが完成しました。",
  canvas: snapshot(sorted, null, 0, null),
});

const sequence = defineLearningContent<BubbleSortExecutionCanvasState>({
  version: 1, kind: "step-sequence", id: "bubble-sort-execution", phase: 2, intervalMs: 3500,
  steps: steps as [LearningStep<BubbleSortExecutionCanvasState>, ...LearningStep<BubbleSortExecutionCanvasState>[]],
}, validateBubbleSortExecutionCanvas);

export const bubbleSortExecutionContent: BubbleSortExecutionContent = {
  ...sequence, stageName: "動きの説明",
};
