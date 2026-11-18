import { validateAssessment} from "../../assessment/assessment";
import { getLearningStep} from "../../review/reviewContent";
import { bubbleSortCode, bubbleSortCodeLineNumber, type BubbleSortCodeLineId} from "../code-mapping/bubbleSortCode";
import { bubbleSortCodeMappingContent} from "../code-mapping/codeMapping.content";
import type { BubbleSortCodeCheckContent, BubbleSortCodeQuestion} from "./codeCheck.types";

export function codeLine(lineId: BubbleSortCodeLineId) {
const line = bubbleSortCode.lines.find(line => line.id === lineId);
if (!line) throw new Error(`Unknown code line: ${lineId}`);
return line;
}

/** 行内で一度だけ現れるトークンを空欄にする（BFS方式）。 */
function blankAt(lineId: BubbleSortCodeLineId, token: string) {
const text = codeLine(lineId).text;
const start = text.indexOf(token);
if (start < 0 || text.indexOf(token, start + token.length)!== -1) throw new Error("Blank token must occur once");
return { start, length: token.length};
}

/**
* 空欄位置は、文脈（前後の文字列）の中で一度だけ現れるトークンとして求める。
* Q1の対象「i」は行内の他の場所（in など）にも現れるため、
* BFSの「行内で一意なトークン」方式では位置を特定できない。文脈で一意化しても
* 空欄そのものは対象の式だけになる。
*/
function blankWithin(lineId: BubbleSortCodeLineId, context: string, token: string) {
const text = codeLine(lineId).text;
const contextStart = text.indexOf(context);
if (contextStart < 0 || text.indexOf(context, contextStart + 1)!== -1) throw new Error("Blank context must occur once");
const slice = text.slice(contextStart, contextStart + context.length);
const at = slice.indexOf(token);
if (at < 0 || slice.indexOf(token, at + token.length)!== -1) throw new Error("Blank token must occur once in context");
return { start: contextStart + at, length: token.length};
}

export function fillCodeBlank(question: BubbleSortCodeQuestion, replacement: string): string {
const text = codeLine(question.lineId).text;
return text.slice(0, question.blank.start) + replacement + text.slice(question.blank.start + question.blank.length);
}

