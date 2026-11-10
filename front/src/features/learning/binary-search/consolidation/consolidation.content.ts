import { validateAssessment} from "../../assessment/assessment";
import { validateArrayBarsCanvas, type ArrayBarsCanvasState} from "../../player/arrayBars.types";
import type { PlayerStatus} from "../../player/player.tokens";
import { getLearningStep} from "../../review/reviewContent";
import {
binarySearchMainTarget, binarySearchMainValues, binarySearchProbes, binarySearchTransferTarget,
binarySearchTransferValues, runBinarySearch,
} from "../binarySearch";
import { binarySearchCode, type BinarySearchCodeLineId} from "../code-mapping/binarySearchCode";
import { binarySearchCodeMappingContent} from "../code-mapping/codeMapping.content";
import {
validateBinarySearchExecutionCanvas, type BinarySearchCellStatus, type BinarySearchExecutionCanvasState,
} from "../execution/execution.types";
import type { BinarySearchConsolidationContent} from "./consolidation.types";

/**
* 基準データ §3 フェーズ6（転移タップ・不在の選択・Parsons・前提の選択の4問）。
* 正解はすべて実行記録（binarySearch.ts の probes / runBinarySearch）から導く。
* 場面は共通配列基盤の形で持つ（不在ケースと未整列リストは単元盤面型の
* 検証を満たさないため）。Q1 の場面は単元盤面型の開始スナップショットを
* 検証してから、フェーズ2・3と同じ写像で共通基盤の形へ変換する。
* 復習先はすべてフェーズ4（コードとの対応）のフレームで、
* 新しいリストの答え合わせは作らない（教材指針フェーズ6の割り切り仕様）。
*/
const cellStatusToPlayerStatus: Record<BinarySearchCellStatus, PlayerStatus> = {
discarded: "completed",
"in-range": "idle",
remaining: "queued",
center: "processing",
found: "processing",
};

// Q1: 転移リストの開始状態（範囲は全体、まだ真ん中は見ていない）。
const transferProbes = binarySearchProbes(binarySearchTransferValues, binarySearchTransferTarget);
const transferFirst = transferProbes[0];
const transferOpening: BinarySearchExecutionCanvasState = {
data: { kind: "binary-search-execution"},
state: {
values: binarySearchTransferValues, target: binarySearchTransferTarget,
lo: transferFirst.lo, hi: transferFirst.hi, mid: null,
cells: binarySearchTransferValues.map(() => "in-range" as const),
},
highlights: [],
};
validateBinarySearchExecutionCanvas(transferOpening);
const transferScene: ArrayBarsCanvasState = {
data: { kind: "array-bars"},
state: {
values: transferOpening.state.values, comparing: null, fixedFrom: transferOpening.state.values.length,
cellStatuses: transferOpening.state.cells.map((status) => cellStatusToPlayerStatus[status]),
},
highlights: [],
};
const transferIds = binarySearchTransferValues.map((_, index) => String(index));

// Q2: 不在ケースの最後の比較の状態（最後の1個まで絞ったところ）。
// 探す値 20 は盤面に無いため単元盤面型では表せず、実行記録から状態を組み立てる。
const absentTarget = 20;
const absentProbes = binarySearchProbes(binarySearchMainValues, absentTarget);
const absentLast = absentProbes[absentProbes.length - 1];
const absentScene: ArrayBarsCanvasState = {
data: { kind: "array-bars"},
state: {
values: binarySearchMainValues, comparing: null, fixedFrom: binarySearchMainValues.length,
cellStatuses: binarySearchMainValues.map((_, index) => (index === absentLast.mid? "processing" as const: "completed" as const)),
},
highlights: [],
};

// Q4: 並んでいないリスト。真ん中と比べて片側を捨てる判断が前提を失う場面。
const unsortedValues: readonly number[] = [25, 3, 42, 7, 19];
const unsortedTarget = 7;
const unsortedScene: ArrayBarsCanvasState = {
data: { kind: "array-bars"},
state: { values: unsortedValues, comparing: null, fixedFrom: unsortedValues.length},
highlights: [],
};

// Q3: Parsons は参照コード12行から、繰り返しの中の流れを担う主要8行に絞る。
// 外したのは初期化の2行（範囲の両端は盤面の前提として別途確認済み）と、
// elif 側と対称な else 側の2行（捨てる判断は左側で代表させる）。
// 残した8行はすべて順序が意味を持ち、順序自由な行はない。
const parsonsLineIds: readonly BinarySearchCodeLineId[] = [
"define-function", "while-range", "compute-mid", "if-hit",
"return-mid", "elif-smaller", "drop-left", "return-missing",
];
const [firstFrame,...remainingFrames] = binarySearchCodeMappingContent.steps;

