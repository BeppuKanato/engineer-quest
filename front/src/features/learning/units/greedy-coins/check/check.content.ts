import { validateAssessment } from "../../../assessment/assessment";
import { getLearningStep } from "../../../review/reviewContent";
import {
  greedyCoinsDenominations, greedyCoinsMainAmount, greedyCoinsSelections,
} from "../greedyCoins";
import { greedyCoinsExecutionContent } from "../execution/execution.content";
import {
  validateGreedyCoinsExecutionCanvas, type GreedyCoinsExecutionCanvasState,
} from "../execution/execution.types";
import type { GreedyCoinsCheckContent, GreedyCoinsCheckQuestion } from "./check.types";

/**
 * 基準データ §3 フェーズ3（連結2問）。場面はフェーズ2のステップを
 * ステップIDで参照し、盤面を複製しない。場面は `select-3`
 * （500・100・100 の3枚を使い終わり、残額86、トレイ3枚のところ）。
 * Q1 は次に選ぶ硬貨のタップ、Q2 は同じ場面で「なぜ100ではなく50か」を問う
 * 概念確認の4択。正解は実行記録（selections）から導く
 * （4枚目の選択＝50、選ぶ直前の残額＝86）。
 * Q1 の回答対象は額面列の全額面とする。100 はもう2枚使っているが額面は
 * 何枚でも使えるため候補から外さず、「残額より大きい硬貨は使えない」ことを
 * 500・100 も含めて判断させる。
 */
const SCENE_STEP_ID = "select-3";
const selections = greedyCoinsSelections(greedyCoinsMainAmount, greedyCoinsDenominations);
const next = selections[3];
const candidateIds = greedyCoinsDenominations.map((coin) => String(coin));

export const greedyCoinsCheckContent: GreedyCoinsCheckContent = {
  version: 1, kind: "concept-check", id: "greedy-coins-check", phase: 3, stageName: "動きの確認問題",
  questions: [
    {
      id: "next-coin", prompt: "残りは86円です。次に選ぶ硬貨はどれか", stepId: SCENE_STEP_ID,
      nodeIds: candidateIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: String(next.coin) }, requires: null,
      reviewStepIds: [SCENE_STEP_ID, "select-4"], tags: ["next-coin"],
      correctFeedback: "正解！残額以下で一番大きい硬貨を選ぶので、86円以下で一番大きい50円を選びます。",
      incorrectFeedback: "不正解。決め方は、残額以下で一番大きい硬貨を選ぶことです。86円以下で一番大きいのは50円で、100円は残額より大きくて使えません。",
    },
    {
      kind: "choice",
      id: "why-not-100", prompt: "なぜ100円ではなく50円を選ぶのか", stepId: SCENE_STEP_ID,
      choices: [
        { id: "too-large", text: "100円は残額の86円より大きくて使えないから" },
        { id: "smaller", text: "50円の方が小さい硬貨だから" },
        { id: "used-twice", text: "100円はもう2枚使ったから" },
        { id: "small-first", text: "小さい硬貨から順に使う決まりだから" },
      ],
      correctAnswer: { kind: "choice", choiceId: "too-large" }, requires: null,
      reviewStepIds: [SCENE_STEP_ID, "select-4"], tags: ["why-largest-usable"],
      correctFeedback: "正解！100円は残額86円より大きくて使えないので、残額以下で一番大きい50円を選びます。",
      incorrectFeedback: "不正解。同じ額面は何枚でも使えます。決め方は、残額以下で一番大きい硬貨を選ぶことで、100円は残額86円より大きくて使えません。",
    },
  ],
  completion: {
    stepId: "select-4",
    caption: "次に選ぶ硬貨と、その理由を確かめたので、次は、図の動きとコードの対応を確かめます。",
  },
};

/** 設問の場面。2問ともフェーズ2のステップ canvas をそのまま返す（複製しない）。 */
export function getGreedyCoinsCheckScene(question: GreedyCoinsCheckQuestion): GreedyCoinsExecutionCanvasState {
  return getLearningStep(greedyCoinsExecutionContent, question.stepId).canvas;
}

validateAssessment(greedyCoinsCheckContent);
for (const question of greedyCoinsCheckContent.questions) {
  getLearningStep(greedyCoinsExecutionContent, question.stepId);
  question.reviewStepIds.forEach((id) => getLearningStep(greedyCoinsExecutionContent, id));
  validateGreedyCoinsExecutionCanvas(getGreedyCoinsCheckScene(question));
}
getLearningStep(greedyCoinsExecutionContent, greedyCoinsCheckContent.completion.stepId);
// 基準データ §3 の確定事項（場面は3枚使用後で残額86・トレイ [500, 100, 100]、
// 次に選ぶ硬貨は50）と教材の正解がずれたら落とす。
const scene = getGreedyCoinsCheckScene(greedyCoinsCheckContent.questions[0]);
if (selections.length !== 9 || next.coin !== 50 || next.remainingBefore !== 86 || next.remainingAfter !== 36
  || scene.state.remaining !== 86 || scene.state.tray.join(",") !== "500,100,100"
  || scene.state.selectedCoin !== 100) {
  throw new Error("Greedy-coins check answers must follow the verified trace");
}
