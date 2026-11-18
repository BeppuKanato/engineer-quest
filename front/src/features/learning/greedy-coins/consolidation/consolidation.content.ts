import { validateAssessment} from "../../assessment/assessment";
import { getLearningStep} from "../../review/reviewContent";
import {
greedyCoinsCounterexampleAmount, greedyCoinsCounterexampleCoins, greedyCoinsDenominations,
greedyCoinsSelections, greedyCoinsTransferAmount, runGreedyCoins,
} from "../greedyCoins";
import { greedyCoinsCode, type GreedyCoinsCodeLineId} from "../code-mapping/greedyCoinsCode";
import { greedyCoinsCodeMappingContent} from "../code-mapping/codeMapping.content";
import {
validateGreedyCoinsExecutionCanvas, type GreedyCoinsExecutionCanvasState,
} from "../execution/execution.types";
import type { GreedyCoinStatus} from "../figure/greedyCoins.types";
import type { GreedyCoinsConsolidationContent} from "./consolidation.types";

/**
* 基準データ §3 フェーズ6（転移トレース・反例トレース・反例の理解・
* フェード型 Parsons の6問）。設問数は固定数ではなく、フェーズ7
* （自分で実装）が前提とする力を一通り判断できるかで決める
* （2026-11-17 の基準）。フェーズ7のテストは、主教材（786）、転移
* （342）の全体の並び、別額面（[25, 10, 5, 1]・41）、反例の額面
* （[4, 3, 1]・6、期待値は貪欲の [4, 1, 1]）を、説明なしに使う。
* 当初の4問では、転移は次の一手だけで全体の並びが無確認であり、
* 別額面は反例（貪欲が負ける場合）でしか扱っておらず、貪欲がそのまま
* 通る別額面への転移が無確認だったため、選択形式で2問を足した。
* 別額面 [25, 10, 5, 1]・41 は基準データ §1 のフェーズ7用ケースで、
* 手続きは額面に依らないため、基本規則の直接の適用として前提に含める。
* 金額0や額面1種のような境界はフェーズ7のテストに無いため対象外とし、
* 行の内容を書く力（タイピングの段差）は教材側の判断事項として残す。
* 正解はすべて実行記録（greedyCoins.ts の selections / runGreedyCoins）
* から導く。場面は単元盤面型で組み立て、盤面検証を通す。
* 復習先はすべてフェーズ4（コードとの対応）のフレームで、新しい金額や
* 別額面の答え合わせは作らない（教材指針フェーズ6の割り切り仕様）。
*
* Parsons の互換グループ（判断）: 6行目 `result.append(coin)` と
* 7行目 `remaining -= coin` は、記録が coin のみに依存し、更新が remaining
* のみに依存するため入れ替えても動作が変わらない。共通基盤
* （assessment の interchangeableLineGroups、正解順で隣接する行のグループを
* 正規化して判定する仕組み）でそのまま扱えるため、互換グループとして実装する。
* 固定行には含めない（固定するとグループの扱いが保てない、教材指針フェーズ6）。
*/
function scene(
coins: readonly number[], coinStatuses: readonly GreedyCoinStatus[], amount: number,
remaining: number, tray: readonly number[], selectedCoin: number | null,
): GreedyCoinsExecutionCanvasState {
const canvas: GreedyCoinsExecutionCanvasState = {
data: { kind: "greedy-coins-execution"},
state: { coins, coinStatuses, amount, remaining, tray, selectedCoin},
highlights: [],
};
validateGreedyCoinsExecutionCanvas(canvas);
return canvas;
}

// Q1: 転移（342円）で100を3枚使ったところ。500は残額より大きくて使えず通過し、
// 100が今見ている額面。トレイは [100, 100, 100]、残額42。
const transferSelections = greedyCoinsSelections(greedyCoinsTransferAmount, greedyCoinsDenominations);
const transferNext = transferSelections[3];
const transferScene = scene(
greedyCoinsDenominations,
["passed", "current", "upcoming", "upcoming", "upcoming", "upcoming"],
greedyCoinsTransferAmount, transferNext.remainingBefore,
transferSelections.slice(0, 3).map((selection) => selection.coin),
100,
);
const candidateIds = greedyCoinsDenominations.map((coin) => String(coin));

