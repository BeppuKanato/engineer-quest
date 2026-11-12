import { validateAssessment } from "../../../assessment/assessment";
import { validateArrayBarsCanvas, type ArrayBarsCanvasState } from "../../../player/arrayBars.types";
import { getLearningStep } from "../../../review/reviewContent";
import { bubbleSortComparisons, bubbleSortMainValues } from "../bubbleSort";
import { bubbleSortExecutionContent } from "../execution/execution.content";
import type { BubbleSortCheckContent, BubbleSortCheckQuestion } from "./check.types";

/**
 * 基準データ §3 フェーズ3（連結2問）。場面はフェーズ2の `compare-1-1`
 * （1周目の2回目の比較まで終えた状態）の配列をステップIDで参照し、複製しない。
 * 正解は実行記録の次の比較（1周目 j=2、ペア (5, 1)、交換あり）から導く
 * （Q1=次に比べるペアの左側、Q2=比べた後に大きい値が行き着く位置）。
 */
const SCENE_STEP_ID = "compare-1-1";
const sceneStep = getLearningStep(bubbleSortExecutionContent, SCENE_STEP_ID);
const scene = sceneStep.canvas.state;
const comparisons = bubbleSortComparisons(bubbleSortMainValues);
const sceneIndex = comparisons.findIndex((comparison) => `compare-${comparison.pass}-${comparison.j}` === SCENE_STEP_ID);
const sceneComparison = comparisons[sceneIndex];
const next = comparisons[sceneIndex + 1];
// 状況キャプション（Issue #297）。Q1の場面の青ペアは「比べ終えたペア」、
// Q2の場面の青ペアは「これから比べるペア」で、色だけでは時制が読めない。
// Q1は場面ステップで起きた比較を完了形で、Q2は前提として確定した次の
// 比較を未来形で示し、青の意味を文章で固定する（文言はトレースから導く）。
const pastSituation = `${sceneComparison.pair[0]} と ${sceneComparison.pair[1]} を比べて、${sceneComparison.swapped ? "入れ替えました" : "そのままにしました"}。`;
const nextSituation = `次に、${next.pair[0]} と ${next.pair[1]} を比べます。`;
// Q1の回答対象は、場面の未確定範囲のマスだけ。確定済みの右端はもう比べない。
const unfixedIds = scene.values.map((_, index) => String(index)).filter((id) => Number(id) < scene.fixedFrom);
// Q2の回答対象は、比べるペアの2マスだけ。大きい値は比べた後に
// このどちらかにしか行き着かない（交換しなければそのまま、交換すれば右隣）。
const destinationIds = [String(next.j), String(next.j + 1)];
const largerIndex = next.swapped ? next.j + 1 : next.j;
const largerValue = Math.max(...next.pair);

export const bubbleSortCheckContent: BubbleSortCheckContent = {
  version: 1, kind: "node-tap-check", id: "bubble-sort-check", phase: 3, stageName: "動きの確認問題",
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
  ],
  completion: {
    stepId: "compare-1-2",
    caption: "次に比べるペアと、大きい値が移るマスを追えたので、次は、図の動きとコードの対応を確かめます。",
  },
};

/**
 * 設問の場面。前提のない設問（Q1）はフェーズ2のステップ canvas をそのまま返す。
 * 前提のある設問（Q2）は同じ配列（値は同一）のまま、これから比べるペアを
 * 前提設問の正解の位置から示し、直前の比較を表す highlight を外した場面を返す。
 */
export function getBubbleSortCheckScene(question: BubbleSortCheckQuestion): ArrayBarsCanvasState {
  const step = getLearningStep(bubbleSortExecutionContent, question.stepId);
  const premise = question.requires?.answer;
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
