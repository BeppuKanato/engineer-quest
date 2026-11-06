import { validateAssessment, type CodeBlankAssessment, type CodeBlankQuestion } from "../../assessment/assessment";
import { getLearningStep } from "../../review/reviewContent";
import { bfsCode, bfsCodeLineNumber, type BfsCodeLineId } from "../code-mapping/bfsCode";
import { bfsCodeMappingContent } from "../code-mapping/codeMapping.content";

export type BfsCodeQuestion = Omit<CodeBlankQuestion, "lineId"> & {
  readonly lineId: BfsCodeLineId;
  readonly correctFeedback: string;
  readonly reviewLineId: BfsCodeLineId;
};
export type BfsCodeCheckContent = Omit<CodeBlankAssessment, "questions"> & {
  readonly phase: 5;
  readonly code: typeof bfsCode;
  readonly questions: readonly [BfsCodeQuestion, ...BfsCodeQuestion[]];
  readonly instruction: string;
  readonly retryFeedback: string;
  readonly reviewLabel: string;
  readonly completion: { readonly caption: string };
};

export function codeLine(lineId: BfsCodeLineId) {
  const line = bfsCode.lines.find(line => line.id === lineId);
  if (!line) throw new Error(`Unknown code line: ${lineId}`);
  return line;
}
function blankAt(lineId: BfsCodeLineId, token: string) {
  const text = codeLine(lineId).text;
  const start = text.indexOf(token);
  if (start < 0 || text.indexOf(token, start + token.length) !== -1) throw new Error("Blank token must occur once");
  return { start, length: token.length };
}
export function fillCodeBlank(question: BfsCodeQuestion, replacement: string): string {
  const text = codeLine(question.lineId).text;
  return text.slice(0, question.blank.start) + replacement + text.slice(question.blank.start + question.blank.length);
}

export const bfsCodeCheckContent: BfsCodeCheckContent = {
  version: 1, kind: "code-blank-check", id: "bfs-code-check", phase: 5, code: bfsCode,
  instruction: "空欄に入るものを選ぶ",
  retryFeedback: "不正解。もう一度、処理の目的に合うコードを選んでみよう。",
  reviewLabel: "💡 この処理の動きをもう一度見る",
  questions: [
    {
      kind: "code-blank", id: "enqueue-method", lineId: "enqueue-neighbor",
      prompt: `調べた隣の場所をキュー（待ち行列）の末尾に加えるために、${bfsCodeLineNumber("enqueue-neighbor")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("enqueue-neighbor", "append"),
      choices: [{ id: "append", text: "append" }, { id: "popleft", text: "popleft" }, { id: "remove", text: "remove" }],
      correctAnswer: { kind: "choice", choiceId: "append" }, requires: null,
      stepId: "execution-discover-b", reviewLineId: "enqueue-neighbor", reviewStepIds: ["assign-a-b", "execution-discover-b"],
      tags: ["enqueue-tail"], correctFeedback: "正解！調べた場所をキューの末尾に加えるコードを選べました。",
    },
    {
      kind: "code-blank", id: "undiscovered-condition", lineId: "if-undiscovered",
      prompt: `隣の場所の距離がまだ決まっていないことを確かめるために、${bfsCodeLineNumber("if-undiscovered")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("if-undiscovered", "not in"),
      choices: [{ id: "not-in", text: "not in" }, { id: "in", text: "in" }, { id: "equals", text: "==" }],
      correctAnswer: { kind: "choice", choiceId: "not-in" }, requires: null,
      stepId: "if-a-b", reviewLineId: "if-undiscovered", reviewStepIds: ["for-a-b", "if-a-b"],
      tags: ["undiscovered-test"], correctFeedback: "正解！距離がまだ決まっていない場所を確かめる条件を選べました。",
    },
  ],
  completion: { caption: "基本コードの役割が確認できました！次は【応用問題】（別パターンや例外ケースの3〜5問）で、自分で実装に向けた最後の土台を固めます。" },
};

export function validateBfsCodeCheck(content: BfsCodeCheckContent): void {
  validateAssessment(content);
  if (content.phase !== 5 || content.code !== bfsCode || content.questions.length !== 2) throw new Error("Use the phase-4 code contract and two questions");
  for (const question of content.questions) {
    const line = codeLine(question.lineId);
    const correct = question.choices.find(choice => choice.id === question.correctAnswer.choiceId)!;
    if (question.blank.start + question.blank.length > line.text.length || fillCodeBlank(question, correct.text) !== line.text) throw new Error("Correct choice must restore the exact source line");
    const review = question.reviewStepIds.map(id => getLearningStep(bfsCodeMappingContent, id));
    if (question.reviewLineId !== question.lineId || review.at(-1)!.canvas.highlights[0].id !== question.reviewLineId ||
      getLearningStep(bfsCodeMappingContent, question.stepId).canvas.highlights[0].id !== question.lineId) throw new Error("Review must show the target code line");
  }
}
validateBfsCodeCheck(bfsCodeCheckContent);
