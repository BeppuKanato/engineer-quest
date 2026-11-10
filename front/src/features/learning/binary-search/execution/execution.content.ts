import { defineLearningContent, type LearningStep } from "../../player/content.types";
import {
  binarySearchMainTarget, binarySearchMainValues, binarySearchProbes, runBinarySearch, type BinarySearchProbe,
} from "../binarySearch";
import {
  validateBinarySearchExecutionCanvas,
  type BinarySearchCellStatus, type BinarySearchExecutionCanvasState, type BinarySearchExecutionContent,
} from "./execution.types";

/**
 * 基準データ §3 フェーズ2（11ステップ）。盤面は binarySearch.ts の実行記録
 * （契約 binary-search-v1 の比較列）から組み立て、手書きしない。
 * ステップIDは probe-<何回目の比較か>-<場面> とし、フェーズ3が場面として
 * 直接参照できる（例: range-after-drop-left は1回目の比較で左を捨てた直後の状態）。
 *
 * 基準データのステップ表ではステップ3・6・9・10のキャプションが2文になっており、
 * 教材指針の「1ステップ1文」と矛盾するため、意味を変えず1文へ圧縮した
 * （例: 「真ん中の数字を見ます。真ん中は 19 です」→「真ん中の 19 を見ます。」）。
 * 図の状態はステップ表どおりを厳密に再現する。圧縮の是非は PR で要確認とする。
 */
const values = binarySearchMainValues;
const target = binarySearchMainTarget;
const probes = binarySearchProbes(values, target);
const foundIndex = runBinarySearch(values, target);

// 主教材は「左を捨てる→右を捨てる→一致」の3回（基準データ §1）。形が変わったら教材データの誤りとして止める。
if (probes.length !== 3
  || probes[0].outcome !== "drop-left" || probes[1].outcome !== "drop-right" || probes[2].outcome !== "hit"
  || foundIndex !== probes[2].mid) {
  throw new Error("Main example must drop left, drop right, then hit in 3 probes");
}

function snapshot(
  state: Pick<BinarySearchExecutionCanvasState["state"], "lo" | "hi" | "mid" | "cells">,
  highlights: BinarySearchExecutionCanvasState["highlights"] = [],
): BinarySearchExecutionCanvasState {
  return {
    data: { kind: "binary-search-execution" },
    state: { values, target, ...state },
    highlights,
  };
}

/** 範囲の外を捨てた部分とし、範囲の中だけが候補として残る盤面。 */
function rangeCells(lo: number, hi: number): BinarySearchCellStatus[] {
  return values.map((_, index) => (index < lo || index > hi ? "discarded" : "in-range"));
}

/** 捨てた後に確定した範囲の盤面。残った範囲を remaining として示し、キャプションの「ここ」が図のどこか分かるようにする。 */
function settledRangeCells(lo: number, hi: number): BinarySearchCellStatus[] {
  return values.map((_, index) => (index < lo || index > hi ? "discarded" : "remaining"));
}

/**
 * 比較の盤面。droppedSide が無ければ「真ん中を見た」ところ、
 * あれば捨てた側（中央を除く）が範囲外へ切り替わったところ、
 * found なら真ん中が発見セルとして確定したところを表す。
 */
function probeCells(probe: BinarySearchProbe, droppedSide: "left" | "right" | null, found = false): BinarySearchCellStatus[] {
  return values.map((_, index) => {
    if (index < probe.lo || index > probe.hi) return "discarded";
    if (index === probe.mid) return found ? "found" : "center";
    if (droppedSide === "left" && index < probe.mid) return "discarded";
    if (droppedSide === "right" && index > probe.mid) return "discarded";
    return "in-range";
  });
}

const steps: LearningStep<BinarySearchExecutionCanvasState>[] = [
  {
    id: "introduce", caption: `数字が小さい順に並んでいることが前提の探し方で、${target} を探します。`,
    canvas: snapshot(
      { lo: null, hi: null, mid: null, cells: values.map(() => "in-range" as const) },
      [{ kind: "cell", id: foundIndex }],
    ),
  },
  {
    id: "range-full", caption: "まず、探す範囲は全体です。",
    canvas: snapshot({ lo: 0, hi: values.length - 1, mid: null, cells: rangeCells(0, values.length - 1) }),
  },
];
probes.forEach((probe, index) => {
  const nth = index + 1;
  const midCaption = probe.lo === probe.hi
    ? `その 1 個の ${probe.value} を見ます。`
    : index === 0
      ? `真ん中の ${probe.value} を見ます。`
      : `新しい真ん中の ${probe.value} を見ます。`;
  steps.push({
    id: `probe-${nth}-mid`, caption: midCaption,
    canvas: snapshot({ lo: probe.lo, hi: probe.hi, mid: probe.mid, cells: probeCells(probe, null) }),
  });
  if (probe.outcome === "hit") {
    steps.push({
      id: "found",
      caption: `${target} が、左から ${probe.mid + 1} 番目（インデックス ${probe.mid}）に見つかりました。`,
      canvas: snapshot(
        { lo: probe.lo, hi: probe.hi, mid: probe.mid, cells: probeCells(probe, null, true) },
        [{ kind: "cell", id: probe.mid }],
      ),
    });
    return;
  }
  const side = probe.outcome === "drop-left" ? "left" : "right";
  steps.push({
    id: `probe-${nth}-drop-${side}`,
    caption: side === "left"
      ? `${probe.value} は ${target} より小さいので、左側には ${target} はありません。`
      : `${probe.value} は ${target} より大きいので、右側には ${target} はありません。`,
    canvas: snapshot({ lo: probe.lo, hi: probe.hi, mid: probe.mid, cells: probeCells(probe, side) }),
  });
  // 捨てた直後の確定した範囲は、次の比較の範囲（probes の次の記録）で表す。
  const next = probes[index + 1];
  const settledSize = next.hi - next.lo + 1;
  steps.push({
    id: settledSize === 1 ? "range-single" : `range-after-drop-${side}`,
    caption: settledSize === 1 ? "残った範囲は 1 個だけです。" : "残った範囲はここだけです。",
    canvas: snapshot({ lo: next.lo, hi: next.hi, mid: null, cells: settledRangeCells(next.lo, next.hi) }),
  });
});
const lastProbe = probes[probes.length - 1];
steps.push({
  id: "summary", caption: `見るたびに範囲が半分になり、${probes.length} 回で見つかりました。`,
  canvas: snapshot({ lo: lastProbe.lo, hi: lastProbe.hi, mid: null, cells: probeCells(lastProbe, null, true) }),
});

const sequence = defineLearningContent<BinarySearchExecutionCanvasState>({
  version: 1, kind: "step-sequence", id: "binary-search-execution", phase: 2, intervalMs: 3500,
  steps: steps as [LearningStep<BinarySearchExecutionCanvasState>, ...LearningStep<BinarySearchExecutionCanvasState>[]],
}, validateBinarySearchExecutionCanvas);

export const binarySearchExecutionContent: BinarySearchExecutionContent = {
  ...sequence, stageName: "動きの説明",
};
