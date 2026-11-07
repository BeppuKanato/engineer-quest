import { validateAssessment } from "../../assessment/assessment";
import { getLearningStep } from "../../review/reviewContent";
import { binarySearchCode, binarySearchCodeLineNumber, type BinarySearchCodeLineId } from "../code-mapping/binarySearchCode";
import { binarySearchCodeMappingContent } from "../code-mapping/codeMapping.content";
import type { BinarySearchCodeCheckContent, BinarySearchCodeQuestion } from "./codeCheck.types";

export function codeLine(lineId: BinarySearchCodeLineId) {
  const line = binarySearchCode.lines.find(line => line.id === lineId);
  if (!line) throw new Error(`Unknown code line: ${lineId}`);
  return line;
}

/** 行内で一度だけ現れるトークンを空欄にする（BFS方式）。 */
function blankAt(lineId: BinarySearchCodeLineId, token: string) {
  const text = codeLine(lineId).text;
  const start = text.indexOf(token);
  if (start < 0 || text.indexOf(token, start + token.length) !== -1) throw new Error("Blank token must occur once");
  return { start, length: token.length };
}

export function fillCodeBlank(question: BinarySearchCodeQuestion, replacement: string): string {
  const text = codeLine(question.lineId).text;
  return text.slice(0, question.blank.start) + replacement + text.slice(question.blank.start + question.blank.length);
}

export const binarySearchCodeCheckContent: BinarySearchCodeCheckContent = {
  version: 1, kind: "code-blank-check", id: "binary-search-code-check", phase: 5, stageName: "コードの確認問題", code: binarySearchCode,
  instruction: "空欄に入るものを選ぶ",
  retryFeedback: "不正解。もう一度、処理の目的に合うコードを選んでみよう。",
  reviewLabel: "💡 この処理の動きをもう一度見る",
  questions: [
    {
      kind: "code-blank", id: "mid-formula", lineId: "compute-mid",
      prompt: `範囲の真ん中の位置を求めるために、${binarySearchCodeLineNumber("compute-mid")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("compute-mid", "hi"),
      choices: [{ id: "lo", text: "lo" }, { id: "hi", text: "hi" }, { id: "mid", text: "mid" }],
      correctAnswer: { kind: "choice", choiceId: "hi" }, requires: null,
      stepId: "execution-probe-1-mid", reviewLineId: "compute-mid", reviewStepIds: ["execution-range-full", "execution-probe-1-mid"],
      tags: ["mid-formula"], correctFeedback: "正解！真ん中は範囲の両端 lo と hi の中間なので、(lo + hi) // 2 で求めます。",
      incorrectFeedback: "不正解。真ん中は範囲の両端 lo と hi の中間なので、(lo + hi) // 2 で求めます。",
    },
    {
      kind: "code-blank", id: "skip-mid", lineId: "drop-left",
      prompt: `真ん中の値より大きい側だけを残すために、${binarySearchCodeLineNumber("drop-left")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("drop-left", "1"),
      choices: [{ id: "zero", text: "0" }, { id: "one", text: "1" }, { id: "two", text: "2" }],
      correctAnswer: { kind: "choice", choiceId: "one" }, requires: null,
      stepId: "execution-probe-1-drop-left", reviewLineId: "drop-left", reviewStepIds: ["elif-smaller-1", "execution-probe-1-drop-left"],
      tags: ["skip-mid"], correctFeedback: "正解！真ん中の値は確認済みで探す値ではないため、mid 自身も範囲から外して lo = mid + 1 にします。",
      incorrectFeedback: "不正解。真ん中の値は確認済みで探す値ではないため、mid 自身も範囲から外して lo = mid + 1 にします。",
    },
  ],
  completion: { caption: "基本コードの役割が確認できました！次は応用問題（別のリストや、探す値が無い場合を含む4問）で、自分で実装に向けた最後の土台を固めます。" },
};

export function validateBinarySearchCodeCheck(content: BinarySearchCodeCheckContent): void {
  validateAssessment(content);
  if (content.phase !== 5 || content.stageName !== "コードの確認問題" || content.code !== binarySearchCode || content.questions.length !== 2) {
    throw new Error("Use the phase-4 code contract and two questions");
  }
  for (const question of content.questions) {
    const line = codeLine(question.lineId);
    const correct = question.choices.find(choice => choice.id === question.correctAnswer.choiceId)!;
    if (question.blank.start + question.blank.length > line.text.length || fillCodeBlank(question, correct.text) !== line.text) {
      throw new Error("Correct choice must restore the exact source line");
    }
    const review = question.reviewStepIds.map(id => getLearningStep(binarySearchCodeMappingContent, id));
    if (question.reviewLineId !== question.lineId || review.at(-1)!.canvas.highlights[0].id !== question.reviewLineId ||
      getLearningStep(binarySearchCodeMappingContent, question.stepId).canvas.highlights[0].id !== question.lineId) {
      throw new Error("Review must show the target code line");
    }
  }
}
validateBinarySearchCodeCheck(binarySearchCodeCheckContent);
