import { validateAssessment} from "../../assessment/assessment";
import { getLearningStep} from "../../review/reviewContent";
import { wallExtensionCode, wallExtensionCodeLineNumber, type WallExtensionCodeLineId} from "../code-mapping/wallExtensionCode";
import { wallExtensionCodeMappingContent} from "../code-mapping/codeMapping.content";
import type { WallExtensionCodeCheckContent, WallExtensionCodeQuestion} from "./codeCheck.types";

export function codeLine(lineId: WallExtensionCodeLineId) {
const line = wallExtensionCode.lines.find(line => line.id === lineId);
if (!line) throw new Error(`Unknown code line: ${lineId}`);
return line;
}

/**
* 空欄位置は、文脈（前後の文字列）の中で一度だけ現れるトークンとして求める。
* 対象の数値（「2」、「-1」など）は行内の他の場所にも現れるため、
* BFSの「行内で一意なトークン」方式では位置を特定できない。文脈で一意化しても
* 空欄そのものは対象トークンだけになる。
*/
function blankWithin(lineId: WallExtensionCodeLineId, context: string, token: string) {
const text = codeLine(lineId).text;
const contextStart = text.indexOf(context);
if (contextStart < 0 || text.indexOf(context, contextStart + 1)!== -1) throw new Error("Blank context must occur once");
const slice = text.slice(contextStart, contextStart + context.length);
const at = slice.indexOf(token);
if (at < 0 || slice.indexOf(token, at + token.length)!== -1) throw new Error("Blank token must occur once in context");
return { start: contextStart + at, length: token.length};
}

export function fillCodeBlank(question: WallExtensionCodeQuestion, replacement: string): string {
const text = codeLine(question.lineId).text;
return text.slice(0, question.blank.start) + replacement + text.slice(question.blank.start + question.blank.length);
}

