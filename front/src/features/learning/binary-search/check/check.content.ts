import { validateAssessment } from "../../assessment/assessment";
import { getLearningStep } from "../../review/reviewContent";
import { binarySearchMainTarget, binarySearchMainValues, binarySearchProbes } from "../binarySearch";
import { binarySearchExecutionContent } from "../execution/execution.content";
import {
  validateBinarySearchExecutionCanvas, type BinarySearchExecutionCanvasState,
} from "../execution/execution.types";
import type { BinarySearchCheckContent, BinarySearchCheckQuestion } from "./check.types";

/**
 * 基準データ §3 フェーズ3（5問）。場面はフェーズ2のステップを
 * ステップIDで参照し、盤面を複製しない。設問は主教材のトレースを
 * 最初から最後まで1本にたどる並びで、場面は `range-full`（範囲は全体）、
 * `probe-1-mid`（真ん中 19 を見たところ）、`range-after-drop-left`
 * （1回目の比較で左側を捨てた直後、lo=4 / hi=6、19 は確認済みで範囲外）、
 * `probe-2-mid`（新しい真ん中 31 を見たところ）、`probe-3-mid`
 * （残った 1 個の 25 を見たところ）。
 * 正解はすべて実行記録（probes）から導く。
 *
 * 設問数は固定数ではなく、フェーズ4（動きとコードの対応）が前提とする
 * 理解を一通り判断できるかで決める（2026-11-17 の基準）。フェーズ4が
 * 前提とするのは、範囲が全体から始まること、次に調べるのは残った範囲の
 * 真ん中であること、小さい側・大きい側のどちらを捨てるかと捨てた後に
 * 残る範囲（真ん中自身も外れる）、一致したらその位置を答えとして終わる
 * こと。当初の2問は「2回目の真ん中」と「右を捨てた後の範囲」だけを
 * 聞いており、最初の真ん中、左を捨てた後の範囲、一致での終了が
 * 未確認だったため、トレースの前後に3問を足して5問にした。
 */
const target = binarySearchMainTarget;
const probes = binarySearchProbes(binarySearchMainValues, target);
const [first, second, third] = probes;
// 最初の真ん中を聞く設問の回答対象は、範囲全体のマス。
const allIds = binarySearchMainValues.map((_, index) => String(index));
// 2回目の真ん中を聞く設問の回答対象は、残った範囲のマスだけ。捨てた部分（19 を含む）はもう調べない。
const candidateIds = binarySearchMainValues
  .map((_, index) => String(index))
  .filter((id) => Number(id) >= second.lo && Number(id) <= second.hi);