export const binarySearchConsolidationContent: BinarySearchConsolidationContent = {
version: 1, kind: "diagnostic-check", id: "binary-search-consolidation", phase: 6, stageName: "応用問題",
code: binarySearchCode,
reviewLabel: "💡 基本例の動き・コードをもう一度見る",
completion: "理解の状況が確認できました。それでは【自分で実装】に進み、自分の手でコードを完成させましょう！",
questions: [
{
kind: "node", id: "first-center-transfer",
prompt: `新しいリスト [${binarySearchTransferValues.join(", ")}] で ${binarySearchTransferTarget} を探すとき、最初に調べる真ん中のマスはどれか`,
scene: transferScene,
nodeIds: transferIds, allowNone: false,
correctAnswer: { kind: "node", nodeId: String(transferFirst.mid)}, requires: null,
stepId: "execution-probe-1-mid",
reviewStepIds: ["execution-range-full", "execution-probe-1-mid", "execution-range-after-drop-left", "execution-probe-2-mid"],
tags: ["新しいリストでの真ん中の位置"],
instruction: "配列のマスをタップして答える",
correctFeedback: `正解。範囲は全体（左端が位置 ${transferFirst.lo}、右端が位置 ${transferFirst.hi}）なので、真ん中は (${transferFirst.lo} + ${transferFirst.hi}) // 2 = ${transferFirst.mid} の位置で、値は ${transferFirst.value} です。個数が偶数のとき、真ん中は左寄りになります。`,
incorrectFeedback: `不正解。真ん中の位置は (左端 + 右端) // 2 で決まります。範囲全体なら (${transferFirst.lo} + ${transferFirst.hi}) // 2 = ${transferFirst.mid} で、割り算の切り捨てのため左寄りの位置になります。`,
},
{
kind: "choice", id: "absent-target",
prompt: `主教材のリスト [${binarySearchMainValues.join(", ")}] で ${absentTarget} を探すと、どうなりますか`,
scene: absentScene,
choices: [
{ id: "narrows-to-empty", text: "最後の1個まで絞っても 20 はなく、範囲が空になって探索が終わる"},
{ id: "found-at-last", text: "最後の1個が 20 で、そこで見つかる"},
{ id: "stops-at-first", text: "最初の真ん中 19 が 20 でないので、その時点で終わる"},
{ id: "never-ends", text: "見つからないので、範囲が空にならず探し続ける"},
],
correctAnswer: { kind: "choice", choiceId: "narrows-to-empty"}, requires: null,
stepId: "execution-range-single",
reviewStepIds: ["execution-probe-2-drop-right", "execution-range-single", "execution-probe-3-mid", "if-hit-3"],
tags: ["探す値が無いときの終わり方"],
instruction: "説明を1つ選ぶ",
correctFeedback: `正解。比べる道は ${binarySearchMainTarget} を探したときとまったく同じで、${absentProbes.map((probe) => probe.value).join(" → ")} の順に進みます。最後の1個（${absentLast.value}）まで絞っても ${absentTarget} はないので、範囲が空になり、「無い」ことが分かって終わります。`,
incorrectFeedback: `不正解。真ん中が探す値でなくても探索は続きます。${absentProbes.map((probe) => probe.value).join(" → ")} と範囲を絞っていき、最後の1個まで調べても無ければ、範囲が空になって終わります。`,
},
{
kind: "parsons", id: "whole-code-order",
prompt: "二分探索のコードを、実行の流れに合う順序に並べてください。",
lineIds: [
"compute-mid", "define-function", "return-missing", "elif-smaller",
"while-range", "return-mid", "drop-left", "if-hit",
],
correctAnswer: { kind: "order", lineIds: parsonsLineIds}, requires: null,
// フェード型: 関数定義と最後の return は固定し、繰り返しの中の流れだけを並べ替える。
fixedLineIds: ["define-function", "return-missing"],
stepId: firstFrame.id, reviewStepIds: [firstFrame.id,...remainingFrames.map((frame) => frame.id)],
tags: ["コード全体の流れ"],
instruction: "色の薄い行は固定されています。残りの行をドラッグ、または↑↓ボタンで並び替える",
definitions: "lo = 探索範囲の左端の位置、hi = 探索範囲の右端の位置、mid = 真ん中の位置",
correctFeedback: "正解。範囲が残っている間、真ん中を計算して比べ、一致すればその位置を返し、真ん中が小さければ左側を捨て、範囲が空になれば -1 を返す流れを組み立てられました。",
incorrectFeedback: "不正解。繰り返しの条件、真ん中の計算、比べる、一致したら返す、小さい側を捨てる、最後に -1 を返す、という流れを確かめてみましょう。",
},
{
kind: "choice", id: "why-sorted-matters",
prompt: `並んでいないリスト [${unsortedValues.join(", ")}] で、同じやり方で探すとうまくいかないのはなぜですか`,
scene: unsortedScene,
choices: [
{ id: "drop-assumes-sorted", text: "どちら側を捨てるかの判断が、数字が小さい順に並んでいることを前提にしているから"},
{ id: "no-center", text: "真ん中のマスが決まらないから"},
{ id: "no-swap", text: "値を入れ替える手順が入っていないから"},
{ id: "too-many-values", text: "値の個数が多すぎて、範囲を半分にできないから"},
],
correctAnswer: { kind: "choice", choiceId: "drop-assumes-sorted"}, requires: null,
stepId: "elif-smaller-1",
reviewStepIds: ["execution-probe-1-mid", "elif-smaller-1", "execution-probe-1-drop-left"],
tags: ["並んでいることが前提の理由"],
instruction: "理由を1つ選ぶ",
correctFeedback: `正解。真ん中と比べて片側を丸ごと捨てられるのは、並んでいるからこそです。たとえば ${unsortedTarget} を探すと、真ん中の 42 と比べて右側を捨てますが、${unsortedTarget} はその右側にあり、二度と調べられません。`,
incorrectFeedback: "不正解。真ん中の位置は個数だけで決まり、範囲を半分に絞ることもできます。問題は、並んでいないと「真ん中より大きい側に探す値は無い」と言い切れないことです。",
},
],
};

