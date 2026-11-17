import type { ChoiceQuestion, ConceptCheckAssessment, NodeTapQuestion } from "../../assessment/assessment";

/**
 * フェーズ3の設問は共通エンジンの concept-check 形式を使う。
 * 配列セルのタップ（回答対象は位置＝インデックスの文字列で、
 * エンジン側の NodeAnswer をそのまま流用する）と文章4択が混在する。
 * タップだけでは「どちら側を捨てるか」「一致したらどう終わるか」を
 * 問えないため形式を分けている。どの設問にも、正誤の解説文を持たせる
 * （answerFeedbackState が設問のフィールドを読む既存の仕組み）。
 * 選択肢設問は ChoiceQuestion の契約で requires を持てないため、連動は
 * 前提（どの値との比較か）を明記した問題文と場面で表す。
 * 設問数と内訳は固定数ではなく、フェーズ4（動きとコードの対応）が
 * 前提とする理解を一通り判断できるかで決める（2026-11-17 の基準）。
 */
export type BinarySearchCheckNodeQuestion = NodeTapQuestion & {
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
};

export type BinarySearchCheckChoiceQuestion = ChoiceQuestion & {
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
};

export type BinarySearchCheckQuestion = BinarySearchCheckNodeQuestion | BinarySearchCheckChoiceQuestion;

export type BinarySearchCheckContent = Omit<ConceptCheckAssessment, "questions"> & {
  readonly phase: 3;
  readonly stageName: "動きの確認問題";
  readonly questions: readonly [BinarySearchCheckQuestion, ...BinarySearchCheckQuestion[]];
  readonly completion: { readonly stepId: string; readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type BinarySearchCheckSummary = {
  assessmentEvidence?: ReturnType<typeof import("../../assessment/assessment").assessmentEvidence>;
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
