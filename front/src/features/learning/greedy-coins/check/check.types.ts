import type { ChoiceQuestion, ConceptCheckAssessment, NodeTapQuestion } from "../../assessment/assessment";

/**
 * フェーズ3の設問は共通エンジンの concept-check 形式を使う。
 * 額面列のタップ（回答対象は額面の文字列で、エンジン側の NodeAnswer を
 * そのまま流用する）と文章の選択肢が混在する。タップだけでは
 * 「なぜその硬貨を選ぶのか」「残額がいくらになるか」「いつ終わるか」を
 * 問えないため形式を分けている。どの設問にも、正誤の解説文を持たせる
 * （answerFeedbackState が設問のフィールドを読む既存の仕組み）。
 * 選択肢設問は ChoiceQuestion の契約で requires を持てないため、連動は
 * 前提（残額と場面）を明記した問題文と場面で表す。
 * 設問数と内訳は固定数ではなく、フェーズ4（動きとコードの対応）が
 * 前提とする理解を一通り判断できるかで決める（2026-11-17 の基準）。
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
  readonly questions: readonly [GreedyCoinsCheckQuestion, ...GreedyCoinsCheckQuestion[]];
  readonly completion: { readonly stepId: string; readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type GreedyCoinsCheckSummary = {
  assessmentEvidence?: ReturnType<typeof import("../../assessment/assessment").assessmentEvidence>;
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
