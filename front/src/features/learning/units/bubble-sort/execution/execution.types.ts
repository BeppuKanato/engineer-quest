import type { LearningContent } from "../../../player/content.types";
import { validateArrayBarsCanvas, type ArrayBarsCanvasState } from "../../../player/arrayBars.types";

/**
 * フェーズ2の Canvas は共通配列基盤の型をそのまま使う（基準データ §4 の共通化）。
 * 各ステップは操作直後の完全なスナップショットで、比較ステップでは comparing に
 * そのステップで比べたペア、highlights に入れ替わった2マスだけを置く。
 * 比べていない場面（初期・各周の確定・完成）では highlights を置かない。
 * フェーズ3は step.id と canvas を直接参照し、フェーズ4は同じスナップショットへ
 * コード対応を付加する。表示や再生順から生成過程を逆算しない。
 */
export type BubbleSortExecutionCanvasState = ArrayBarsCanvasState;

export type BubbleSortExecutionContent = LearningContent<BubbleSortExecutionCanvasState> & {
  readonly stageName: "動きの説明";
};

export function validateBubbleSortExecutionCanvas(canvas: BubbleSortExecutionCanvasState): void {
  validateArrayBarsCanvas(canvas);
  const { comparing } = canvas.state;
  const highlightedIds = canvas.highlights.map((highlight) => highlight.id);
  if (comparing === null) {
    // 比較の外の場面に「入れ替わった2マス」はない。
    if (highlightedIds.length !== 0) throw new Error("Execution highlights require a comparing pair");
    return;
  }
  // highlight は比べたペアそのもの（入れ替わった2マス）に限る。
  if (highlightedIds.length !== 0 &&
    (highlightedIds.length !== 2 || highlightedIds[0] !== comparing[0] || highlightedIds[1] !== comparing[1])) {
    throw new Error("Execution highlights must be exactly the compared pair");
  }
}
