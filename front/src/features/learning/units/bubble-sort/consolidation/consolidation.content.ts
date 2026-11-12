import { validateAssessment} from "../../../assessment/assessment";
import { validateArrayBarsCanvas, type ArrayBarsCanvasState} from "../../../player/arrayBars.types";
import { getLearningStep} from "../../../review/reviewContent";
import { bubbleSortComparisons, bubbleSortTransferValues} from "../bubbleSort";
import { bubbleSortCode} from "../code-mapping/bubbleSortCode";
import { bubbleSortCodeMappingContent} from "../code-mapping/codeMapping.content";
import { bubbleSortExecutionContent} from "../execution/execution.content";
import type {
BubbleSortArrayTapQuestion, BubbleSortConsolidationContent,
} from "./consolidation.types";

/**
* 基準データ §3 フェーズ6（転移タップ1問・選択2問・Parsons 1問）。
* Q1の場面は転移用 [3, 1, 4, 2] の1周目を終えた状態を組み立てで作り、
* 正解は実行記録の2周目で最初に入れ替えが起きる比較から導く。
* Q3の場面はフェーズ2の盤面を参照する。復習先はすべてフェーズ4
* （コードとの対応）のフレームで、新しい配列の答え合わせは作らない。
*/
const transferComparisons = bubbleSortComparisons(bubbleSortTransferValues);
const transferPassOne = transferComparisons.filter((comparison) => comparison.pass === 1);
const transferAfterPassOne = transferPassOne[transferPassOne.length - 1].after;
const transferFirstSwap = transferComparisons
.filter((comparison) => comparison.pass === 2)
.find((comparison) => comparison.swapped);
if (!transferFirstSwap) throw new Error("Transfer trace needs a swap in pass 2");
const transferFirstSwapJ = transferFirstSwap.j;
const transferScene: ArrayBarsCanvasState = {
data: { kind: "array-bars"},
state: { values: transferAfterPassOne, comparing: null, fixedFrom: transferAfterPassOne.length - 1},
highlights: [],
};
// Q1の回答対象は、場面の未確定範囲のマスだけ。確定済みの右端はもう比べない（フェーズ3 Q1と同じ考え方）。
const unfixedIds = transferAfterPassOne
.map((_, index) => String(index))
.filter((id) => Number(id) < transferScene.state.fixedFrom);
// Q2の場面は、最初から並んでいる配列の開始状態（確定範囲なし）。
const sortedScene: ArrayBarsCanvasState = {
data: { kind: "array-bars"},
state: { values: [1, 2, 3, 4], comparing: null, fixedFrom: 4},
highlights: [],
};
const passEndOneScene = getLearningStep(bubbleSortExecutionContent, "pass-end-1").canvas;
const [firstFrame,...remainingFrames] = bubbleSortCodeMappingContent.steps;

