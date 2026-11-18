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
 * 基準データ §3 フェーズ5（8問、1問1穴）。設問数は固定数ではなく、
 * フェーズ6（応用問題）が前提とする対応づけを一通り判断できるかで
 * 決める（2026-11-17 の基準）。フェーズ6は、転移トレース（初期化・
 * 額面を回す for・残額の条件・記録と更新）、反例トレース（同じ対応づけを
 * 別額面で使う）、Parsons（全8行の意味と順序）を、説明なしに使う。
 * 当初の2問は参照コード8行のうち while の条件の左辺と残額の更新の
 * 2か所だけが対象で、初期化2行・for の回すもの・条件の右辺・記録する
 * 行・返す行が未確認だったため、コードの流れに沿う並びで6問を足し、
 * 関数定義を除く全行を対象にした。関数定義行はフェーズ6 Parsons の
 * 固定行のため対象外とする（二分探索フェーズ5と同じ判断）。
 * 選択肢はコードに現れる変数名・リスト名とする。
 */
const variableChoices = [
  { id: "amount", text: "amount" }, { id: "remaining", text: "remaining" }, { id: "coin", text: "coin" },
];
const resultChoices = [
  { id: "result", text: "result" }, { id: "remaining", text: "remaining" }, { id: "amount", text: "amount" },
];
const listChoices = [
  { id: "coins", text: "coins" }, { id: "amount", text: "amount" }, { id: "result", text: "result" },
];

export const greedyCoinsCodeCheckContent: GreedyCoinsCodeCheckContent = {
  version: 1, kind: "code-blank-check", id: "greedy-coins-code-check", phase: 5, stageName: "コードの確認問題", code: greedyCoinsCode,
  instruction: "空欄に入るものを選ぶ",
  retryFeedback: "不正解。もう一度、処理の目的に合うコードを選んでみよう。",
  reviewLabel: "💡 この処理の動きをもう一度見る",
  questions: [
    {
      kind: "code-blank", id: "init-result", lineId: "init-result",
      prompt: `選んだ硬貨を入れるリストを用意するために、${greedyCoinsCodeLineNumber("init-result")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("init-result", "result"),
      choices: resultChoices,
      correctAnswer: { kind: "choice", choiceId: "result" }, requires: null,
      stepId: "init-result", reviewLineId: "init-result", reviewStepIds: ["define-function", "init-result"],
      tags: ["init-result"], correctFeedback: "正解！選んだ硬貨を入れる結果のリスト result を、最初は空で用意します。",
      incorrectFeedback: "不正解。選んだ硬貨を入れる結果のリスト result を、最初は空で用意します。",
    },
    {
      kind: "code-blank", id: "init-remaining", lineId: "init-remaining",
      prompt: `残額の最初の値を、払う金額そのものにするために、${greedyCoinsCodeLineNumber("init-remaining")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("init-remaining", "amount"),
      choices: variableChoices,
      correctAnswer: { kind: "choice", choiceId: "amount" }, requires: null,
      stepId: "init-remaining", reviewLineId: "init-remaining", reviewStepIds: ["init-result", "init-remaining"],
      tags: ["init-remaining"], correctFeedback: "正解！残額 remaining の最初の値は、払う金額 amount そのものです。",
      incorrectFeedback: "不正解。残額 remaining の最初の値は、払う金額 amount そのものです。",
    },
    {
      kind: "code-blank", id: "for-coin", lineId: "for-coin",
      prompt: `額面を大きい順に1つずつ取り出すために、${greedyCoinsCodeLineNumber("for-coin")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("for-coin", "coins"),
      choices: listChoices,
      correctAnswer: { kind: "choice", choiceId: "coins" }, requires: null,
      stepId: "for-coin-500", reviewLineId: "for-coin", reviewStepIds: ["init-remaining", "for-coin-500"],
      tags: ["for-coin"], correctFeedback: "正解！額面のリスト coins を大きい順に1つずつ取り出して、coin に入れます。",
      incorrectFeedback: "不正解。額面のリスト coins を大きい順に1つずつ取り出して、coin に入れます。",
    },
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
      kind: "code-blank", id: "while-coin", lineId: "while-remaining",
      prompt: `残額と比べる相手を、今見ている額面にするために、${greedyCoinsCodeLineNumber("while-remaining")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("while-remaining", "coin"),
      choices: variableChoices,
      correctAnswer: { kind: "choice", choiceId: "coin" }, requires: null,
      stepId: "while-remaining-1", reviewLineId: "while-remaining", reviewStepIds: ["for-coin-500", "while-remaining-1"],
      tags: ["while-coin"], correctFeedback: "正解！残額 remaining と比べる相手は、今見ている額面 coin です。",
      incorrectFeedback: "不正解。残額 remaining と比べる相手は、今見ている額面 coin です。",
    },
    {
      kind: "code-blank", id: "append-coin", lineId: "append-coin",
      prompt: `選んだ硬貨を結果のリストに記録するために、${greedyCoinsCodeLineNumber("append-coin")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("append-coin", "coin"),
      choices: variableChoices,
      correctAnswer: { kind: "choice", choiceId: "coin" }, requires: null,
      stepId: "execution-select-1", reviewLineId: "append-coin", reviewStepIds: ["while-remaining-1", "execution-select-1"],
      tags: ["append-coin"], correctFeedback: "正解！選んだ硬貨 coin を、結果のリスト result に記録します。",
      incorrectFeedback: "不正解。選んだ硬貨 coin を、結果のリスト result に記録します。",
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
    {
      kind: "code-blank", id: "return-result", lineId: "return-result",
      prompt: `選んだ硬貨のリストを答えとして返すために、${greedyCoinsCodeLineNumber("return-result")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("return-result", "result"),
      choices: resultChoices,
      correctAnswer: { kind: "choice", choiceId: "result" }, requires: null,
      stepId: "return-result", reviewLineId: "return-result", reviewStepIds: ["for-coin-end", "return-result"],
      tags: ["return-result"], correctFeedback: "正解！返すのは、選んだ硬貨が入った結果のリスト result です。",
      incorrectFeedback: "不正解。返すのは、選んだ硬貨が入った結果のリスト result です。",
    },
  ],
  completion: { caption: "基本コードの役割が確認できました！次は応用問題（別の金額や、貪欲では最適にならない場合を含む6問）で、自分で実装に向けた最後の土台を固めます。" },
};

export function validateGreedyCoinsCodeCheck(content: GreedyCoinsCodeCheckContent): void {
  validateAssessment(content);
  if (content.phase !== 5 || content.stageName !== "コードの確認問題" || content.code !== greedyCoinsCode || content.questions.length !== 8) {
    throw new Error("Use the phase-4 code contract and eight questions");
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
