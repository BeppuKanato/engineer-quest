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

export const bubbleSortCodeCheckContent: BubbleSortCodeCheckContent = {
version: 1, kind: "code-blank-check", id: "bubble-sort-code-check", phase: 5, stageName: "コードの確認問題", code: bubbleSortCode,
instruction: "空欄に入るものを選ぶ",
retryFeedback: "不正解。もう一度、処理の目的に合うコードを選んでみよう。",
reviewLabel: "💡 この処理の動きをもう一度見る",
questions: [
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
],
completion: { caption: "基本コードの役割が確認できました！次は（別の配列や例外ケースの4問）で、自分で実装に向けた最後の土台を固めます。"},
};

export function validateBubbleSortCodeCheck(content: BubbleSortCodeCheckContent): void {
validateAssessment(content);
if (content.phase!== 5 || content.stageName!== "コードの確認問題" || content.code!== bubbleSortCode || content.questions.length!== 2) {
throw new Error("Use the phase-4 code contract and two questions");
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