export const bubbleSortConsolidationContent: BubbleSortConsolidationContent = {
version: 1, kind: "diagnostic-check", id: "bubble-sort-consolidation", phase: 6, stageName: "応用問題",
code: bubbleSortCode,
reviewLabel: "💡 基本例の動き・コードをもう一度見る",
completion: "理解の状況が確認できました。それでは【自分で実装】に進み、自分の手でコードを完成させましょう！",
questions: [
{
kind: "node", id: "next-swap-pair", prompt: "この後、入れ替えが起きるペアの左側はどれか",
scene: transferScene,
nodeIds: unfixedIds, allowNone: false,
correctAnswer: { kind: "node", nodeId: String(transferFirstSwap.j)}, requires: null,
stepId: "execution-compare-2-1",
reviewStepIds: ["for-compare-2-0", "execution-compare-2-0", "for-compare-2-1", "execution-compare-2-1"],
tags: ["交換が起きるペアの追跡"],
instruction: "配列のマスをタップして答える",
correctFeedback: "正解。2周目で最初に入れ替えが起きるのは、3 と 2 のペアです。",
incorrectFeedback: "不正解。2周目は左端から順に比べます。1 と 3 はそのままで、3 と 2 で入れ替えが起きます。",
},
{
kind: "choice", id: "sorted-array-behavior", prompt: "最初から並んでいる配列 [1, 2, 3, 4] では、どうなりますか",
scene: sortedScene,
choices: [
{ id: "no-swap-full-comparisons", text: "交換は一度も起きないが、比べることは範囲が尽きるまで行われる"},
{ id: "ends-after-first-comparison", text: "最初のペアを1回比べたら、並び替えは終わる"},
{ id: "never-stops", text: "交換が起きるまで比べ続けるので、終わらなくなる"},
{ id: "swaps-on-every-comparison", text: "比べるたびに、必ず入れ替えが起きる"},
],
correctAnswer: { kind: "choice", choiceId: "no-swap-full-comparisons"}, requires: null,
stepId: "execution-complete",
reviewStepIds: ["execution-compare-4-0", "execution-pass-end-4", "execution-complete"],
tags: ["並び済みの配列の扱い"],
instruction: "説明を1つ選ぶ",
correctFeedback: "正解。交換は起きませんが、途中でやめる仕組みはないので、比べることは範囲が尽きるまで行われます。",
incorrectFeedback: "不正解。比べる回数はループの範囲だけで決まります。並んでいるかどうかで途中で終わることはありません。",
},
{
kind: "choice", id: "why-right-end-fixed", prompt: "並び替えで、右端から順に値が決まっていくのはなぜですか",
scene: passEndOneScene,
choices: [
{ id: "largest-moves-right", text: "比べるたびに大きい方が右へ移るので、1周すると一番大きい値が右端に届くため"},
{ id: "compares-from-right", text: "右端のマスから順に比べていくため"},
{ id: "smaller-moves-right", text: "入れ替えのときに、小さい方が右へ移るため"},
{ id: "sorts-all-at-pass-end", text: "1周の最後に、全部の値をまとめて並び替えるため"},
],
correctAnswer: { kind: "choice", choiceId: "largest-moves-right"}, requires: null,
stepId: "execution-pass-end-1",
reviewStepIds: ["execution-compare-1-2", "execution-compare-1-3", "execution-pass-end-1"],
tags: ["右端が決まる理由"],
instruction: "理由を1つ選ぶ",
correctFeedback: "正解。大きい値は比べるたびに右へ運ばれるので、1周の終わりには右端に届きます。",
incorrectFeedback: "不正解。比べるのは左端から順で、入れ替えでは大きい方が右へ移ります。",
},
{
kind: "parsons", id: "whole-code-order", prompt: "バブルソートのコードを、実行の流れに合う順序に並べてください。",
lineIds: [
"swap-values", "for-pass", "count-values", "define-function",
"return-result", "copy-values", "if-larger", "for-compare",
],
correctAnswer: { kind: "order", lineIds: bubbleSortCode.lines.map((line) => line.id)}, requires: null,
// フェード型: 関数定義と return は固定し、コピーから交換までの流れだけを並べ替える。
fixedLineIds: ["define-function", "return-result"],
stepId: firstFrame.id, reviewStepIds: [firstFrame.id, ...remainingFrames.map((frame) => frame.id)],
tags: ["コード全体の流れ"],
instruction: "色の薄い行は固定されています。残りの行をドラッグ、または↑↓ボタンで並び替える",
correctFeedback: "正解。コピーして、周ごとに隣同士を比べて入れ替え、返すまでの流れを組み立てられました。",
incorrectFeedback: "不正解。リストをコピーする、周のループ、比べるループ、交換の条件、返す、という流れを確かめてみましょう。",
},
],
};

export function validateBubbleSortConsolidation(content: BubbleSortConsolidationContent): void {
  validateAssessment(content);
  if (content.phase !== 6 || content.stageName !== "応用問題" || content.questions.length !== 4 || content.code !== bubbleSortCode) {
    throw new Error("Use four questions and the canonical code");
  }
  for (const question of content.questions) {
    getLearningStep(bubbleSortCodeMappingContent, question.stepId);
    question.reviewStepIds.forEach((id) => getLearningStep(bubbleSortCodeMappingContent, id));
    if (question.kind === "parsons") {
      const ids: readonly string[] = bubbleSortCode.lines.map((line) => line.id);
      if (question.lineIds.length !== ids.length || question.lineIds.some((id) => !ids.includes(id)) ||
        question.correctAnswer.lineIds.some((id, index) => id !== ids[index])) throw new Error("Parsons must use all canonical lines");
      if (question.interchangeableLineGroups?.length) throw new Error("Bubble-sort lines have no interchangeable order");
    } else {
      validateArrayBarsCanvas(question.scene);
    }
  }
  // Q1は転移用の実行記録と一致しなければならない（場面・回答対象・正解）。
  const tap = content.questions[0] as BubbleSortArrayTapQuestion;
  if (tap.kind !== "node" || tap.scene.state.values.join(",") !== transferAfterPassOne.join(",") ||
    tap.scene.state.fixedFrom !== transferAfterPassOne.length - 1 ||
    tap.correctAnswer.kind !== "node" || tap.correctAnswer.nodeId !== String(transferFirstSwapJ) ||
    tap.nodeIds.length !== unfixedIds.length || tap.nodeIds.some((id) => !unfixedIds.includes(id))) {
    throw new Error("Transfer question must follow the verified transfer trace");
  }
}
// 基準データ §3 の確定事項（転移用: 1周後は [1, 3, 2, 4]、2周目の最初の交換は j=1 のペア (3, 2)）と教材がずれたら落とす。
if (transferAfterPassOne.join(",") !== "1,3,2,4" || transferFirstSwap.j !== 1 ||
  transferFirstSwap.pair[0] !== 3 || transferFirstSwap.pair[1] !== 2) {
  throw new Error("Bubble-sort consolidation transfer must follow the verified trace");
}
validateBubbleSortConsolidation(bubbleSortConsolidationContent);