export const binarySearchCheckContent: BinarySearchCheckContent = {
  version: 1, kind: "concept-check", id: "binary-search-check", phase: 3, stageName: "動きの確認問題",
  questions: [
    {
      id: "first-center", prompt: "最初に調べる真ん中のマスはどれか", stepId: "range-full",
      nodeIds: allIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: String(first.mid) }, requires: null,
      reviewStepIds: ["range-full", "probe-1-mid"], tags: ["first-center"],
      correctFeedback: "正解！最初は範囲が全体なので、真ん中は両端のちょうど中間のマスです。",
      incorrectFeedback: "不正解。最初に調べるのは、範囲全体のちょうど真ん中のマスです。左端と右端の位置から、真ん中がどこになるか確かめてみましょう。",
    },
    {
      kind: "choice",
      id: "range-after-first-compare", prompt: `${first.value} と ${target} を比べた後、次に残る範囲はどうなるか`, stepId: "probe-1-mid",
      choices: [
        { id: "drop-left", text: `左側を捨てて、範囲は ${second.lo} から ${second.hi} になる` },
        { id: "drop-left-with-mid", text: `左側を捨てて、範囲は ${first.mid} から ${second.hi} になる` },
        { id: "drop-right", text: `右側を捨てて、範囲は ${first.lo} から ${first.mid - 1} になる` },
        { id: "unchanged", text: "範囲は変わらない" },
      ],
      correctAnswer: { kind: "choice", choiceId: "drop-left" }, requires: null,
      reviewStepIds: ["probe-1-mid", "probe-1-drop-left", "range-after-drop-left"], tags: ["range-after-drop-left"],
      correctFeedback: `正解！${first.value} は ${target} より小さいので、${first.value} を含む左側を捨てて、範囲は ${second.lo} から ${second.hi} になります。`,
      incorrectFeedback: `不正解。${first.value} は ${target} より小さいので、捨てるのは小さい側（左側）です。比べた ${first.value} 自身も、もう調べないので範囲から外れます。`,
    },
    {
      id: "next-center", prompt: "左側を捨てました。次に調べる真ん中のマスはどれか", stepId: "range-after-drop-left",
      nodeIds: candidateIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: String(second.mid) }, requires: null,
      reviewStepIds: ["range-after-drop-left", "probe-2-mid"], tags: ["next-center"],
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
    {
      kind: "choice",
      id: "final-hit", prompt: `残った 1 個の ${third.value} を見ました。どうなりますか`, stepId: "probe-3-mid",
      choices: [
        { id: "found", text: `探す値と一致したので、探索は終わり、答えは位置 ${third.mid} になる` },
        { id: "keep-going", text: "範囲がまだ残っているので、探索が続く" },
        { id: "not-found", text: "1 個だけでは見つけたことにならないので、無いものとして終わる" },
        { id: "check-right", text: "一致しても、念のため右側も調べる" },
      ],
      correctAnswer: { kind: "choice", choiceId: "found" }, requires: null,
      reviewStepIds: ["probe-3-mid", "found"], tags: ["found"],
      correctFeedback: `正解！真ん中の ${third.value} は探す値と一致しました。一致した時点で探索は終わり、答えはその位置（${third.mid}）です。`,
      incorrectFeedback: "不正解。真ん中の値が探す値と一致したら、その時点で探索は終わり、答えはその位置です。残りの範囲はもう調べません。",
    },
  ],
  completion: {
    stepId: "range-single",
    caption: "最初から見つかるまで、真ん中と、比べた後に残る範囲を追えたので、次は、図の動きとコードの対応を確かめます。",
  },
};

/** 設問の場面。全問ともフェーズ2のステップ canvas をそのまま返す（複製しない）。 */
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
// 基準データ §3 の確定事項（トレースは左を捨てる→右を捨てる→一致の3回、
// 最初の真ん中は位置 3、左を捨てた後の範囲は位置 4〜6、最後は位置 4 で一致）と
// 教材の正解がずれたら落とす。
const firstScene = getBinarySearchCheckScene(binarySearchCheckContent.questions[0]);
const nextScene = getBinarySearchCheckScene(binarySearchCheckContent.questions[2]);
const compareScene = getBinarySearchCheckScene(binarySearchCheckContent.questions[3]);
const hitScene = getBinarySearchCheckScene(binarySearchCheckContent.questions[4]);
if (probes.length !== 3 || first.outcome !== "drop-left" || second.outcome !== "drop-right" || third.outcome !== "hit"
  || first.lo !== 0 || first.hi !== 6 || first.mid !== 3 || first.value !== 19
  || second.lo !== 4 || second.hi !== 6 || second.mid !== 5 || second.value !== 31 || third.lo !== 4 || third.hi !== 4 || third.mid !== 4
  || firstScene.state.lo !== first.lo || firstScene.state.hi !== first.hi || firstScene.state.mid !== null
  || nextScene.state.lo !== second.lo || nextScene.state.hi !== second.hi || nextScene.state.mid !== null
  || nextScene.state.cells[first.mid] !== "discarded" || compareScene.state.mid !== second.mid
  || compareScene.state.cells[second.mid] !== "center" || hitScene.state.mid !== third.mid
  || hitScene.state.cells[third.mid] !== "center") {
  throw new Error("Binary-search check answers must follow the verified trace");
}
