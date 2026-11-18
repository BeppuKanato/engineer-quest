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
kind: "code-blank", id: "grid-size", lineId: "initialize-grid",
prompt: `盤面のグリッドを用意するために、${mazeDiggingCodeLineNumber("initialize-grid")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("initialize-grid", "* size", "size"),
choices: [{ id: "size", text: "size"}, { id: "size-minus-one", text: "size - 1"}, { id: "size-plus-one", text: "size + 1"}],
correctAnswer: { kind: "choice", choiceId: "size"}, requires: null,
stepId: "execution-all-walls", reviewLineId: "initialize-grid", reviewStepIds: ["define-function", "execution-all-walls"],
tags: ["grid-size"], correctFeedback: "正解！グリッドは盤面の大きさsizeの正方形なので、1辺の長さはsizeです。",
incorrectFeedback: "不正解。グリッドは盤面の大きさsizeの正方形なので、1辺の長さはsizeになります。",
},
{
kind: "code-blank", id: "dig-start-cell", lineId: "dig-start",
prompt: `掘り始める部屋を掘るために、${mazeDiggingCodeLineNumber("dig-start")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("dig-start", "[1] = 0", "1"),
choices: [{ id: "one", text: "1"}, { id: "zero", text: "0"}, { id: "two", text: "2"}],
correctAnswer: { kind: "choice", choiceId: "one"}, requires: null,
stepId: "execution-dig-start", reviewLineId: "dig-start", reviewStepIds: ["define-directions", "execution-dig-start"],
tags: ["dig-start-cell"], correctFeedback: "正解！スタートの部屋は両方の位置が1のマスなので、空欄には1が入ります。",
incorrectFeedback: "不正解。スタートの部屋は両方の位置が1のマスなので、空欄には1が入ります。",
},
{
kind: "code-blank", id: "initial-stack", lineId: "initialize-stack",
prompt: `掘った部屋をためるstackの最初の状態を作るために、${mazeDiggingCodeLineNumber("initialize-stack")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("initialize-stack", "stack = [(1, 1)]", "(1, 1)"),
choices: [{ id: "one-one", text: "(1, 1)"}, { id: "zero-zero", text: "(0, 0)"}, { id: "one-zero", text: "(1, 0)"}],
correctAnswer: { kind: "choice", choiceId: "one-one"}, requires: null,
stepId: "initialize-stack", reviewLineId: "initialize-stack", reviewStepIds: ["execution-dig-start", "initialize-stack"],
tags: ["initial-stack"], correctFeedback: "正解！stackには最初にスタートの部屋 (1, 1) だけが入ります。",
incorrectFeedback: "不正解。stackには最初にスタートの部屋 (1, 1) だけが入ります。",
},
{
kind: "code-blank", id: "current-room-top", lineId: "current-room",
prompt: `現在マスをstackの一番上から決めるために、${mazeDiggingCodeLineNumber("current-room")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("current-room", "stack[-1]", "-1"),
choices: [{ id: "minus-one", text: "-1"}, { id: "zero", text: "0"}, { id: "one", text: "1"}],
correctAnswer: { kind: "choice", choiceId: "minus-one"}, requires: null,
stepId: "current-room-1", reviewLineId: "current-room", reviewStepIds: ["while-stack-1", "current-room-1"],
tags: ["current-room"], correctFeedback: "正解！stackの一番上（最後に入れた部屋）は、添字-1で表します。",
incorrectFeedback: "不正解。stackの一番上（最後に入れた部屋）は、添字-1で表します。",
},
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
{
kind: "code-blank", id: "append-candidate-order", lineId: "append-candidate",
prompt: `掘れる部屋を候補に加えるために、${mazeDiggingCodeLineNumber("append-candidate")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("append-candidate", "candidates.append((nx, ny))", "(nx, ny)"),
choices: [{ id: "nx-ny", text: "(nx, ny)"}, { id: "ny-nx", text: "(ny, nx)"}, { id: "x-y", text: "(x, y)"}],
correctAnswer: { kind: "choice", choiceId: "nx-ny"}, requires: null,
stepId: "append-candidate-1-2", reviewLineId: "append-candidate", reviewStepIds: ["compute-next-1-2", "append-candidate-1-2"],
tags: ["append-candidate"], correctFeedback: "正解！候補に加えるのは、今求めた2マス先の部屋 (nx, ny) です。",
incorrectFeedback: "不正解。候補に加えるのは、今求めた2マス先の部屋 (nx, ny) になります。",
},
{
kind: "code-blank", id: "choose-by-step", lineId: "choose-candidate",
prompt: `候補の中から掘る部屋を番号で選ぶために、${mazeDiggingCodeLineNumber("choose-candidate")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("choose-candidate", "choices[step]", "step"),
choices: [{ id: "step", text: "step"}, { id: "step-plus-one", text: "step + 1"}, { id: "zero", text: "0"}],
correctAnswer: { kind: "choice", choiceId: "step"}, requires: null,
stepId: "choose-candidate-1", reviewLineId: "choose-candidate", reviewStepIds: ["if-candidates-1", "choose-candidate-1"],
tags: ["choose-candidate"], correctFeedback: "正解！使う番号はchoicesのstep番目で、掘るたびにstepが1つ進みます。",
incorrectFeedback: "不正解。使う番号はchoicesのstep番目で、掘るたびにstepが1つ進みます。",
},
{
kind: "code-blank", id: "between-midpoint", lineId: "dig-between",
prompt: `間の壁の位置を求めるために、${mazeDiggingCodeLineNumber("dig-between")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("dig-between", "(y + ny) // 2", "// 2"),
choices: [{ id: "floor-two", text: "// 2"}, { id: "div-two", text: "/ 2"}, { id: "floor-three", text: "// 3"}],
correctAnswer: { kind: "choice", choiceId: "floor-two"}, requires: null,
stepId: "dig-between-1", reviewLineId: "dig-between", reviewStepIds: ["advance-step-1", "dig-between-1"],
tags: ["between-midpoint"], correctFeedback: "正解！間の壁は2つの部屋の中間にあるので、座標の平均を// 2の切り捨て除算で求めます。",
incorrectFeedback: "不正解。間の壁は2つの部屋の中間にあるので、座標の平均を// 2の切り捨て除算で求めます。",
},
{
kind: "code-blank", id: "backtrack-pop", lineId: "pop-stack",
prompt: `行き止まりから戻るために、${mazeDiggingCodeLineNumber("pop-stack")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("pop-stack", "stack.pop()", "pop"),
choices: [{ id: "pop", text: "pop"}, { id: "append", text: "append"}, { id: "clear", text: "clear"}],
correctAnswer: { kind: "choice", choiceId: "pop"}, requires: null,
stepId: "execution-backtrack-1", reviewLineId: "pop-stack", reviewStepIds: ["if-candidates-7", "else-branch-7", "pop-stack-7", "execution-backtrack-1"],
tags: ["backtrack-pop"], correctFeedback: "正解！候補がないときは、stackの一番上を取り除くpopで1マス戻ります。",
incorrectFeedback: "不正解。候補がないときは、stackの一番上を取り除くpopで1マス戻ります。",
},
],
completion: { caption: "基本コードの役割が確認できました！次は（別の盤面や例外ケースの7問）で、自分で実装に向けた最後の土台を固めます。"},
};

export function validateMazeDiggingCodeCheck(content: MazeDiggingCodeCheckContent): void {
validateAssessment(content);
if (content.phase!== 5 || content.stageName!== "コードの確認問題" || content.code!== mazeDiggingCode || content.questions.length!== 10) {
throw new Error("Use the phase-4 code contract and ten questions");
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
