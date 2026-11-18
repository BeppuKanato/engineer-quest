import { validateAssessment } from "../../assessment/assessment";
import { validateArrayBarsCanvas, type ArrayBarsCanvasState } from "../../player/arrayBars.types";
import { getLearningStep } from "../../review/reviewContent";
import { bubbleSortComparisons, bubbleSortMainValues } from "../bubbleSort";
import { bubbleSortExecutionContent } from "../execution/execution.content";
import type { BubbleSortCheckContent, BubbleSortCheckQuestion } from "./check.types";

/**
 * フェーズ3（動きの確認問題）。設問数と内訳は固定数ではなく、フェーズ4が
 * 説明なしに使う理解（前提）を一通り判断できるかで決める（2026-11-17 の
 * 基準）。前提と既存2問の対応は次のとおりで、未カバー分だけを足した。
 * - ペアの進行（左から右へ隣同士）: 既存「next-pair」で確認済み。
 * - 交換規則（左が大きいときだけ交換し、大きい値が右へ）: 既存
 *   「larger-destination」は交換が起きる場合だけだったため、起きない場合の
 *   行き先「larger-stays」を追加。
 * - 周の終わりの確定（未確定範囲の最大値が右端に決まり、以後比べない）:
 *   未カバーだったため「fixed-at-pass-end」を追加。
 * - 次の周の再開（左端から、確定範囲を除いて比べ直す）: 未カバーだった
 *   ため「pass-two-first-pair」を追加。
 * - 範囲の縮小量（周ごとに比べるペアが1組ずつ減る）: 未カバーだったため
 *   数値の選択肢「pass-two-pair-count」を追加。
 * - 終了（未確定範囲が1マスになると比べるペアがなくなる。交換が起きない
 *   から終わるのではない）: 未カバーだったため「why-finished」を追加。
 * 場面はフェーズ2のステップをステップIDで参照し、配列を複製しない。
 * 正解はすべて実行記録（bubbleSortComparisons）から導き、末尾で照合する。
 */
const SCENE_STEP_ID = "compare-1-1";
const sceneStep = getLearningStep(bubbleSortExecutionContent, SCENE_STEP_ID);
const scene = sceneStep.canvas.state;
const comparisons = bubbleSortComparisons(bubbleSortMainValues);
const sceneIndex = comparisons.findIndex((comparison) => `compare-${comparison.pass}-${comparison.j}` === SCENE_STEP_ID);
const sceneComparison = comparisons[sceneIndex];
const next = comparisons[sceneIndex + 1];
// 状況キャプション（Issue #297）。場面ステップで起きた比較を完了形で、
// 前提として確定した次の比較を未来形で示し、青の意味を文章で固定する
// （文言はトレースから導く）。
const pastSituation = `${sceneComparison.pair[0]} と ${sceneComparison.pair[1]} を比べて、${sceneComparison.swapped ? "入れ替えました" : "そのままにしました"}。`;
const nextSituation = `次に、${next.pair[0]} と ${next.pair[1]} を比べます。`;
// Q1の回答対象は、場面の未確定範囲のマスだけ。確定済みの右端はもう比べない。
const unfixedIds = scene.values.map((_, index) => String(index)).filter((id) => Number(id) < scene.fixedFrom);
// Q2の回答対象は、比べるペアの2マスだけ。大きい値は比べた後に
// このどちらかにしか行き着かない（交換しなければそのまま、交換すれば右隣）。
const destinationIds = [String(next.j), String(next.j + 1)];
const largerIndex = next.swapped ? next.j + 1 : next.j;
const largerValue = Math.max(...next.pair);

// 「larger-stays」の場面は2周目の最初の比較（ペア (2, 4)、交換なし）。
// 交換が起きない比較は前後で配列が変わらないため、場面は一意に定まる。
const stayComparison = comparisons.find((comparison) => comparison.pass === 2 && comparison.j === 0)!;
const staySituation = `${stayComparison.pair[0]} と ${stayComparison.pair[1]} を比べて、${stayComparison.swapped ? "入れ替えました" : "そのままにしました"}。`;
const stayLargerValue = Math.max(...stayComparison.pair);
const stayLargerIndex = stayComparison.after[stayComparison.j] > stayComparison.after[stayComparison.j + 1]
  ? stayComparison.j : stayComparison.j + 1;
const stayDestinationIds = [String(stayComparison.j), String(stayComparison.j + 1)];