/**
* フェーズ5（コードの確認問題）。設問数と内訳は固定数ではなく、フェーズ6が
* 前提とする「流れとコードの対応づけ」を一通り判断できるかで決める
* （2026-11-17 の基準）。参照コード8行のうち、既存2問が対象にしていたのは
* for-compare 行と if-larger 行の一部だけで、次の行は未カバーだったため、
* 1行に1問ずつ（if-larger 行は相手の位置と比較の向きで2問）足した。
* - copy-values: 元を変えないコピー（フェーズ7の契約「新しいリストを返す」の前提）
* - count-values: 個数を入れる変数 n（両ループの範囲の前提）
* - for-pass: 周の回数 n - 1（フェーズ6の追跡・Parsons の前提）
* - swap-values: 入れ替えの代入そのもの（フェーズ6 Parsons とフェーズ7の前提）
* - return-result: 返すのは並び替えた result（コピーの契約の出口）
* - if-larger の比較記号: 左が大きいときだけ、という向き（フェーズ6の理由問題の前提）
*/
export const bubbleSortCodeCheckContent: BubbleSortCodeCheckContent = {
version: 1, kind: "code-blank-check", id: "bubble-sort-code-check", phase: 5, stageName: "コードの確認問題", code: bubbleSortCode,
instruction: "空欄に入るものを選ぶ",
retryFeedback: "不正解。もう一度、処理の目的に合うコードを選んでみよう。",
reviewLabel: "💡 この処理の動きをもう一度見る",
questions: [
{
kind: "code-blank", id: "copy-input", lineId: "copy-values",
prompt: `元のリストを変えずに並び替えるために、${bubbleSortCodeLineNumber("copy-values")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankAt("copy-values", "list(values)"),
choices: [{ id: "list-values", text: "list(values)"}, { id: "values", text: "values"}, { id: "len-values", text: "len(values)"}],
correctAnswer: { kind: "choice", choiceId: "list-values"}, requires: null,
stepId: "execution-initial", reviewLineId: "copy-values", reviewStepIds: ["define-function", "execution-initial"],
tags: ["copy-input"], correctFeedback: "正解！list(values) でコピーを作るので、元のリストを変えずに並び替えられます。",
incorrectFeedback: "不正解。list(values) でコピーを作るので、元のリストを変えずに並び替えられます。",
},
{
kind: "code-blank", id: "count-values-blank", lineId: "count-values",
prompt: `要素の個数を入れておく変数を決めるために、${bubbleSortCodeLineNumber("count-values")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("count-values", "n =", "n"),
choices: [{ id: "n", text: "n"}, { id: "i", text: "i"}, { id: "j", text: "j"}],
correctAnswer: { kind: "choice", choiceId: "n"}, requires: null,
stepId: "count-values", reviewLineId: "count-values", reviewStepIds: ["execution-initial", "count-values"],
tags: ["count-values"], correctFeedback: "正解！個数は n に入れて、両方のループの範囲で使います。",
incorrectFeedback: "不正解。個数は n に入れて、両方のループの範囲で使います。",
},
{
kind: "code-blank", id: "outer-loop-range", lineId: "for-pass",
prompt: `周の回数を決めるために、${bubbleSortCodeLineNumber("for-pass")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankAt("for-pass", "n - 1"),
choices: [{ id: "n-minus-one", text: "n - 1"}, { id: "n", text: "n"}, { id: "n-plus-one", text: "n + 1"}],
correctAnswer: { kind: "choice", choiceId: "n-minus-one"}, requires: null,
stepId: "for-pass-0", reviewLineId: "for-pass", reviewStepIds: ["count-values", "for-pass-0"],
tags: ["pass-count"], correctFeedback: "正解！最後に残る1つのマスは比べる相手がいないので、周は n - 1 回で足ります。",
incorrectFeedback: "不正解。最後に残る1つのマスは比べる相手がいないので、周は n - 1 回で足ります。",
},
{
kind: "code-blank", id: "inner-loop-range", lineId: "for-compare",
prompt: `周が進むにつれて比べる範囲を狭めるために、${bubbleSortCodeLineNumber("for-compare")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("for-compare", "n - 1 - i", "i"),
choices: [{ id: "one", text: "1"}, { id: "i", text: "i"}, { id: "n", text: "n"}],
correctAnswer: { kind: "choice", choiceId: "i"}, requires: null,
stepId: "for-compare-1-0", reviewLineId: "for-compare", reviewStepIds: ["for-pass-0", "for-compare-1-0"],
tags: ["range-shrink"], correctFeedback: "正解！周が進むごとに右端の確定範囲が広がるため、比べる範囲は i のぶんだけ狭くなります。",
incorrectFeedback: "不正解。周が進むごとに右端の確定範囲が広がるため、比べる範囲は i のぶんだけ狭くなります。",
},
{
kind: "code-blank", id: "swap-condition", lineId: "if-larger",
prompt: `左の要素と比べる相手を決めるために、${bubbleSortCodeLineNumber("if-larger")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankAt("if-larger", "j + 1"),
choices: [{ id: "j-plus-one", text: "j + 1"}, { id: "j", text: "j"}, { id: "j-minus-one", text: "j - 1"}],
correctAnswer: { kind: "choice", choiceId: "j-plus-one"}, requires: null,
stepId: "if-larger-1-0", reviewLineId: "if-larger", reviewStepIds: ["for-compare-1-0", "if-larger-1-0"],
tags: ["right-neighbor"], correctFeedback: "正解！比べるのは右隣の要素なので、相手の位置は j + 1 です。",
incorrectFeedback: "不正解。比べるのは右隣の要素なので、相手の位置は j + 1 になります。",
},
{
kind: "code-blank", id: "compare-operator", lineId: "if-larger",
prompt: `左が大きいときにだけ入れ替えるために、${bubbleSortCodeLineNumber("if-larger")}行目の空欄に入る正しい記号を選んでください。`,
blank: blankAt("if-larger", ">"),
choices: [{ id: "greater", text: ">"}, { id: "less", text: "<"}, { id: "equal", text: "=="}],
correctAnswer: { kind: "choice", choiceId: "greater"}, requires: null,
stepId: "if-larger-1-2", reviewLineId: "if-larger", reviewStepIds: ["for-compare-1-2", "if-larger-1-2"],
tags: ["compare-operator"], correctFeedback: "正解！左が右より大きい（ > ）ときだけ入れ替えるので、大きい値が右へ進みます。",
incorrectFeedback: "不正解。左が右より大きい（ > ）ときだけ入れ替えるので、大きい値が右へ進みます。",
},
{
kind: "code-blank", id: "swap-assignment", lineId: "swap-values",
prompt: `2つの値を入れ替えるために、${bubbleSortCodeLineNumber("swap-values")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankAt("swap-values", "result[j + 1], result[j]"),
choices: [{ id: "reversed", text: "result[j + 1], result[j]"}, { id: "same-order", text: "result[j], result[j + 1]"}, { id: "both-left", text: "result[j], result[j]"}],
correctAnswer: { kind: "choice", choiceId: "reversed"}, requires: null,
stepId: "execution-compare-1-0", reviewLineId: "swap-values", reviewStepIds: ["if-larger-1-0", "execution-compare-1-0"],
tags: ["swap-assignment"], correctFeedback: "正解！右側に逆の順で並べると、2つの値がそのまま入れ替わります。",
incorrectFeedback: "不正解。右側に逆の順で並べると、2つの値がそのまま入れ替わります。",
},
{
kind: "code-blank", id: "return-result-blank", lineId: "return-result",
prompt: `並び替えたリストを返すために、${bubbleSortCodeLineNumber("return-result")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankAt("return-result", "result"),
choices: [{ id: "result", text: "result"}, { id: "values", text: "values"}, { id: "n", text: "n"}],
correctAnswer: { kind: "choice", choiceId: "result"}, requires: null,
stepId: "return-result", reviewLineId: "return-result", reviewStepIds: ["execution-complete", "return-result"],
tags: ["return-copy"], correctFeedback: "正解！返すのは並び替えた result で、元の values はそのまま残ります。",
incorrectFeedback: "不正解。返すのは並び替えた result で、元の values はそのまま残ります。",
},
],
completion: { caption: "基本コードの役割が確認できました！次は（別の配列や例外ケースの6問）で、自分で実装に向けた最後の土台を固めます。"},
};

export function validateBubbleSortCodeCheck(content: BubbleSortCodeCheckContent): void {
validateAssessment(content);
if (content.phase!== 5 || content.stageName!== "コードの確認問題" || content.code!== bubbleSortCode || content.questions.length!== 8) {
throw new Error("Use the phase-4 code contract and eight questions");
}
for (const question of content.questions) {
const line = codeLine(question.lineId);
const correct = question.choices.find(choice => choice.id === question.correctAnswer.choiceId)!;
if (question.blank.start + question.blank.length > line.text.length || fillCodeBlank(question, correct.text)!== line.text) {
throw new Error("Correct choice must restore the exact source line");
}
const review = question.reviewStepIds.map(id => getLearningStep(bubbleSortCodeMappingContent, id));
if (question.reviewLineId!== question.lineId || review.at(-1)!.canvas.highlights[0].id!== question.reviewLineId ||
getLearningStep(bubbleSortCodeMappingContent, question.stepId).canvas.highlights[0].id!== question.lineId) {
throw new Error("Review must show the target code line");
}
}
}
validateBubbleSortCodeCheck(bubbleSortCodeCheckContent);
