import type { LearningStep } from "../../../player/content.types";
import { bubbleSortComparisons, bubbleSortMainValues } from "../bubbleSort";
import { bubbleSortCode, type BubbleSortCodeLineId } from "./bubbleSortCode";
import {
  defineBubbleSortCodeMappingContent, executionStep, type BubbleSortCodeMappingCanvasState,
  type BubbleSortCodeMappingContent, type BubbleSortCodeVariables,
} from "./codeMapping.types";

/**
 * コード側フレームだけを構成する。盤面はフェーズ2のスナップショットを参照し、再実装しない。
 * フレームの並びと変数は、参照コードを実際に実行したときの行順・ローカル変数と一致させる
 * （内側・外側ループの脱出も含む。検証は CPython のトレースと突き合わせる）。
 * 比較のチェックポイントは、交換が起きる比較では交換行、起きない比較では条件行に置く。
 * 各周の終わりのチェックポイントは、内側ループを抜ける外側ループでない for-compare 行の
 * 最後の実行（脱出）に置き、完成のチェックポイントは外側ループの脱出に置く。
 */
function frames(): [LearningStep<BubbleSortCodeMappingCanvasState>, ...LearningStep<BubbleSortCodeMappingCanvasState>[]] {
  const result: LearningStep<BubbleSortCodeMappingCanvasState>[] = [];
  const values = bubbleSortMainValues;
  let reference = "initial";
  let vars: BubbleSortCodeVariables = { result: null, n: null, i: null, j: null };
  const snapshotVars = (): BubbleSortCodeVariables => ({
    ...vars,
    result: vars.result ? [...vars.result] : null,
  });
  const add = (id: string, lineId: BubbleSortCodeLineId, caption: string,
    captionKind: BubbleSortCodeMappingCanvasState["state"]["captionKind"], frameKind: "code" | "execution" = "code") => {
    result.push({ id, caption, canvas: {
      data: { kind: "bubble-sort-code-mapping", code: bubbleSortCode },
      state: { executionStepId: reference, execution: executionStep(reference).canvas, frameKind, captionKind, variables: snapshotVars() },
      highlights: [{ kind: "code-line", id: lineId }],
    } });
  };
  const checkpoint = (stepId: string, lineId: BubbleSortCodeLineId,
    captionKind: BubbleSortCodeMappingCanvasState["state"]["captionKind"]) => {
    reference = stepId;
    add(`execution-${stepId}`, lineId, executionStep(stepId).caption, captionKind, "execution");
  };

  add("define-function", "define-function", "数のリストを受け取り、並び替えたリストを返すbubble_sortを用意します。", "assignment");
  vars = { ...vars, result: [...values] };
  checkpoint("initial", "copy-values", "assignment");

  vars = { ...vars, n: values.length };
  add("count-values", "count-values", `resultの要素の個数を数えて、nに${values.length}を入れます。`, "assignment");

  // 比較は bubbleSort.ts の実行記録（参照コードと同じ手順）から周ごとにたどる。
  const comparisons = bubbleSortComparisons(values);
  const passes = [...new Set(comparisons.map(comparison => comparison.pass))];
  for (const pass of passes) {
    vars = { ...vars, i: pass - 1 };
    add(`for-pass-${pass - 1}`, "for-pass",
      pass === 1 ? "iに0を入れて、1周目を始めます。" : `iに${pass - 1}を入れて、${pass}周目を始めます。`, "structure");
    for (const comparison of comparisons.filter(candidate => candidate.pass === pass)) {
      vars = { ...vars, j: comparison.j };
      add(`for-compare-${pass}-${comparison.j}`, "for-compare",
        comparison.j === 0
          ? pass === 1 ? "jに0を入れて、左端のペアから比べ始めます。" : "jに0を入れて、左端のペアに戻ります。"
          : `jに${comparison.j}を入れて、比べる位置を1つ右へ進めます。`, "structure");
      if (comparison.swapped) {
        add(`if-larger-${pass}-${comparison.j}`, "if-larger",
          `${comparison.pair[0]} は ${comparison.pair[1]} より大きいので、入れ替える条件が成り立ちます。`, "evaluation");
        vars = { ...vars, result: [...comparison.after] };
        checkpoint(`compare-${pass}-${comparison.j}`, "swap-values", "assignment");
      } else {
        checkpoint(`compare-${pass}-${comparison.j}`, "if-larger", "evaluation");
      }
    }
    // 内側ループの脱出（for-compare 行の最後の実行）が、その周の確定ステップに対応する。
    checkpoint(`pass-end-${pass}`, "for-compare", "evaluation");
  }
  // 外側ループの脱出が完成ステップに対応する。
  checkpoint("complete", "for-pass", "evaluation");
  add("return-result", "return-result", "並び替えたresultを返します。", "structure");

  const [first, ...rest] = result;
  if (!first) throw new Error("Bubble-sort code mapping needs a frame");
  return [first, ...rest];
}

export const bubbleSortCodeMappingContent: BubbleSortCodeMappingContent =
  defineBubbleSortCodeMappingContent({
    version: 1, kind: "step-sequence", id: "bubble-sort-code-mapping", phase: 4, intervalMs: 3500,
    stageName: "動きとコードの対応", steps: frames(),
  });