// 「fixed-at-pass-end」の場面は1周目の最後の比較（ペア (5, 3)、交換あり）。
const passOneLast = comparisons.filter((comparison) => comparison.pass === 1).at(-1)!;
const passEndSituation = `${passOneLast.pair[0]} と ${passOneLast.pair[1]} を比べて、${passOneLast.swapped ? "入れ替えました" : "そのままにしました"}。これで、1周目の比べる作業は終わりです。`;
const allCellIds = scene.values.map((_, index) => String(index));
// 「pass-two-first-pair」「pass-two-pair-count」の場面は1周目の確定ステップ。
const passEndOneStep = getLearningStep(bubbleSortExecutionContent, "pass-end-1");
const passEndOne = passEndOneStep.canvas.state;
const passTwoUnfixedIds = passEndOne.values.map((_, index) => String(index)).filter((id) => Number(id) < passEndOne.fixedFrom);
const fixedCellId = String(passEndOne.values.length - 1);
const passTwoComparisons = comparisons.filter((comparison) => comparison.pass === 2);
// 「why-finished」の場面は最後の比較（4周目、ペア (1, 2)、交換なし）。
const lastComparison = comparisons.at(-1)!;
const lastSituation = `${lastComparison.pair[0]} と ${lastComparison.pair[1]} を比べて、${lastComparison.swapped ? "入れ替えました" : "そのままにしました"}。これが最後の比較です。`;

export const bubbleSortCheckContent: BubbleSortCheckContent = {
  version: 1, kind: "concept-check", id: "bubble-sort-check", phase: 3, stageName: "動きの確認問題",
  questions: [
    {
      id: "next-pair", prompt: "次に比べるペアの左側のマスはどれか", situation: pastSituation, stepId: SCENE_STEP_ID,
      nodeIds: unfixedIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: String(next.j) }, requires: null,
      reviewStepIds: [SCENE_STEP_ID, "compare-1-2"], tags: ["compare-order"],
    },
    {
      id: "larger-destination", prompt: `比べた後、大きい方の ${largerValue} はどのマスへ行くか`, situation: nextSituation, stepId: SCENE_STEP_ID,
      nodeIds: destinationIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: String(largerIndex) },
      requires: { questionId: "next-pair", answer: { kind: "node", nodeId: String(next.j) } },
      reviewStepIds: [SCENE_STEP_ID, "compare-1-2"], tags: ["swap-destination"],
    },
    {
      id: "larger-stays", prompt: `比べた後、大きい方の ${stayLargerValue} はどのマスへ行くか`, situation: staySituation, stepId: "compare-2-0",
      nodeIds: stayDestinationIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: String(stayLargerIndex) }, requires: null,
      reviewStepIds: ["pass-end-1", "compare-2-0"], tags: ["stay-destination"],
    },
    {
      id: "fixed-at-pass-end", prompt: "この周で、右端に決まったマスはどれか", situation: passEndSituation, stepId: "compare-1-3",
      nodeIds: allCellIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: fixedCellId }, requires: null,
      reviewStepIds: ["compare-1-3", "pass-end-1"], tags: ["pass-end-fixed"],
    },
    {
      id: "pass-two-first-pair", prompt: "2周目に、最初に比べるペアの左側のマスはどれか", situation: passEndOneStep.caption, stepId: "pass-end-1",
      nodeIds: passTwoUnfixedIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: String(passTwoComparisons[0].j) },
      requires: { questionId: "fixed-at-pass-end", answer: { kind: "node", nodeId: fixedCellId } },
      reviewStepIds: ["pass-end-1", "compare-2-0"], tags: ["pass-restart"],
    },
    {
      kind: "choice", id: "pass-two-pair-count", prompt: "2周目に比べるペアは、全部で何組ですか",
      situation: "5 が右端に決まって、2周目が始まるところです。", stepId: "pass-end-1",
      choices: [
        { id: "two", text: "2組" },
        { id: "three", text: "3組" },
        { id: "four", text: "4組" },
      ],
      correctAnswer: { kind: "choice", choiceId: "three" }, requires: null,
      reviewStepIds: ["pass-end-1", "compare-2-0", "compare-2-2", "pass-end-2"], tags: ["range-shrink"],
    },
    {
      kind: "choice", id: "why-finished", prompt: "比べる作業がここで終わるのは、なぜですか",
      situation: lastSituation, stepId: "compare-4-0",
      choices: [
        { id: "range-exhausted", text: "比べる範囲がだんだん狭くなって、比べるペアがなくなったから" },
        { id: "no-swap-end", text: "最後の比較で、交換が起きなかったから" },
        { id: "largest-fixed", text: "一番大きい値が、右端に決まったから" },
      ],
      correctAnswer: { kind: "choice", choiceId: "range-exhausted" }, requires: null,
      reviewStepIds: ["compare-4-0", "pass-end-4", "complete"], tags: ["termination"],
    },
  ],
  completion: {
    stepId: "complete",
    caption: "比べる順番と大きい値の行き先に加えて、周の終わりの確定と、範囲が狭くなって終わることまで追えたので、次は、図の動きとコードの対応を確かめます。",
  },
};

