import { validateAssessment } from "../../assessment/assessment";
import { getLearningStep } from "../../review/reviewContent";
import { greedyCoinsCode, greedyCoinsCodeLineNumber, type GreedyCoinsCodeLineId } from "../code-mapping/greedyCoinsCode";
import { greedyCoinsCodeMappingContent } from "../code-mapping/codeMapping.content";
import type { GreedyCoinsCodeCheckContent, GreedyCoinsCodeQuestion } from "./codeCheck.types";

export function codeLine(lineId: GreedyCoinsCodeLineId) {
  const line = greedyCoinsCode.lines.find(line => line.id === lineId);
  if (!line) throw new Error(`Unknown code line: ${lineId}`);
  return line;
}

/** 行内で一度だけ現れるトークンを空欄にする（BFS方式）。 */
function blankAt(lineId: GreedyCoinsCodeLineId, token: string) {
  const text = codeLine(lineId).text;
  const start = text.indexOf(token);
  if (start < 0 || text.indexOf(token, start + token.length) !== -1) throw new Error("Blank token must occur once");
  return { start, length: token.length };
}

export function fillCodeBlank(question: GreedyCoinsCodeQuestion, replacement: string): string {
  const text = codeLine(question.lineId).text;
  return text.slice(0, question.blank.start) + replacement + text.slice(question.blank.start + question.blank.length);
}

/**
 * 基準データ §3 フェーズ5（独立2問、1問1穴）。
 * Q1 は while の条件の穴＝ remaining（残額と今の額面を比べる）、
 * Q2 は残額の更新の穴＝ coin（使った硬貨の分だけ残額を減らす）。
 * 選択肢はどちらもコードに現れる変数名（amount / remaining / coin）とする。
 */
const variableChoices = [
  { id: "amount", text: "amount" }, { id: "remaining", text: "remaining" }, { id: "coin", text: "coin" },
];

export const greedyCoinsCodeCheckContent: GreedyCoinsCodeCheckContent = {
  version: 1, kind: "code-blank-check", id: "greedy-coins-code-check", phase: 5, stageName: "コードの確認問題", code: greedyCoinsCode,
  instruction: "空欄に入るものを選ぶ",
  retryFeedback: "不正解。もう一度、処理の目的に合うコードを選んでみよう。",
  reviewLabel: "💡 この処理の動きをもう一度見る",
  questions: [
    {
      kind: "code-blank", id: "while-condition", lineId: "while-remaining",
      prompt: `残額と今の額面を比べるために、${greedyCoinsCodeLineNumber("while-remaining")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("while-remaining", "remaining"),
      choices: variableChoices,
      correctAnswer: { kind: "choice", choiceId: "remaining" }, requires: null,
      stepId: "while-remaining-1", reviewLineId: "while-remaining", reviewStepIds: ["for-coin-500", "while-remaining-1"],
      tags: ["while-condition"], correctFeedback: "正解！残っている金額 remaining と今の額面 coin を比べ、残額が額面以上である間くり返します。",
      incorrectFeedback: "不正解。残っている金額 remaining と今の額面 coin を比べ、残額が額面以上である間くり返します。",
    },
    {
      kind: "code-blank", id: "remaining-update", lineId: "subtract-coin",
      prompt: `使った硬貨の分だけ残額を減らすために、${greedyCoinsCodeLineNumber("subtract-coin")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("subtract-coin", "coin"),
      choices: variableChoices,
      correctAnswer: { kind: "choice", choiceId: "coin" }, requires: null,
      stepId: "subtract-coin-1", reviewLineId: "subtract-coin", reviewStepIds: ["execution-select-1", "subtract-coin-1"],
      tags: ["remaining-update"], correctFeedback: "正解！使った硬貨 coin の分だけ残額を減らすので、remaining から coin を引きます。",
      incorrectFeedback: "不正解。使った硬貨 coin の分だけ残額を減らすので、remaining から coin を引きます。",
    },
  ],
  completion: { caption: "基本コードの役割が確認できました！次は応用問題（別の金額や、貪欲では最適にならない場合を含む4問）で、自分で実装に向けた最後の土台を固めます。" },
};

export function validateGreedyCoinsCodeCheck(content: GreedyCoinsCodeCheckContent): void {
  validateAssessment(content);
  if (content.phase !== 5 || content.stageName !== "コードの確認問題" || content.code !== greedyCoinsCode || content.questions.length !== 2) {
    throw new Error("Use the phase-4 code contract and two questions");
  }
  for (const question of content.questions) {
    const line = codeLine(question.lineId);
    const correct = question.choices.find(choice => choice.id === question.correctAnswer.choiceId)!;
    if (question.blank.start + question.blank.length > line.text.length || fillCodeBlank(question, correct.text) !== line.text) {
      throw new Error("Correct choice must restore the exact source line");
    }
    const review = question.reviewStepIds.map(id => getLearningStep(greedyCoinsCodeMappingContent, id));
    if (question.reviewLineId !== question.lineId || review.at(-1)!.canvas.highlights[0].id !== question.reviewLineId ||
      getLearningStep(greedyCoinsCodeMappingContent, question.stepId).canvas.highlights[0].id !== question.lineId) {
      throw new Error("Review must show the target code line");
    }
  }
}
validateGreedyCoinsCodeCheck(greedyCoinsCodeCheckContent);
