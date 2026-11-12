import { validateAssessment } from "../../../assessment/assessment";
import { getLearningStep } from "../../../review/reviewContent";
import { binarySearchMainTarget, binarySearchMainValues, binarySearchProbes } from "../binarySearch";
import { binarySearchExecutionContent } from "../execution/execution.content";
import {
  validateBinarySearchExecutionCanvas, type BinarySearchExecutionCanvasState,
} from "../execution/execution.types";
import type { BinarySearchCheckContent, BinarySearchCheckQuestion } from "./check.types";

/**
 * 基準データ §3 フェーズ3（連結2問）。場面はフェーズ2のステップを
 * ステップIDで参照し、盤面を複製しない。Q1 の場面は `range-after-drop-left`
 * （1回目の比較で左側を捨てた直後、lo=4 / hi=6、19 は確認済みで範囲外）、
 * Q2 の場面は `probe-2-mid`（新しい真ん中 31 を見たところ）。
 * 正解は実行記録（probes）から導く（Q1=2回目の比較の真ん中、Q2=その比較で
 * 右側を捨てた後に残る範囲）。
 */
const SCENE_STEP_ID = "range-after-drop-left";
const target = binarySearchMainTarget;
const probes = binarySearchProbes(binarySearchMainValues, target);
const [, second, third] = probes;
// Q1の回答対象は、残った範囲のマスだけ。捨てた部分（19 を含む）はもう調べない。
const candidateIds = binarySearchMainValues
  .map((_, index) => String(index))
  .filter((id) => Number(id) >= second.lo && Number(id) <= second.hi);

export const binarySearchCheckContent: BinarySearchCheckContent = {
  version: 1, kind: "concept-check", id: "binary-search-check", phase: 3, stageName: "動きの確認問題",
  questions: [
    {
      id: "next-center", prompt: "左側を捨てました。次に調べる真ん中のマスはどれか", stepId: SCENE_STEP_ID,
      nodeIds: candidateIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: String(second.mid) }, requires: null,
      reviewStepIds: [SCENE_STEP_ID, "probe-2-mid"], tags: ["next-center"],
      correctFeedback: "正解！残った範囲の真ん中が、次に調べるマスです。",
      incorrectFeedback: "不正解。次に調べるのは、残った範囲のちょうど真ん中です。両端の位置から真ん中がどこになるか、確かめてみましょう。",
    },
    {
      kind: "choice",
      id: "range-after-compare", prompt: `${second.value} と ${target} を比べた後、次に残る範囲はどうなるか`, stepId: "probe-2-mid",
      choices: [
        { id: "drop-right", text: `右側を捨てて、範囲は ${third.lo} だけになる` },
        { id: "drop-left", text: `左側を捨てて、範囲は ${second.hi} だけになる` },
        { id: "unchanged", text: "範囲は変わらない" },
        { id: "finished", text: "探索が終わる" },
      ],
      correctAnswer: { kind: "choice", choiceId: "drop-right" }, requires: null,
      reviewStepIds: ["probe-2-mid", "probe-2-drop-right", "range-single"], tags: ["drop-side"],
      correctFeedback: `正解！${second.value} は ${target} より大きいので、右側を捨てて範囲は ${third.lo} だけになります。`,
      incorrectFeedback: `不正解。${second.value} は ${target} より大きいので、捨てるのは大きい側（右側）です。比べた値より小さい側だけが残ります。`,
    },
  ],
  completion: {
    stepId: "range-single",
    caption: "次の真ん中と、比べた後に残る範囲を追えたので、次は、図の動きとコードの対応を確かめます。",
  },
};

/** 設問の場面。2問ともフェーズ2のステップ canvas をそのまま返す（複製しない）。 */
export function getBinarySearchCheckScene(question: BinarySearchCheckQuestion): BinarySearchExecutionCanvasState {
  return getLearningStep(binarySearchExecutionContent, question.stepId).canvas;
}

validateAssessment(binarySearchCheckContent);
for (const question of binarySearchCheckContent.questions) {
  getLearningStep(binarySearchExecutionContent, question.stepId);
  question.reviewStepIds.forEach((id) => getLearningStep(binarySearchExecutionContent, id));
  validateBinarySearchExecutionCanvas(getBinarySearchCheckScene(question));
}
getLearningStep(binarySearchExecutionContent, binarySearchCheckContent.completion.stepId);
// 基準データ §3 の確定事項（場面は左を捨てた直後 lo=4 / hi=6、次は真ん中 31、
// 比べた後は右を捨てて範囲は位置 4 だけ）と教材の正解がずれたら落とす。
const scene = getBinarySearchCheckScene(binarySearchCheckContent.questions[0]);
const compareScene = getBinarySearchCheckScene(binarySearchCheckContent.questions[1]);
if (probes.length !== 3 || probes[0].outcome !== "drop-left" || second.outcome !== "drop-right" || third.outcome !== "hit"
  || second.lo !== 4 || second.hi !== 6 || second.mid !== 5 || second.value !== 31 || third.lo !== 4 || third.hi !== 4
  || scene.state.lo !== second.lo || scene.state.hi !== second.hi || scene.state.mid !== null
  || scene.state.cells[probes[0].mid] !== "discarded" || compareScene.state.mid !== second.mid
  || compareScene.state.cells[second.mid] !== "center") {
  throw new Error("Binary-search check answers must follow the verified trace");
}
