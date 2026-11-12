import { validateAssessment } from "../../../assessment/assessment";
import { getLearningStep } from "../../../review/reviewContent";
import { wallExtensionCode, wallExtensionCodeLineNumber, type WallExtensionCodeLineId } from "../code-mapping/wallExtensionCode";
import { wallExtensionCodeMappingContent } from "../code-mapping/codeMapping.content";
import type { WallExtensionCodeCheckContent, WallExtensionCodeQuestion } from "./codeCheck.types";

export function codeLine(lineId: WallExtensionCodeLineId) {
  const line = wallExtensionCode.lines.find(line => line.id === lineId);
  if (!line) throw new Error(`Unknown code line: ${lineId}`);
  return line;
}

/**
 * 空欄位置は、文脈（前後の文字列）の中で一度だけ現れるトークンとして求める。
 * 対象の数値（Q1の「2」、Q2の「-1」）は行内の他の場所にも現れるため、
 * BFSの「行内で一意なトークン」方式では位置を特定できない。文脈で一意化しても
 * 空欄そのものは数値部分だけになる。
 */
function blankWithin(lineId: WallExtensionCodeLineId, context: string, token: string) {
  const text = codeLine(lineId).text;
  const contextStart = text.indexOf(context);
  if (contextStart < 0 || text.indexOf(context, contextStart + 1) !== -1) throw new Error("Blank context must occur once");
  const slice = text.slice(contextStart, contextStart + context.length);
  const at = slice.indexOf(token);
  if (at < 0 || slice.indexOf(token, at + token.length) !== -1) throw new Error("Blank token must occur once in context");
  return { start: contextStart + at, length: token.length };
}

export function fillCodeBlank(question: WallExtensionCodeQuestion, replacement: string): string {
  const text = codeLine(question.lineId).text;
  return text.slice(0, question.blank.start) + replacement + text.slice(question.blank.start + question.blank.length);
}

export const wallExtensionCodeCheckContent: WallExtensionCodeCheckContent = {
  version: 1, kind: "code-blank-check", id: "wall-extension-code-check", phase: 5, stageName: "コードの確認問題", code: wallExtensionCode,
  instruction: "空欄に入るものを選ぶ",
  retryFeedback: "不正解。もう一度、処理の目的に合うコードを選んでみよう。",
  reviewLabel: "💡 この処理の動きをもう一度見る",
  questions: [
    {
      kind: "code-blank", id: "pillar-column-step", lineId: "for-pillar-column",
      prompt: `柱を立てる位置の間隔を決めるために、${wallExtensionCodeLineNumber("for-pillar-column")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankWithin("for-pillar-column", "size - 1, 2", "2"),
      choices: [{ id: "step-1", text: "1" }, { id: "step-2", text: "2" }, { id: "step-3", text: "3" }],
      correctAnswer: { kind: "choice", choiceId: "step-2" }, requires: null,
      stepId: "for-pillar-column-2-2", reviewLineId: "for-pillar-column", reviewStepIds: ["for-pillar-row-2", "for-pillar-column-2-2"],
      tags: ["pillar-step"], correctFeedback: "正解！柱は2マスおきに立つため、列の進み幅は2です。",
      incorrectFeedback: "不正解。柱は2マスおきに立つので、列の進み幅は2になります。",
    },
    {
      kind: "code-blank", id: "up-delta", lineId: "define-directions",
      prompt: `方向の対応表で「上」への移動量を決めるために、${wallExtensionCodeLineNumber("define-directions")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankWithin("define-directions", "\"up\": (0, -1)", "-1"),
      choices: [{ id: "minus-one", text: "-1" }, { id: "zero", text: "0" }, { id: "plus-one", text: "1" }],
      correctAnswer: { kind: "choice", choiceId: "minus-one" }, requires: null,
      stepId: "define-directions", reviewLineId: "define-directions", reviewStepIds: ["for-pillar-row-exit", "define-directions"],
      tags: ["direction-delta"], correctFeedback: "正解！上は行が1つ減る方向なので、移動量は-1です。",
      incorrectFeedback: "不正解。上は行が1つ減る方向なので、移動量は-1になります。",
    },
  ],
  completion: { caption: "基本コードの役割が確認できました！次は【応用問題】（別の盤面や例外ケースの4問）で、自分で実装に向けた最後の土台を固めます。" },
};

export function validateWallExtensionCodeCheck(content: WallExtensionCodeCheckContent): void {
  validateAssessment(content);
  if (content.phase !== 5 || content.stageName !== "コードの確認問題" || content.code !== wallExtensionCode || content.questions.length !== 2) {
    throw new Error("Use the phase-4 code contract and two questions");
  }
  for (const question of content.questions) {
    const line = codeLine(question.lineId);
    const correct = question.choices.find(choice => choice.id === question.correctAnswer.choiceId)!;
    if (question.blank.start + question.blank.length > line.text.length || fillCodeBlank(question, correct.text) !== line.text) {
      throw new Error("Correct choice must restore the exact source line");
    }
    const review = question.reviewStepIds.map(id => getLearningStep(wallExtensionCodeMappingContent, id));
    if (question.reviewLineId !== question.lineId || review.at(-1)!.canvas.highlights[0].id !== question.reviewLineId ||
      getLearningStep(wallExtensionCodeMappingContent, question.stepId).canvas.highlights[0].id !== question.lineId) {
      throw new Error("Review must show the target code line");
    }
  }
}
validateWallExtensionCodeCheck(wallExtensionCodeCheckContent);
