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

/**
 * 基準データ §3 フェーズ5（8問）。設問数は固定数ではなく、フェーズ6
 * （応用問題）が前提とする対応づけを一通り判断できるかで決める
 * （2026-11-17 の基準）。フェーズ6は、転移リストの追跡（真ん中の計算・
 * 両方向の捨て方）、不在ケースの終わり方（範囲が空になるまでの
 * くり返し条件）、Parsons（くり返しの中の各行の意味）、並んでいる
 * 前提（比べる記号の意味）を、説明なしに使う。当初の2問は参照コード
 * 12行のうち2行だけが対象で、右端の初期化・くり返し条件・一致の
 * 判定・返す位置・小さい場合の分岐・右側の捨て方が未確認だったため、
 * コードの流れに沿う並びで6問を足した。else 行は空欄にできる
 * トークンを持たないため対象外とし、その対の意味は elif と
 * 右側を捨てる行の設問で確認する。左端の初期化（lo = 0）は
 * フェーズ4のフレームで提示され、フェーズ6は範囲を場面で与えるため、
 * 判断事項として追加しない。
 */
export const binarySearchCodeCheckContent: BinarySearchCodeCheckContent = {
  version: 1, kind: "code-blank-check", id: "binary-search-code-check", phase: 5, stageName: "コードの確認問題", code: binarySearchCode,
  instruction: "空欄に入るものを選ぶ",
  retryFeedback: "不正解。もう一度、処理の目的に合うコードを選んでみよう。",
  reviewLabel: "💡 この処理の動きをもう一度見る",
  questions: [
    {
      kind: "code-blank", id: "init-hi", lineId: "init-hi",
      prompt: `範囲の右端をリストの最後の位置にするために、${binarySearchCodeLineNumber("init-hi")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("init-hi", "len(values) - 1"),
      choices: [{ id: "last-index", text: "len(values) - 1" }, { id: "length", text: "len(values)" }, { id: "zero", text: "0" }],
      correctAnswer: { kind: "choice", choiceId: "last-index" }, requires: null,
      stepId: "execution-range-full", reviewLineId: "init-hi", reviewStepIds: ["init-lo", "execution-range-full"],
      tags: ["init-hi"], correctFeedback: "正解！右端は最後のマスの位置なので、要素の個数から 1 を引いた len(values) - 1 です。",
      incorrectFeedback: "不正解。右端 hi は位置（インデックス）なので、個数そのものではなく、最後のマスの位置である len(values) - 1 を入れます。",
    },
    {
      kind: "code-blank", id: "while-range", lineId: "while-range",
      prompt: `範囲にマスが1個だけ残ったときも、その1個を調べるために、${binarySearchCodeLineNumber("while-range")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("while-range", "<="),
      choices: [{ id: "le", text: "<=" }, { id: "lt", text: "<" }, { id: "eq", text: "==" }],
      correctAnswer: { kind: "choice", choiceId: "le" }, requires: null,
      stepId: "while-range-1", reviewLineId: "while-range", reviewStepIds: ["execution-range-full", "while-range-1"],
      tags: ["while-range"], correctFeedback: "正解！lo と hi が同じ位置を指すとき（範囲が1個のとき）も調べる必要があるので、lo <= hi の間くり返します。",
      incorrectFeedback: "不正解。範囲が1個だけ残ってもその1個を調べる必要があるので、lo <= hi の間くり返すのが正しい条件です。",
    },
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
      kind: "code-blank", id: "if-hit", lineId: "if-hit",
      prompt: `真ん中の値が探す値と一致したかを確かめるために、${binarySearchCodeLineNumber("if-hit")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("if-hit", "=="),
      choices: [{ id: "eq", text: "==" }, { id: "lt", text: "<" }, { id: "gt", text: ">" }],
      correctAnswer: { kind: "choice", choiceId: "eq" }, requires: null,
      stepId: "if-hit-1", reviewLineId: "if-hit", reviewStepIds: ["execution-probe-1-mid", "if-hit-1"],
      tags: ["if-hit"], correctFeedback: "正解！真ん中の値と探す値が等しい（==）ときに、見つけたことになります。",
      incorrectFeedback: "不正解。真ん中の値が探す値と一致するかを確かめる記号は == で、小さいかどうかは次の elif で確かめます。",
    },
    {
      kind: "code-blank", id: "return-mid", lineId: "return-mid",
      prompt: `見つけた位置を答えとして返すために、${binarySearchCodeLineNumber("return-mid")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("return-mid", "mid"),
      choices: [{ id: "mid", text: "mid" }, { id: "value", text: "values[mid]" }, { id: "missing", text: "-1" }],
      correctAnswer: { kind: "choice", choiceId: "mid" }, requires: null,
      stepId: "execution-found", reviewLineId: "return-mid", reviewStepIds: ["if-hit-3", "execution-found"],
      tags: ["return-mid"], correctFeedback: "正解！返すのは真ん中の値ではなく、見つけた位置（mid）です。",
      incorrectFeedback: "不正解。この関数が返すのは探す値の位置なので、値そのもの（values[mid]）ではなく、位置の mid を返します。",
    },
    {
      kind: "code-blank", id: "elif-smaller", lineId: "elif-smaller",
      prompt: `真ん中の値が探す値より小さいかを確かめるために、${binarySearchCodeLineNumber("elif-smaller")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("elif-smaller", "<"),
      choices: [{ id: "lt", text: "<" }, { id: "gt", text: ">" }, { id: "eq", text: "==" }],
      correctAnswer: { kind: "choice", choiceId: "lt" }, requires: null,
      stepId: "elif-smaller-1", reviewLineId: "elif-smaller", reviewStepIds: ["execution-probe-1-mid", "elif-smaller-1"],
      tags: ["elif-smaller"], correctFeedback: "正解！真ん中の値が探す値より小さい（<）ときは、探す値は右側にあるので左側を捨てます。",
      incorrectFeedback: "不正解。elif では真ん中の値が探す値より小さいかどうかを確かめ、小さいときは探す値が右側にあるので左側を捨てる流れに入ります。",
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
    {
      kind: "code-blank", id: "drop-right", lineId: "drop-right",
      prompt: `真ん中の値より小さい側だけを残すために、${binarySearchCodeLineNumber("drop-right")}行目の空欄に入る正しいコードを選んでください。`,
      blank: blankAt("drop-right", "1"),
      choices: [{ id: "zero", text: "0" }, { id: "one", text: "1" }, { id: "two", text: "2" }],
      correctAnswer: { kind: "choice", choiceId: "one" }, requires: null,
      stepId: "execution-probe-2-drop-right", reviewLineId: "drop-right", reviewStepIds: ["else-larger-2", "execution-probe-2-drop-right"],
      tags: ["drop-right"], correctFeedback: "正解！真ん中の値は確認済みで探す値ではないため、mid 自身も範囲から外して hi = mid - 1 にします。",
      incorrectFeedback: "不正解。真ん中の値は確認済みで探す値ではないため、mid 自身も範囲から外して hi = mid - 1 にします。",
    },
  ],
  completion: { caption: "基本コードの役割が確認できました！次は応用問題（別のリストや、探す値が無い場合を含む6問）で、自分で実装に向けた最後の土台を固めます。" },
};

export function validateBinarySearchCodeCheck(content: BinarySearchCodeCheckContent): void {
  validateAssessment(content);
  if (content.phase !== 5 || content.stageName !== "コードの確認問題" || content.code !== binarySearchCode || content.questions.length !== 8) {
    throw new Error("Use the phase-4 code contract and eight questions");
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