/**
 * 設問の場面。前提のない設問はフェーズ2のステップ canvas をそのまま返す。
 * 前提のある設問のうち「larger-destination」だけは、同じ配列（値は同一）の
 * まま、これから比べるペアを前提設問の正解の位置から示し、直前の比較を
 * 表す highlight を外した場面を返す。「pass-two-first-pair」の前提（右端の
 * 確定）は場面ステップ pass-end-1 の盤面自体が示しているため、加工しない。
 */
export function getBubbleSortCheckScene(question: BubbleSortCheckQuestion): ArrayBarsCanvasState {
  const step = getLearningStep(bubbleSortExecutionContent, question.stepId);
  const premise = question.id === "larger-destination" ? question.requires?.answer : undefined;
  if (!premise || premise.kind !== "node") return step.canvas;
  const left = Number(premise.nodeId);
  return {
    data: step.canvas.data,
    state: { ...step.canvas.state, comparing: [left, left + 1] },
    highlights: [],
  };
}

validateAssessment(bubbleSortCheckContent);
for (const question of bubbleSortCheckContent.questions) {
  getLearningStep(bubbleSortExecutionContent, question.stepId);
  question.reviewStepIds.forEach((id) => getLearningStep(bubbleSortExecutionContent, id));
  validateArrayBarsCanvas(getBubbleSortCheckScene(question));
}
getLearningStep(bubbleSortExecutionContent, bubbleSortCheckContent.completion.stepId);
// 基準データ §3 の確定事項（場面 [2, 4, 5, 1, 3]、次は j=2 のペア (5, 1) で交換し、5 は位置3へ）と教材の正解がずれたら落とす。
if (sceneIndex < 0 || next.pass !== 1 || next.j !== 2 || next.pair[0] !== 5 || next.pair[1] !== 1 ||
  !next.swapped || largerValue !== 5 || largerIndex !== 3 || next.after[largerIndex] !== 5 ||
  sceneComparison.pass !== 1 || sceneComparison.j !== 1 || sceneComparison.pair[0] !== 4 || sceneComparison.pair[1] !== 5 ||
  sceneComparison.swapped || pastSituation !== "4 と 5 を比べて、そのままにしました。" || nextSituation !== "次に、5 と 1 を比べます。" ||
  scene.values.join(",") !== "2,4,5,1,3" || comparisons[sceneIndex].after.join(",") !== scene.values.join(",")) {
  throw new Error("Bubble-sort check answers must follow the verified trace");
}
// 追加した設問の正解も、実行記録と突き合わせて固定する。
if (stayComparison.pair[0] !== 2 || stayComparison.pair[1] !== 4 || stayComparison.swapped ||
  staySituation !== "2 と 4 を比べて、そのままにしました。" || stayLargerValue !== 4 || stayLargerIndex !== 1 ||
  stayComparison.after[stayLargerIndex] !== 4 ||
  passOneLast.j !== 3 || passOneLast.pair[0] !== 5 || passOneLast.pair[1] !== 3 || !passOneLast.swapped ||
  passEndOne.values.join(",") !== "2,4,1,3,5" || passEndOne.fixedFrom !== 4 || passEndOne.values[Number(fixedCellId)] !== 5 ||
  passEndOne.values[Number(fixedCellId)] !== Math.max(...passEndOne.values) ||
  passTwoComparisons.length !== 3 || passTwoComparisons[0].j !== 0 ||
  lastComparison.pass !== 4 || lastComparison.j !== 0 || lastComparison.pair[0] !== 1 || lastComparison.pair[1] !== 2 ||
  lastComparison.swapped || lastSituation !== "1 と 2 を比べて、そのままにしました。これが最後の比較です。") {
  throw new Error("Bubble-sort check expansion answers must follow the verified trace");
}
