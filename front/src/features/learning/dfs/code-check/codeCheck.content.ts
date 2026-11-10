import { validateAssessment, type CodeBlankAssessment, type CodeBlankQuestion } from "../../assessment/assessment";
import { getLearningStep } from "../../review/reviewContent";
import { dfsCode, dfsCodeLineNumber, type DfsCodeLineId } from "../code-mapping/dfsCode";
import { dfsCodeMappingContent } from "../code-mapping/codeMapping.content";

type DfsCodeCheckQuestion = CodeBlankQuestion & {
  readonly lineId: DfsCodeLineId;
  readonly correctFeedback: string;
};

function blankAt(lineId: DfsCodeLineId, token: string) {
  const text = dfsCode.lines.find(line => line.id === lineId)!.text;
  const start = text.indexOf(token);
  if (start < 0 || text.indexOf(token, start + token.length) !== -1) {
    throw new Error(`Expected one blank token on ${lineId}`);
  }
  return { start, length: token.length };
}

export const dfsCodeCheckContent = {
  version: 1,
  kind: "code-blank-check",
  id: "dfs-code-check",
  phase: 5,
  stageName: "コードの確認問題",
  code: dfsCode,
  retryFeedback: "不正解。もう一度、処理の目的に合うコードを選んでみよう。",
  questions: [
    {
      kind: "code-blank",
      id: "stack-push",
      lineId: "append-stack",
      prompt: `まだ調べていない隣の場所を、あとで調べられるようにスタックへ入れるために、${dfsCodeLineNumber("append-stack")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("append-stack", "append"),
      choices: [{ id: "append", text: "append" }, { id: "pop", text: "pop" }, { id: "remove", text: "remove" }],
      correctAnswer: { kind: "choice", choiceId: "append" },
      requires: null,
      stepId: "execution-push-c-from-a",
      reviewStepIds: ["mark-a-c", "execution-push-c-from-a"],
      tags: ["stack-push"],
      correctFeedback: "正解！隣の場所をスタックの末尾へ追加する操作を選べました。",
    },
    {
      kind: "code-blank",
      id: "unvisited-test",
      lineId: "if-unvisited",
      prompt: `隣の場所がまだ調べられていないことを確かめるために、${dfsCodeLineNumber("if-unvisited")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("if-unvisited", "not in"),
      choices: [{ id: "not-in", text: "not in" }, { id: "in", text: "in" }, { id: "equals", text: "==" }],
      correctAnswer: { kind: "choice", choiceId: "not-in" },
      requires: null,
      stepId: "if-a-c",
      reviewStepIds: ["for-a-c", "if-a-c"],
      tags: ["unvisited-test"],
      correctFeedback: "正解！まだ調べられていない場所を確かめる条件を選べました。",
    },
  ],
} as const satisfies Omit<CodeBlankAssessment, "questions"> & {
  readonly phase: 5;
  readonly stageName: string;
  readonly code: typeof dfsCode;
  readonly retryFeedback: string;
  readonly questions: readonly [DfsCodeCheckQuestion, DfsCodeCheckQuestion];
};

validateAssessment(dfsCodeCheckContent);
for (const question of dfsCodeCheckContent.questions) {
  const line = dfsCode.lines.find(line => line.id === question.lineId)!;
  const correct = question.choices.find(choice => choice.id === question.correctAnswer.choiceId)!;
  const { start, length } = question.blank;
  if (line.text.slice(start, start + length) !== correct.text) {
    throw new Error(`The correct answer must restore ${question.lineId}`);
  }
  const review = question.reviewStepIds.map(id => getLearningStep(dfsCodeMappingContent, id));
  const target = getLearningStep(dfsCodeMappingContent, question.stepId);
  if (review.at(-1) !== target || target.canvas.highlights[0].id !== question.lineId) {
    throw new Error(`Review must end at ${question.lineId}`);
  }
}
