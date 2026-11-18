import { validateAssessment } from "../../assessment/assessment";
import { getLearningStep } from "../../review/reviewContent";
import {
  greedyCoinsDenominations, greedyCoinsMainAmount, greedyCoinsSelections,
} from "../greedyCoins";
import { greedyCoinsExecutionContent } from "../execution/execution.content";
import {
  validateGreedyCoinsExecutionCanvas, type GreedyCoinsExecutionCanvasState,
} from "../execution/execution.types";
import type { GreedyCoinsCheckContent, GreedyCoinsCheckQuestion } from "./check.types";

/**
 * 基準データ §3 フェーズ3（6問）。設問数は固定数ではなく、フェーズ4
 * （動きとコードの対応）が前提とする理解を一通り判断できるかで決める
 * （2026-11-17 の基準）。フェーズ4は、選択の規則（残額以下で一番大きい
 * 硬貨を選ぶ）、同じ額面の繰り返し使用、使えなくなった額面を過ぎて
 * 小さい額面へ進むこと、選んだ分だけ残額が減ること、残額0で終わる
 * ことを、説明なしにトレースで使う。当初の2問（select-3 の次の一手と
 * その理由）は規則の1場面しか見ておらず、繰り返し使用は Q2 の誤答
 * 選択肢と誤答解説での言及のみ、額面の前進は理由を聞くだけで進んだ先を
 * 選ぶ問題がなく、残額の更新と終了は無確認だったため、場面を分けて
 * 4問を足した。場面はフェーズ2のステップをステップIDで参照し、盤面を
 * 複製しない。正解はすべて実行記録（selections）から導く。
 * タップ設問の回答対象は額面列の全額面とする。同じ額面は何枚でも
 * 使えるため候補から外さず、「残額より大きい硬貨は使えない」ことを
 * 通過した額面も含めて判断させる。
 */
const selections = greedyCoinsSelections(greedyCoinsMainAmount, greedyCoinsDenominations);
const candidateIds = greedyCoinsDenominations.map((coin) => String(coin));