export function validateBinarySearchConsolidation(content: BinarySearchConsolidationContent): void {
validateAssessment(content);
if (content.phase!== 6 || content.stageName!== "応用問題" || content.questions.length!== 4 || content.code!== binarySearchCode) {
throw new Error("Use four questions and the canonical code");
}
for (const question of content.questions) {
getLearningStep(binarySearchCodeMappingContent, question.stepId);
question.reviewStepIds.forEach((id) => getLearningStep(binarySearchCodeMappingContent, id));
if (question.kind === "parsons") {
const canonical = binarySearchCode.lines.map((line) => line.id) as readonly BinarySearchCodeLineId[];
const expected = canonical.filter((id) => parsonsLineIds.includes(id));
if (question.lineIds.length!== parsonsLineIds.length || question.lineIds.some((id) =>!parsonsLineIds.includes(id as BinarySearchCodeLineId))) {
throw new Error("Parsons must use exactly the selected main lines");
}
if (question.correctAnswer.lineIds.some((id, index) => id!== expected[index])) {
throw new Error("Parsons answer must follow the canonical order of the selected lines");
}
if (question.interchangeableLineGroups?.length) throw new Error("Selected binary-search lines have no interchangeable order");
} else {
validateArrayBarsCanvas(question.scene);
}
}
// Q1は転移用の実行記録と一致しなければならない（場面・回答対象・正解）。
const tap = content.questions[0];
if (tap.kind!== "node" || tap.scene.state.values.join(",")!== binarySearchTransferValues.join(",")
|| tap.correctAnswer.kind!== "node" || tap.correctAnswer.nodeId!== String(transferFirst.mid)
|| tap.nodeIds.length!== transferIds.length || tap.nodeIds.some((id) =>!transferIds.includes(id))) {
throw new Error("Transfer question must follow the verified transfer trace");
}
}
// 基準データ §1・§3 の確定事項（転移の最初の真ん中は位置4の16、不在ケースの
// 比較列は主教材と同じ 19 → 31 → 25 で -1、未整列リストでは右側に残った
// 7 を捨ててしまい -1 になる）と教材がずれたら落とす。
if (transferProbes.length!== 3 || transferFirst.lo!== 0 || transferFirst.hi!== 9 || transferFirst.mid!== 4 || transferFirst.value!== 16
|| absentProbes.map((probe) => probe.value).join(",")!== "19,31,25" || runBinarySearch(binarySearchMainValues, absentTarget)!== -1
|| absentLast.lo!== 4 || absentLast.hi!== 4 || absentLast.mid!== 4
||!unsortedValues.includes(unsortedTarget) || runBinarySearch(unsortedValues, unsortedTarget)!== -1) {
throw new Error("Binary-search consolidation cases must follow the verified traces");
}
validateBinarySearchConsolidation(binarySearchConsolidationContent);
