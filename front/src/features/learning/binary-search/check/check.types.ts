import type { ChoiceQuestion, ConceptCheckAssessment, NodeTapQuestion } from "../../assessment/assessment";

/**
 * フェーズ3の設問は共通エンジンの concept-check 形式を使う。
 * Q1 は配列セルのタップ（回答対象は位置＝インデックスの文字列で、
 * エンジン側の NodeAnswer をそのまま流用する）、Q2 は基準データ §3 が
 * 定める文章4択で、タップだけでは「どちら側を捨てるか」を問えないため
 * 形式を分けている。どちらの設問にも、正誤の解説文を持たせる
 * （answerFeedbackState が設問のフィールドを読む既存の仕組み）。
 * Q2 は ChoiceQuestion の契約で requires を持てないため、連動は
 * 前提（31 との比較）を明記した問題文と場面（probe-2-mid）で表す。
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
  readonly questions: readonly [BinarySearchCheckNodeQuestion, BinarySearchCheckChoiceQuestion];
  readonly completion: { readonly stepId: string; readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type BinarySearchCheckSummary = {
  assessmentEvidence?: ReturnType<typeof import("../../assessment/assessment").assessmentEvidence>;
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
