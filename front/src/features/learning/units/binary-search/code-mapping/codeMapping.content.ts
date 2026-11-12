import type { LearningStep } from "../../../player/content.types";
import {
  binarySearchMainTarget, binarySearchMainValues, binarySearchProbes,
} from "../binarySearch";
import { binarySearchCode, type BinarySearchCodeLineId } from "./binarySearchCode";
import {
  defineBinarySearchCodeMappingContent, executionStep, type BinarySearchCodeMappingCanvasState,
  type BinarySearchCodeMappingContent, type BinarySearchCodeVariables,
} from "./codeMapping.types";

/**
 * コード側フレームだけを構成する。盤面はフェーズ2のスナップショットを参照し、再実装しない。
 * フレームの並びと変数は、参照コードを実際に実行したときの行順・ローカル変数と一致させる
 * （検証は CPython のトレースと突き合わせる）。チェックポイントは各イテレーションの
 * mid 決定行を中心に、盤面がフェーズ2のステップへ切り替わる行に置く。
 * `else:` は CPython が行イベントを発しないため、変数を変えない説明フレームとして
 * elif の直後に分けて置く（穴掘り法フェーズ4の先例）。
 * 捨てた直後の確定した範囲は、次のイテレーションの while 行の実行（範囲の再評価）に
 * 対応づける。mid は次の代入まで最後の値を保持する（Python の実セマンティクス）。
 */
function frames(): [LearningStep<BinarySearchCodeMappingCanvasState>, ...LearningStep<BinarySearchCodeMappingCanvasState>[]] {
  const result: LearningStep<BinarySearchCodeMappingCanvasState>[] = [];
  const values = binarySearchMainValues;
  const target = binarySearchMainTarget;
  let reference = "introduce";
  let vars: BinarySearchCodeVariables = { lo: null, hi: null, mid: null };
  const add = (id: string, lineId: BinarySearchCodeLineId, caption: string,
    captionKind: BinarySearchCodeMappingCanvasState["state"]["captionKind"], frameKind: "code" | "execution" = "code") => {
    result.push({ id, caption, canvas: {
      data: { kind: "binary-search-code-mapping", code: binarySearchCode },
      state: { executionStepId: reference, execution: executionStep(reference).canvas, frameKind, captionKind, variables: { ...vars } },
      highlights: [{ kind: "code-line", id: lineId }],
    } });
  };
  const checkpoint = (stepId: string, lineId: BinarySearchCodeLineId,
    captionKind: BinarySearchCodeMappingCanvasState["state"]["captionKind"]) => {
    reference = stepId;
    add(`execution-${stepId}`, lineId, executionStep(stepId).caption, captionKind, "execution");
  };

  add("define-function", "define-function",
    `並んだ数のリストと探す値を受け取り、見つけた位置を返す binary_search を用意します。`, "structure");
  vars = { ...vars, lo: 0 };
  add("init-lo", "init-lo", "範囲の左端 lo に 0 を入れます。", "assignment");
  vars = { ...vars, hi: values.length - 1 };
  checkpoint("range-full", "init-hi", "assignment");

  // 比較は binarySearch.ts の実行記録（参照コードと同じ手順）からイテレーションごとにたどる。
  const probes = binarySearchProbes(values, target);
  probes.forEach((probe, index) => {
    const nth = index + 1;
    if (index === 0) {
      add(`while-range-${nth}`, "while-range", "範囲が残っている間、探索をくり返します。", "evaluation");
    } else {
      // 捨てた直後の確定した範囲は、while 行が新しい範囲で再評価されるこの実行に対応する。
      const settledSize = probe.hi - probe.lo + 1;
      const settledId = settledSize === 1
        ? "range-single"
        : `range-after-drop-${probes[index - 1].outcome === "drop-left" ? "left" : "right"}`;
      checkpoint(settledId, "while-range", "evaluation");
    }
    vars = { ...vars, mid: probe.mid };
    checkpoint(`probe-${nth}-mid`, "compute-mid", "assignment");
    add(`if-hit-${nth}`, "if-hit", probe.outcome === "hit"
      ? `真ん中の ${probe.value} は探す値と一致します。`
      : `真ん中の ${probe.value} は ${target} と一致しません。`, "evaluation");
    if (probe.outcome === "hit") {
      checkpoint("found", "return-mid", "structure");
    } else if (probe.outcome === "drop-left") {
      add(`elif-smaller-${nth}`, "elif-smaller",
        `${probe.value} は ${target} より小さいので、${target} は真ん中より右側にあります。`, "evaluation");
      vars = { ...vars, lo: probe.mid + 1 };
      checkpoint(`probe-${nth}-drop-left`, "drop-left", "assignment");
    } else {
      add(`elif-smaller-${nth}`, "elif-smaller",
        `${probe.value} は ${target} より小さいとは言えません。`, "evaluation");
      // else: は行イベントを持たないため、変数を変えない説明フレームを分けて置く。
      add(`else-larger-${nth}`, "else-larger",
        `残りの場合にあたるので、${target} は真ん中より左側にあります。`, "evaluation");
      vars = { ...vars, hi: probe.mid - 1 };
      checkpoint(`probe-${nth}-drop-right`, "drop-right", "assignment");
    }
  });

  const [first, ...rest] = result;
  if (!first) throw new Error("Binary-search code mapping needs a frame");
  return [first, ...rest];
}

export const binarySearchCodeMappingContent: BinarySearchCodeMappingContent =
  defineBinarySearchCodeMappingContent({
    version: 1, kind: "step-sequence", id: "binary-search-code-mapping", phase: 4, intervalMs: 3500,
    stageName: "動きとコードの対応", steps: frames(),
  });