export const greedyCoinsCheckContent: GreedyCoinsCheckContent = {
  version: 1, kind: "concept-check", id: "greedy-coins-check", phase: 3, stageName: "動きの確認問題",
  questions: [
    {
      id: "next-coin", prompt: "残りは86円です。次に選ぶ硬貨はどれか", stepId: "select-3",
      nodeIds: candidateIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: String(selections[3].coin) }, requires: null,
      reviewStepIds: ["select-3", "select-4"], tags: ["next-coin"],
      correctFeedback: "正解！残額以下で一番大きい硬貨を選ぶので、86円以下で一番大きい50円を選びます。",
      incorrectFeedback: "不正解。決め方は、残額以下で一番大きい硬貨を選ぶことです。86円以下で一番大きいのは50円で、100円は残額より大きくて使えません。",
    },
    {
      kind: "choice",
      id: "why-not-100", prompt: "なぜ100円ではなく50円を選ぶのか", stepId: "select-3",
      choices: [
        { id: "too-large", text: "100円は残額の86円より大きくて使えないから" },
        { id: "smaller", text: "50円の方が小さい硬貨だから" },
        { id: "used-twice", text: "100円はもう2枚使ったから" },
        { id: "small-first", text: "小さい硬貨から順に使う決まりだから" },
      ],
      correctAnswer: { kind: "choice", choiceId: "too-large" }, requires: null,
      reviewStepIds: ["select-3", "select-4"], tags: ["why-largest-usable"],
      correctFeedback: "正解！100円は残額86円より大きくて使えないので、残額以下で一番大きい50円を選びます。",
      incorrectFeedback: "不正解。同じ額面は何枚でも使えます。決め方は、残額以下で一番大きい硬貨を選ぶことで、100円は残額86円より大きくて使えません。",
    },
    {
      id: "next-coin-repeat", prompt: "残りは186円です。次に選ぶ硬貨はどれか", stepId: "select-2",
      nodeIds: candidateIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: String(selections[2].coin) }, requires: null,
      reviewStepIds: ["select-2", "select-3"], tags: ["same-coin-repeat"],
      correctFeedback: "正解！残額186円以下で一番大きい硬貨は100円なので、さっき使った100円をもう1枚選びます。同じ額面は何枚でも使えます。",
      incorrectFeedback: "不正解。決め方は、残額以下で一番大きい硬貨を選ぶことです。残額186円以下で一番大きいのは100円で、同じ額面は何枚でも使えます。",
    },
    {
      id: "next-coin-move-down", prompt: "残りは36円です。次に選ぶ硬貨はどれか", stepId: "select-4",
      nodeIds: candidateIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: String(selections[4].coin) }, requires: null,
      reviewStepIds: ["select-4", "select-5"], tags: ["move-to-smaller-coin"],
      correctFeedback: "正解！50円は残額36円より大きくて使えないので、次に小さい10円を選びます。",
      incorrectFeedback: "不正解。決め方は、残額以下で一番大きい硬貨を選ぶことです。50円は残額36円より大きくて使えないので、10円を選びます。",
    },
    {
      kind: "choice",
      id: "remaining-after-next", prompt: "残りは16円です。次に10円を選ぶと、残りは何円になりますか", stepId: "select-6",
      choices: [
        { id: "six", text: "6円" },
        { id: "zero", text: "0円" },
        { id: "sixteen", text: "16円のまま" },
        { id: "twenty-six", text: "26円" },
      ],
      correctAnswer: { kind: "choice", choiceId: "six" }, requires: null,
      reviewStepIds: ["select-6", "select-7"], tags: ["remaining-update"],
      correctFeedback: "正解！選んだ硬貨の分だけ残額が減るので、16 − 10 = 6円になります。",
      incorrectFeedback: "不正解。選んだ硬貨の分だけ残額が減ります。16 − 10 = 6円になります。",
    },
    {
      kind: "choice",
      id: "payment-finished", prompt: "残りが0円になりました。この方法での支払いは、この後どうなりますか", stepId: "summary",
      choices: [
        { id: "finished", text: "払い終わりで、もう硬貨は選ばない" },
        { id: "one-more-1", text: "最後に1円硬貨を1枚選ぶ" },
        { id: "restart", text: "500円に戻って、もう一度払い始める" },
        { id: "choose-5-anyway", text: "残額が0でも、5円硬貨を1枚選ぶ" },
      ],
      correctAnswer: { kind: "choice", choiceId: "finished" }, requires: null,
      reviewStepIds: ["select-9", "summary"], tags: ["payment-finished"],
      correctFeedback: "正解！残額が0円になったら払い終わりで、それ以上は硬貨を選びません。",
      incorrectFeedback: "不正解。残額が0円になったら払い終わりです。それ以上は硬貨を選びません。",
    },
  ],
  completion: {
    stepId: "select-4",
    caption: "次に選ぶ硬貨の決め方と、残額の変わり方、払い終わる条件を確かめたので、次は、図の動きとコードの対応を確かめます。",
  },
};

/** 設問の場面。どの設問もフェーズ2のステップ canvas をそのまま返す（複製しない）。 */
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
if (selections.length !== 9 || selections[3].coin !== 50 || selections[3].remainingBefore !== 86 || selections[3].remainingAfter !== 36
  || scene.state.remaining !== 86 || scene.state.tray.join(",") !== "500,100,100"
  || scene.state.selectedCoin !== 100) {
  throw new Error("Greedy-coins check answers must follow the verified trace");
}
// 追加した4問の場面と正解も実行記録と一致しなければならない
// （繰り返し使用は3枚目の選択、額面の前進は5枚目の選択、残額の更新は
// 7枚目の選択の直後の残額、終了は残額0の完成盤面）。
const repeatScene = getGreedyCoinsCheckScene(greedyCoinsCheckContent.questions[2]);
const moveDownScene = getGreedyCoinsCheckScene(greedyCoinsCheckContent.questions[3]);
const remainingScene = getGreedyCoinsCheckScene(greedyCoinsCheckContent.questions[4]);
const finishedScene = getGreedyCoinsCheckScene(greedyCoinsCheckContent.questions[5]);
if (selections[2].coin !== 100 || selections[2].remainingBefore !== 186
  || repeatScene.state.remaining !== 186 || repeatScene.state.tray.join(",") !== "500,100"
  || selections[4].coin !== 10 || selections[4].remainingBefore !== 36
  || moveDownScene.state.remaining !== 36 || moveDownScene.state.tray.join(",") !== "500,100,100,50"
  || selections[6].coin !== 10 || selections[6].remainingBefore !== 16 || selections[6].remainingAfter !== 6
  || remainingScene.state.remaining !== 16
  || finishedScene.state.remaining !== 0 || finishedScene.state.tray.length !== 9) {
  throw new Error("Greedy-coins check expansion answers must follow the verified trace");
}