// Q2: 転移（342円）の開始場面。まだ1枚も選んでいない。全体の並びを問う。
const transferResult = runGreedyCoins(greedyCoinsTransferAmount, greedyCoinsDenominations);
const transferStartScene = scene(
greedyCoinsDenominations,
["upcoming", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"],
greedyCoinsTransferAmount, greedyCoinsTransferAmount, [], null,
);

// Q3: 別額面（基準データ §1、フェーズ7の J3 と同じ [25, 10, 5, 1]・41円）の
// 開始場面。まだ1枚も選んでいない。全体の並びを問う。
const otherCoins: readonly number[] = [25, 10, 5, 1];
const otherAmount = 41;
const otherResult = runGreedyCoins(otherAmount, otherCoins);
const otherScene = scene(
otherCoins,
["upcoming", "upcoming", "upcoming", "upcoming"],
otherAmount, otherAmount, [], null,
);

// Q4: 反例（[4, 3, 1]・6円）の開始場面。まだ1枚も選んでいない。
const counterexampleScene = scene(
greedyCoinsCounterexampleCoins,
["upcoming", "upcoming", "upcoming"],
greedyCoinsCounterexampleAmount, greedyCoinsCounterexampleAmount, [], null,
);
// Q5: 反例を貪欲で払い終えた場面（トレイ [4, 1, 1]、残額0、全額面を通過）。
const counterexampleResult = runGreedyCoins(greedyCoinsCounterexampleAmount, greedyCoinsCounterexampleCoins);
const counterexampleDoneScene = scene(
greedyCoinsCounterexampleCoins,
["passed", "passed", "passed"],
greedyCoinsCounterexampleAmount, 0, counterexampleResult, null,
);

const canonicalLineIds = greedyCoinsCode.lines.map((line) => line.id) as readonly GreedyCoinsCodeLineId[];
const [firstFrame,...remainingFrames] = greedyCoinsCodeMappingContent.steps;

export const greedyCoinsConsolidationContent: GreedyCoinsConsolidationContent = {
version: 1, kind: "diagnostic-check", id: "greedy-coins-consolidation", phase: 6, stageName: "応用問題",
code: greedyCoinsCode,
reviewLabel: "💡 基本例の動き・コードをもう一度見る",
completion: "理解の状況が確認できました。それでは【自分で実装】に進み、自分の手でコードを完成させましょう！",
questions: [
{
id: "next-coin-transfer",
prompt: "342円を払っています。100円を3枚使って、残りは42円です。次に選ぶ硬貨はどれか",
scene: transferScene,
nodeIds: candidateIds, allowNone: false,
correctAnswer: { kind: "node", nodeId: String(transferNext.coin)}, requires: null,
stepId: "for-coin-10",
reviewStepIds: ["while-remaining-7", "for-coin-10", "while-remaining-8", "execution-select-5"],
tags: ["新しい金額での次に選ぶ硬貨"],
instruction: "額面の硬貨をタップして答える",
correctFeedback: "正解。残額42円以下で一番大きい硬貨は10円です。50円は残額より大きくて使えません。",
incorrectFeedback: "不正解。残額以下で一番大きい硬貨を選びます。42円以下で一番大きいのは10円で、50円は残額より大きくて使えません。",
},
{
kind: "choice", id: "transfer-full-result",
prompt: "342円を、残額以下で一番大きい硬貨をくり返し選ぶ同じ方法で払うとどうなるか",
scene: transferStartScene,
choices: [
{ id: "full-9", text: "[100, 100, 100, 10, 10, 10, 10, 1, 1] の9枚になる"},
{ id: "eight-coins", text: "[100, 100, 100, 10, 10, 10, 1, 1] の8枚になる"},
{ id: "uses-50", text: "[100, 100, 100, 50, 1, 1] の6枚になる"},
{ id: "with-5s", text: "[100, 100, 100, 10, 10, 10, 5, 5, 1, 1] の10枚になる"},
],
correctAnswer: { kind: "choice", choiceId: "full-9"}, requires: null,
stepId: "execution-select-1",
reviewStepIds: ["for-coin-500", "while-remaining-1", "execution-select-1"],
tags: ["新しい金額での払い方全体"],
instruction: "説明を1つ選ぶ",
correctFeedback: "正解。500は342円より大きくて使えず、100を3枚、10を4枚、1を2枚選んで、[100, 100, 100, 10, 10, 10, 10, 1, 1] の9枚になります。",
incorrectFeedback: "不正解。500は残額より大きくて使えません。100を3枚使うと残り42円になり、10を4枚、1を2枚選んで9枚になります。",
},
{
kind: "choice", id: "other-coins-result",
prompt: "額面が [25, 10, 5, 1] の硬貨で41円を、残額以下で一番大きい硬貨をくり返し選ぶ同じ方法で払うとどうなるか",
scene: otherScene,
choices: [
{ id: "greedy-25-10-5-1", text: "[25, 10, 5, 1] の4枚になる"},
{ id: "tens-only", text: "[10, 10, 10, 10, 1] の5枚になる"},
{ id: "skip-10", text: "[25, 5, 5, 5, 1] の5枚になる"},
{ id: "all-ones", text: "1の硬貨を41枚使う"},
],
correctAnswer: { kind: "choice", choiceId: "greedy-25-10-5-1"}, requires: null,
stepId: "execution-select-1",
reviewStepIds: ["for-coin-500", "while-remaining-1", "execution-select-1"],
tags: ["別の額面での払い方"],
instruction: "説明を1つ選ぶ",
correctFeedback: "正解。41円以下で一番大きい25、残り16円以下で一番大きい10、残り6円以下で一番大きい5、最後に1を選んで、[25, 10, 5, 1] の4枚になります。",
incorrectFeedback: "不正解。額面が変わっても決め方は同じです。残額以下で一番大きい硬貨をくり返し選ぶと、25、10、5、1 の4枚になります。",
},
{
kind: "choice", id: "counterexample-greedy-result",
prompt: "額面が [4, 3, 1] の硬貨で6円を、残額以下で一番大きい硬貨をくり返し選ぶ同じ方法で払うとどうなるか",
scene: counterexampleScene,
choices: [
{ id: "optimal-3-3", text: "[3, 3] の2枚になる"},
{ id: "greedy-4-1-1", text: "[4, 1, 1] の3枚になる"},
{ id: "ones-six", text: "[1, 1, 1, 1, 1, 1] の6枚になる"},
{ id: "start-from-3", text: "[3, 1, 1, 1] の4枚になる"},
],
correctAnswer: { kind: "choice", choiceId: "greedy-4-1-1"}, requires: null,
stepId: "execution-select-1",
reviewStepIds: ["for-coin-500", "while-remaining-1", "execution-select-1"],
tags: ["別の額面での貪欲な払い方"],
instruction: "説明を1つ選ぶ",
correctFeedback: "正解。最初に残額以下で一番大きい4を選び、残り2円は1の硬貨2枚で払うので、[4, 1, 1] の3枚になります。",
incorrectFeedback: "不正解。同じ方法では、まず残額以下で一番大きい4を選びます。残り2円は3より小さいので、1の硬貨2枚で払い、[4, 1, 1] の3枚になります。",
},
{
kind: "choice", id: "counterexample-why-greedy-loses",
prompt: "額面が [4, 3, 1] の硬貨で6円を払うとき、一番少ない払い方と、同じ方法が負ける理由はどれか",
scene: counterexampleDoneScene,
choices: [
{ id: "greedy-is-best", text: "一番少ないのは [4, 1, 1] の3枚で、同じ方法の払い方がそのまま一番少ないから"},
{ id: "optimal-and-reason", text: "一番少ないのは [3, 3] の2枚。最初に一番大きい4を選ぶと、残り2を1の硬貨で埋めるしかなくなるから"},
{ id: "one-large-only", text: "一番少ないのは [3, 3] の2枚。大きい硬貨は1枚だけ使う決まりだから"},
{ id: "ones-are-best", text: "一番少ないのは [1, 1, 1, 1, 1, 1] の6枚。小さい硬貨の方が金額を細かく合わせられるから"},
],
correctAnswer: { kind: "choice", choiceId: "optimal-and-reason"}, requires: null,
stepId: "while-remaining-1",
reviewStepIds: ["while-remaining-1", "execution-select-1", "subtract-coin-1"],
tags: ["貪欲が最適にならない理由"],
instruction: "説明を1つ選ぶ",
correctFeedback: "正解。一番少ないのは [3, 3] の2枚です。最初に一番大きい4を選ぶと残りが2円になり、1の硬貨で埋めるしかなくなるため、貪欲は3枚かかります。",
incorrectFeedback: "不正解。一番少ないのは [3, 3] の2枚です。貪欲に最初に4を選ぶと残り2円を1の硬貨で埋めるしかなくなり、3枚になって負けます。",
},
{
kind: "parsons", id: "whole-code-order",
prompt: "貪欲法のコードを、実行の流れに合う順序に並べてください。",
lineIds: [
"while-remaining", "define-function", "append-coin", "init-remaining",
"return-result", "subtract-coin", "for-coin", "init-result",
],
correctAnswer: { kind: "order", lineIds: canonicalLineIds}, requires: null,
// フェード型: 関数定義と最後の return は固定し、二重ループの中の流れだけを並べ替える（1セグメント）。
fixedLineIds: ["define-function", "return-result"],
// 記録する行と残額を減らす行は入れ替えても動作が変わらないため互換グループとする。
interchangeableLineGroups: [["append-coin", "subtract-coin"]],
stepId: firstFrame.id, reviewStepIds: [firstFrame.id,...remainingFrames.map((frame) => frame.id)],
tags: ["コード全体の流れ"],
instruction: "色の薄い行は固定されています。残りの行をドラッグ、または↑↓ボタンで並び替える",
definitions: "amount = 払う金額、coins = 額面のリスト（大きい順）、result = 選んだ硬貨のリスト、remaining = 残額、coin = 今見ている額面",
correctFeedback: "正解。結果と残額を用意し、額面を大きい順に見て、残額が額面以上である間その硬貨を記録して残額を減らし、最後に結果を返す流れを組み立てられました。",
incorrectFeedback: "不正解。結果と残額の用意、額面を大きい順に見る繰り返し、その額面を使える間の繰り返し、記録と残額の更新、最後に結果を返す、という流れを確かめてみましょう。",
},
],
};

export function validateGreedyCoinsConsolidation(content: GreedyCoinsConsolidationContent): void {
validateAssessment(content);
if (content.phase!== 6 || content.stageName!== "応用問題" || content.questions.length!== 6 || content.code!== greedyCoinsCode) {
throw new Error("Use six questions and the canonical code");
}
for (const question of content.questions) {
getLearningStep(greedyCoinsCodeMappingContent, question.stepId);
question.reviewStepIds.forEach((id) => getLearningStep(greedyCoinsCodeMappingContent, id));
if ("kind" in question && question.kind === "parsons") {
if (question.lineIds.length!== canonicalLineIds.length
|| question.lineIds.some((id) =>!canonicalLineIds.includes(id as GreedyCoinsCodeLineId))) {
throw new Error("Parsons must use exactly the canonical lines");
}
if (question.correctAnswer.lineIds.some((id, index) => id!== canonicalLineIds[index])) {
throw new Error("Parsons answer must follow the canonical order");
}
if (JSON.stringify(question.fixedLineIds)!== JSON.stringify(["define-function", "return-result"])) {
throw new Error("Parsons must fix only the definition and return lines");
}
if (JSON.stringify(question.interchangeableLineGroups)!== JSON.stringify([["append-coin", "subtract-coin"]])) {
throw new Error("Parsons must treat append and subtract as one interchangeable group");
}
} else if ("scene" in question) {
validateGreedyCoinsExecutionCanvas(question.scene);
}
}
// Q1は転移用の実行記録と一致しなければならない（場面・回答対象・正解）。
// タップ設問はフェーズ3と同じく kind を持たない（NodeTapQuestion の形）。
const tap = content.questions[0];
if ("kind" in tap) throw new Error("First question must be a tap question");
if (tap.correctAnswer.kind!== "node" || tap.correctAnswer.nodeId!== String(transferNext.coin)
|| tap.scene.state.remaining!== 42 || tap.scene.state.tray.join(",")!== "100,100,100"
|| tap.nodeIds.length!== candidateIds.length || tap.nodeIds.some((id) =>!candidateIds.includes(id))) {
throw new Error("Transfer question must follow the verified transfer trace");
}
}
// 基準データ §1・§3 の確定事項（転移342は100×3の次が10で残額42、全体は
// 9枚、別額面41は [25, 10, 5, 1] の4枚、反例は貪欲 [4, 1, 1] の3枚・
// 最適 [3, 3] の2枚）と教材がずれたら落とす。
if (transferSelections.length!== 9 || transferNext.coin!== 10 || transferNext.remainingBefore!== 42
|| transferResult.join(",")!== "100,100,100,10,10,10,10,1,1" || transferResult.length!== 9
|| otherResult.join(",")!== "25,10,5,1" || otherResult.length!== 4
|| counterexampleResult.join(",")!== "4,1,1" || counterexampleResult.length!== 3) {
throw new Error("Greedy-coins consolidation cases must follow the verified traces");
}
validateGreedyCoinsConsolidation(greedyCoinsConsolidationContent);
