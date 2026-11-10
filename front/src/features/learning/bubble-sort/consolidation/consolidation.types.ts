import type {
  ChoiceQuestion, DiagnosticAssessment, NodeTapQuestion, ParsonsQuestion,
} from "../../assessment/assessment";
import type { ArrayBarsCanvasState } from "../../player/arrayBars.types";
import type { bubbleSortCode } from "../code-mapping/bubbleSortCode";

/**
 * フェーズ6の設問は共通エンジンの diagnostic-check 形式に、操作指示と
 * 設問固有の正誤解説、場面の配列を足す（棒倒し法フェーズ6の構成に合わせる）。
 * 場面はグラフではなく配列（棒）で、タップ問題はフェーズ3と同じく
 * 配列の位置（インデックス）の文字列を回答対象にする。
 */
export type ConsolidationQuestionDetails = {
  readonly instruction: string;
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
};

export type BubbleSortArrayTapQuestion = NodeTapQuestion & ConsolidationQuestionDetails & {
  readonly kind: "node";
  readonly scene: ArrayBarsCanvasState;
};

export type BubbleSortConsolidationChoiceQuestion = ChoiceQuestion & ConsolidationQuestionDetails & {
  readonly scene: ArrayBarsCanvasState;
};

export type BubbleSortConsolidationParsonsQuestion = ParsonsQuestion & ConsolidationQuestionDetails;

export type BubbleSortConsolidationQuestion =
  | BubbleSortArrayTapQuestion
  | BubbleSortConsolidationChoiceQuestion
  | BubbleSortConsolidationParsonsQuestion;

export type BubbleSortConsolidationContent = Omit<DiagnosticAssessment, "questions"> & {
  readonly phase: 6;
  readonly stageName: "応用問題";
  readonly code: typeof bubbleSortCode;
  readonly questions: readonly [BubbleSortConsolidationQuestion, ...BubbleSortConsolidationQuestion[]];
  readonly reviewLabel: string;
  readonly completion: string;
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type BubbleSortConsolidationSummary = {
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
