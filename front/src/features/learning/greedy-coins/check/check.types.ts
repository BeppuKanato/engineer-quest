import type { ChoiceQuestion, ConceptCheckAssessment, NodeTapQuestion } from "../../assessment/assessment";

/**
 * フェーズ3の設問は共通エンジンの concept-check 形式を使う。
 * Q1 は額面列のタップ（回答対象は額面の文字列で、エンジン側の NodeAnswer を
 * そのまま流用する）、Q2 は基準データ §3 が定める概念確認の文章4択で、
 * タップだけでは「なぜその硬貨を選ぶのか」を問えないため形式を分けている。
 * どちらの設問にも、正誤の解説文を持たせる（answerFeedbackState が
 * 設問のフィールドを読む既存の仕組み）。
 * Q2 は ChoiceQuestion の契約で requires を持てないため、連動は
 * 前提（残額86円で次に選ぶ硬貨）を明記した問題文と場面（select-3）で表す。
 */
export type GreedyCoinsCheckNodeQuestion = NodeTapQuestion & {
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
};

export type GreedyCoinsCheckChoiceQuestion = ChoiceQuestion & {
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
};

export type GreedyCoinsCheckQuestion = GreedyCoinsCheckNodeQuestion | GreedyCoinsCheckChoiceQuestion;

export type GreedyCoinsCheckContent = Omit<ConceptCheckAssessment, "questions"> & {
  readonly phase: 3;
  readonly stageName: "動きの確認問題";
  readonly questions: readonly [GreedyCoinsCheckNodeQuestion, GreedyCoinsCheckChoiceQuestion];
  readonly completion: { readonly stepId: string; readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type GreedyCoinsCheckSummary = {
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