/**
* 基準データ §3 フェーズ5。2026-11-17 の判断基準（「流れとコードを適切に
* 対応づける能力を判断するに足るか」）で監査し、独立2問から8問へ拡充した。
* 既存2問は参照コード21行のうち2行（柱の列の進み幅・「上」の移動量）だけが
* 対象だった。フェーズ6が前提とする対応づけのうち、未カバーだったものを
* コードの流れ順に足す。
* - 外周の書き込み行の代表として border-bottom の size - 1
* （残り3行は対称で、フェーズ6 Parsons の入れ替え可能グループが扱う）
* - 柱の段の範囲の終わり（for-pillar-row の size - 1。列側は既存問が進み幅で確認）
* - 柱の記録の座標の順（append-pillar の (x, y)。grid[y][x] と行列が入れ替わる要点）
* - 一番上の段の判定（if-first-row の y == 2。フェーズ6「上に伸ばせない理由」の前提）
* - 移動量の引き方（lookup-delta の allowed[choice]。フェーズ6転移タップの前提）
* - 壁の書き込み位置（write-wall の y + dy。同上）
* 対象外: 関数定義と Parsons の固定行のうち骨格にあたる行（initialize-grid、
* for-border、initialize-pillars、define-directions の表そのもの）、
* allowed-four / allowed-three のリスト内容（フェーズ3の規則の設問と
* フェーズ6が振る舞いで確認する）。
*/
export const wallExtensionCodeCheckContent: WallExtensionCodeCheckContent = {
version: 1, kind: "code-blank-check", id: "wall-extension-code-check", phase: 5, stageName: "コードの確認問題", code: wallExtensionCode,
instruction: "空欄に入るものを選ぶ",
retryFeedback: "不正解。もう一度、処理の目的に合うコードを選んでみよう。",
reviewLabel: "💡 この処理の動きをもう一度見る",
questions: [
{
kind: "code-blank", id: "border-bottom-end", lineId: "border-bottom",
prompt: `下の辺を壁にする行の位置を決めるために、${wallExtensionCodeLineNumber("border-bottom")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("border-bottom", "grid[size - 1][i]", "size - 1"),
choices: [{ id: "bottom-size-minus-1", text: "size - 1"}, { id: "bottom-size", text: "size"}, { id: "bottom-one", text: "1"}],
correctAnswer: { kind: "choice", choiceId: "bottom-size-minus-1"}, requires: null,
stepId: "border-bottom-0", reviewLineId: "border-bottom", reviewStepIds: ["for-border-0", "border-top-0", "border-bottom-0"],
tags: ["border-index"], correctFeedback: "正解！下の辺は一番下の行で、その番号は size - 1 です。",
incorrectFeedback: "不正解。下の辺は一番下の行で、その番号は size - 1 になります。",
},
{
kind: "code-blank", id: "pillar-range-end", lineId: "for-pillar-row",
prompt: `柱を立てる段の終わりを決めるために、${wallExtensionCodeLineNumber("for-pillar-row")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("for-pillar-row", "size - 1, 2", "size - 1"),
choices: [{ id: "range-size-minus-1", text: "size - 1"}, { id: "range-size", text: "size"}, { id: "range-size-plus-1", text: "size + 1"}],
correctAnswer: { kind: "choice", choiceId: "range-size-minus-1"}, requires: null,
stepId: "for-pillar-row-2", reviewLineId: "for-pillar-row", reviewStepIds: ["initialize-pillars", "for-pillar-row-2"],
tags: ["pillar-range-end"], correctFeedback: "正解！柱は外側の壁の1マス内側まで立てるため、段の終わりは size - 1 です。",
incorrectFeedback: "不正解。柱は外側の壁の1マス内側まで立てるため、段の終わりは size - 1 になります。",
},
{
kind: "code-blank", id: "pillar-column-step", lineId: "for-pillar-column",
prompt: `柱を立てる位置の間隔を決めるために、${wallExtensionCodeLineNumber("for-pillar-column")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("for-pillar-column", "size - 1, 2", "2"),
choices: [{ id: "step-1", text: "1"}, { id: "step-2", text: "2"}, { id: "step-3", text: "3"}],
correctAnswer: { kind: "choice", choiceId: "step-2"}, requires: null,
stepId: "for-pillar-column-2-2", reviewLineId: "for-pillar-column", reviewStepIds: ["for-pillar-row-2", "for-pillar-column-2-2"],
tags: ["pillar-step"], correctFeedback: "正解！柱は2マスおきに立つため、列の進み幅は2です。",
incorrectFeedback: "不正解。柱は2マスおきに立つので、列の進み幅は2になります。",
},
{
kind: "code-blank", id: "pillar-append-order", lineId: "append-pillar",
prompt: `柱の位置をリストへ記録するために、${wallExtensionCodeLineNumber("append-pillar")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("append-pillar", "append((x, y))", "(x, y)"),
choices: [{ id: "order-x-y", text: "(x, y)"}, { id: "order-y-x", text: "(y, x)"}, { id: "order-x-x", text: "(x, x)"}],
correctAnswer: { kind: "choice", choiceId: "order-x-y"}, requires: null,
stepId: "append-pillar-2-2", reviewLineId: "append-pillar", reviewStepIds: ["execution-pillar-2-2", "append-pillar-2-2"],
tags: ["pillar-coordinate-order"], correctFeedback: "正解！柱の位置は、横の x、たての y の順で (x, y) と記録します。",
incorrectFeedback: "不正解。柱の位置は、横の x、たての y の順で (x, y) と記録します。",
},
{
kind: "code-blank", id: "up-delta", lineId: "define-directions",
prompt: `方向の対応表で「上」への移動量を決めるために、${wallExtensionCodeLineNumber("define-directions")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("define-directions", "\"up\": (0, -1)", "-1"),
choices: [{ id: "minus-one", text: "-1"}, { id: "zero", text: "0"}, { id: "plus-one", text: "1"}],
correctAnswer: { kind: "choice", choiceId: "minus-one"}, requires: null,
stepId: "define-directions", reviewLineId: "define-directions", reviewStepIds: ["for-pillar-row-exit", "define-directions"],
tags: ["direction-delta"], correctFeedback: "正解！上は行が1つ減る方向なので、移動量は-1です。",
incorrectFeedback: "不正解。上は行が1つ減る方向なので、移動量は-1になります。",
},
{
kind: "code-blank", id: "first-row-condition", lineId: "if-first-row",
prompt: `一番上の段の柱かどうかを判定するために、${wallExtensionCodeLineNumber("if-first-row")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("if-first-row", "y == 2", "2"),
choices: [{ id: "cond-0", text: "0"}, { id: "cond-1", text: "1"}, { id: "cond-2", text: "2"}],
correctAnswer: { kind: "choice", choiceId: "cond-2"}, requires: null,
stepId: "if-first-row-2-2", reviewLineId: "if-first-row", reviewStepIds: ["for-extension-2-2", "if-first-row-2-2"],
tags: ["first-row-condition"], correctFeedback: "正解！一番上の段は y が 2 の段なので、条件は y == 2 です。",
incorrectFeedback: "不正解。一番上の段は y が 2 の段なので、条件は y == 2 になります。",
},
{
kind: "code-blank", id: "delta-choice", lineId: "lookup-delta",
prompt: `選ばれた方向の移動量を取り出すために、${wallExtensionCodeLineNumber("lookup-delta")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("lookup-delta", "allowed[choice]", "choice"),
choices: [{ id: "pick-choice", text: "choice"}, { id: "pick-allowed", text: "allowed"}, { id: "pick-directions", text: "directions"}],
correctAnswer: { kind: "choice", choiceId: "pick-choice"}, requires: null,
stepId: "lookup-delta-2-2", reviewLineId: "lookup-delta", reviewStepIds: ["allowed-four-2-2", "lookup-delta-2-2"],
tags: ["delta-lookup"], correctFeedback: "正解！番号 choice が示す方向を allowed から取り出し、その移動量を directions で引きます。",
incorrectFeedback: "不正解。番号 choice が示す方向を allowed から取り出し、その移動量を directions で引くため、空欄は choice になります。",
},
{
kind: "code-blank", id: "wall-row-delta", lineId: "write-wall",
prompt: `壁を書き込むマスのたての位置を決めるために、${wallExtensionCodeLineNumber("write-wall")}行目の空欄に入る正しいコードを選んでください。`,
blank: blankWithin("write-wall", "y + dy", "dy"),
choices: [{ id: "delta-dy", text: "dy"}, { id: "delta-dx", text: "dx"}, { id: "delta-y", text: "y"}],
correctAnswer: { kind: "choice", choiceId: "delta-dy"}, requires: null,
stepId: "execution-extend-2-2", reviewLineId: "write-wall", reviewStepIds: ["lookup-delta-2-2", "execution-extend-2-2"],
tags: ["wall-position"], correctFeedback: "正解！たての位置は、柱の y に移動量 dy を足した場所です。",
incorrectFeedback: "不正解。たての位置は、柱の y に移動量 dy を足した場所になります。",
},
],
completion: { caption: "基本コードの役割が確認できました！次は【応用問題】（別の盤面や例外ケースの7問）で、自分で実装に向けた最後の土台を固めます。"},
};

export function validateWallExtensionCodeCheck(content: WallExtensionCodeCheckContent): void {
validateAssessment(content);
if (content.phase!== 5 || content.stageName!== "コードの確認問題" || content.code!== wallExtensionCode || content.questions.length!== 8) {
throw new Error("Use the phase-4 code contract and eight questions");
}
for (const question of content.questions) {
const line = codeLine(question.lineId);
const correct = question.choices.find(choice => choice.id === question.correctAnswer.choiceId)!;
if (question.blank.start + question.blank.length > line.text.length || fillCodeBlank(question, correct.text)!== line.text) {
throw new Error("Correct choice must restore the exact source line");
}
const review = question.reviewStepIds.map(id => getLearningStep(wallExtensionCodeMappingContent, id));
if (question.reviewLineId!== question.lineId || review.at(-1)!.canvas.highlights[0].id!== question.reviewLineId ||
getLearningStep(wallExtensionCodeMappingContent, question.stepId).canvas.highlights[0].id!== question.lineId) {
throw new Error("Review must show the target code line");
}
}
}
validateWallExtensionCodeCheck(wallExtensionCodeCheckContent);
