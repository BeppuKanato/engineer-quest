import { validateAssessment} from "../../assessment/assessment";
import { getLearningStep} from "../../review/reviewContent";
import { mazeDiggingCode, mazeDiggingCodeLineNumber, type MazeDiggingCodeLineId} from "../code-mapping/mazeDiggingCode";
import { mazeDiggingCodeMappingContent} from "../code-mapping/codeMapping.content";
import type { MazeDiggingCodeCheckContent, MazeDiggingCodeQuestion} from "./codeCheck.types";

export function codeLine(lineId: MazeDiggingCodeLineId) {
const line = mazeDiggingCode.lines.find(line => line.id === lineId);
if (!line) throw new Error(`Unknown code line: ${lineId}`);
return line;
}

/**
* 空欄位置は、文脈（前後の文字列）の中で一度だけ現れるトークンとして求める。
* 対象の数値（Q1の「2」、Q2の「1」）は行内の他の場所にも現れるため、
* BFSの「行内で一意なトークン」方式では位置を特定できない。文脈で一意化しても
* 空欄そのものは数値部分だけになる。
*
* Q1の行は `nx, ny = x + 2 * dx, y + 2 * dy` で、基準データ §3 は両方の「2」を
* 空欄として示すが、共通の code-blank 形式は1問1空欄のため、読み順で先の
* dx 側の「2」だけを空欄にする。dy 側も同じ値で決まることはフィードバック文で補う
* （この扱いは暫定で、実施記録 docs/maze-digging-phase5-261.md に留保として明記）。
*/
function blankWithin(lineId: MazeDiggingCodeLineId, context: string, token: string) {
const text = codeLine(lineId).text;
const contextStart = text.indexOf(context);
if (contextStart < 0 || text.indexOf(context, contextStart + 1)!== -1) throw new Error("Blank context must occur once");
const slice = text.slice(contextStart, contextStart + context.length);
const at = slice.indexOf(token);
if (at < 0 || slice.indexOf(token, at + token.length)!== -1) throw new Error("Blank token must occur once in context");
return { start: contextStart + at, length: token.length};
}

export function fillCodeBlank(question: MazeDiggingCodeQuestion, replacement: string): string {
const text = codeLine(question.lineId).text;
return text.slice(0, question.blank.start) + replacement + text.slice(question.blank.start + question.blank.length);
}

export const mazeDiggingCodeCheckContent: MazeDiggingCodeCheckContent = {
version: 1, kind: "code-blank-check", id: "maze-digging-code-check", phase: 5, stageName: "コードの確認問題", code: mazeDiggingCode,
instruction: "空欄に入るものを選ぶ",
retryFeedback: "不正解。もう一度、処理の目的に合うコードを選んでみよう。",
reviewLabel: "💡 この処理の動きをもう一度見る",
questions: [
{
kind: "code-blank", id: "next-room-distance", lineId: "compute-next",
prompt: `掘る部屋の座標（2マス先）を求めるために、${mazeDiggingCodeLineNumber("compute-next")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("compute-next", "x + 2 * dx", "2"),
choices: [{ id: "one", text: "1"}, { id: "two", text: "2"}, { id: "three", text: "3"}],
correctAnswer: { kind: "choice", choiceId: "two"}, requires: null,
stepId: "compute-next-1-2", reviewLineId: "compute-next", reviewStepIds: ["for-direction-1-2", "compute-next-1-2"],
tags: ["next-room-distance"], correctFeedback: "正解！掘るのは2マス先の部屋なので、進む量は方向の2倍です。",
incorrectFeedback: "不正解。掘るのは2マス先の部屋なので、進む量は方向の2倍になります。",
},
{
kind: "code-blank", id: "undug-room-condition", lineId: "if-diggable",
prompt: `まだ掘っていない部屋かどうかを調べるために、${mazeDiggingCodeLineNumber("if-diggable")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("if-diggable", "grid[ny][nx] == 1", "1"),
choices: [{ id: "zero", text: "0"}, { id: "one", text: "1"}, { id: "two", text: "2"}],
correctAnswer: { kind: "choice", choiceId: "one"}, requires: null,
stepId: "if-diggable-1-2", reviewLineId: "if-diggable", reviewStepIds: ["compute-next-1-2", "if-diggable-1-2"],
tags: ["undug-condition"], correctFeedback: "正解！グリッドの1は壁のままを表すので、まだ掘っていない部屋の条件になります。",
incorrectFeedback: "不正解。グリッドの1は壁のままを表すので、まだ掘っていない部屋の条件になります。",
},
],
completion: { caption: "基本コードの役割が確認できました！次は（別の盤面や例外ケースの4問）で、自分で実装に向けた最後の土台を固めます。"},
};

export function validateMazeDiggingCodeCheck(content: MazeDiggingCodeCheckContent): void {
validateAssessment(content);
if (content.phase!== 5 || content.stageName!== "コードの確認問題" || content.code!== mazeDiggingCode || content.questions.length!== 2) {
throw new Error("Use the phase-4 code contract and two questions");
}
for (const question of content.questions) {
const line = codeLine(question.lineId);
const correct = question.choices.find(choice => choice.id === question.correctAnswer.choiceId)!;
if (question.blank.start + question.blank.length > line.text.length || fillCodeBlank(question, correct.text)!== line.text) {
throw new Error("Correct choice must restore the exact source line");
}
const review = question.reviewStepIds.map(id => getLearningStep(mazeDiggingCodeMappingContent, id));
if (question.reviewLineId!== question.lineId || review.at(-1)!.canvas.highlights[0].id!== question.reviewLineId ||
getLearningStep(mazeDiggingCodeMappingContent, question.stepId).canvas.highlights[0].id!== question.lineId) {
throw new Error("Review must show the target code line");
}
}
}
validateMazeDiggingCodeCheck(mazeDiggingCodeCheckContent);
