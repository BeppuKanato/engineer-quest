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

/**
 * 独立穴埋め8問。前提のカバーと「流れとコードを適切に対応づけられていると判断するに
 * 足るか」で問題数を決める基準（2026-11-17）に沿い、フェーズ6が前提とする行のうち
 * 未確認だった6行（発見済みの記録・逆順の取り出し・繰り返し条件・初期化3行）を追加した。
 * 取り出しの行（pop-node）は既存問1の誤答選択肢で間接的には確認されており、
 * 条件ブロックの範囲は穴埋めでは測りにくいため、どちらも判断事項として残す。
 */
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
    {
      kind: "code-blank",
      id: "mark-visited",
      lineId: "mark-visited",
      prompt: `隣の場所を、重ねて追加しないように発見済みとして記録するために、${dfsCodeLineNumber("mark-visited")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("mark-visited", "add"),
      choices: [{ id: "add", text: "add" }, { id: "append", text: "append" }, { id: "remove", text: "remove" }],
      correctAnswer: { kind: "choice", choiceId: "add" },
      requires: null,
      stepId: "mark-a-c",
      reviewStepIds: ["if-a-c", "mark-a-c"],
      tags: ["mark-visited"],
      correctFeedback: "正解！隣の場所を発見済みの集合へ記録する操作を選べました。",
    },
    {
      kind: "code-blank",
      id: "reversed-iteration",
      lineId: "for-neighbor-reversed",
      prompt: `取り出した場所の隣を逆の順序で取り出し、隣の情報がない場所は空として扱うために、${dfsCodeLineNumber("for-neighbor-reversed")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("for-neighbor-reversed", "reversed(graph.get(node, []))"),
      choices: [
        { id: "reversed-get", text: "reversed(graph.get(node, []))" },
        { id: "get", text: "graph.get(node, [])" },
        { id: "index", text: "graph[node]" },
      ],
      correctAnswer: { kind: "choice", choiceId: "reversed-get" },
      requires: null,
      stepId: "for-a-c",
      reviewStepIds: ["execution-pop-a", "for-a-c"],
      tags: ["reversed-iteration"],
      correctFeedback: "正解！隣を逆の順序で取り出し、情報がない場所を空として扱うコードを選べました。",
    },
    {
      kind: "code-blank",
      id: "loop-condition",
      lineId: "while-stack",
      prompt: `スタックに調べる場所が残っている間、処理を繰り返すために、${dfsCodeLineNumber("while-stack")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("while-stack", "stack"),
      choices: [{ id: "stack", text: "stack" }, { id: "visited", text: "visited" }, { id: "order", text: "order" }],
      correctAnswer: { kind: "choice", choiceId: "stack" },
      requires: null,
      stepId: "while-a",
      reviewStepIds: ["execution-push-start-a", "while-a"],
      tags: ["loop-condition"],
      correctFeedback: "正解！スタックに場所が残っている間は処理を続ける条件を選べました。",
    },
    {
      kind: "code-blank",
      id: "initial-visited",
      lineId: "initialize-visited",
      prompt: `出発点を、最初に発見済みとして記録するために、${dfsCodeLineNumber("initialize-visited")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("initialize-visited", "{start}"),
      choices: [{ id: "start-set", text: "{start}" }, { id: "start-list", text: "[start]" }, { id: "empty-set", text: "set()" }],
      correctAnswer: { kind: "choice", choiceId: "start-set" },
      requires: null,
      stepId: "initialize-visited",
      reviewStepIds: ["define-function", "initialize-visited"],
      tags: ["visited-initialization"],
      correctFeedback: "正解！出発点を入れた発見済みの集合を用意するコードを選べました。",
    },
    {
      kind: "code-blank",
      id: "initial-order",
      lineId: "initialize-order",
      prompt: `訪れた順を記録するリストを、最初は空にして用意するために、${dfsCodeLineNumber("initialize-order")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("initialize-order", "[]"),
      choices: [{ id: "empty-list", text: "[]" }, { id: "start-list", text: "[start]" }, { id: "empty-dict", text: "{}" }],
      correctAnswer: { kind: "choice", choiceId: "empty-list" },
      requires: null,
      stepId: "initialize-order",
      reviewStepIds: ["initialize-visited", "initialize-order"],
      tags: ["order-initialization"],
      correctFeedback: "正解！訪問順を記録する空のリストを用意するコードを選べました。",
    },
    {
      kind: "code-blank",
      id: "initial-stack",
      lineId: "initialize-stack",
      prompt: `出発点を、最初に調べる場所としてスタックに入れるために、${dfsCodeLineNumber("initialize-stack")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("initialize-stack", "[start]"),
      choices: [{ id: "start-list", text: "[start]" }, { id: "start-set", text: "{start}" }, { id: "empty-list", text: "[]" }],
      correctAnswer: { kind: "choice", choiceId: "start-list" },
      requires: null,
      stepId: "execution-push-start-a",
      reviewStepIds: ["initialize-order", "execution-push-start-a"],
      tags: ["stack-initialization"],
      correctFeedback: "正解！出発点を入れたスタックを用意するコードを選べました。",
    },
  ],
} as const satisfies Omit<CodeBlankAssessment, "questions"> & {
  readonly phase: 5;
  readonly stageName: string;
  readonly code: typeof dfsCode;
  readonly retryFeedback: string;
  readonly questions: readonly [DfsCodeCheckQuestion, ...DfsCodeCheckQuestion[]];
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
