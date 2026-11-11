import type {
  ChoiceQuestion, DiagnosticAssessment, NodeTapQuestion, ParsonsQuestion,
} from "../../assessment/assessment";
import type { greedyCoinsCode } from "../code-mapping/greedyCoinsCode";
import type { GreedyCoinsExecutionCanvasState } from "../execution/execution.types";

/**
 * フェーズ6の設問は共通エンジンの diagnostic-check 形式に、操作指示と
 * 設問固有の正誤解説、場面の硬貨盤面を足す（二分探索フェーズ6の構成に合わせる）。
 * 場面は単元盤面型（GreedyCoinsExecutionCanvasState）で持つ。転移（342円）と
 * 反例（[4, 3, 1]・6円）はフェーズ2のステップには無い場面のため、実行記録から
 * 盤面を組み立て、単元盤面型の検証を通す。
 * タップ問題の回答対象はフェーズ3と同じく、額面の文字列。
 */
export type ConsolidationQuestionDetails = {
  readonly instruction: string;
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
  /** 設問で使う変数記号の定義（Parsons の amount / coins 等）。記号が初出の設問にだけ置く。 */
  readonly definitions?: string;
};

export type GreedyCoinsConsolidationTapQuestion = NodeTapQuestion & ConsolidationQuestionDetails & {
  readonly scene: GreedyCoinsExecutionCanvasState;
};

export type GreedyCoinsConsolidationChoiceQuestion = ChoiceQuestion & ConsolidationQuestionDetails & {
  readonly scene: GreedyCoinsExecutionCanvasState;
};

export type GreedyCoinsConsolidationParsonsQuestion = ParsonsQuestion & ConsolidationQuestionDetails;

export type GreedyCoinsConsolidationQuestion =
  | GreedyCoinsConsolidationTapQuestion
  | GreedyCoinsConsolidationChoiceQuestion
  | GreedyCoinsConsolidationParsonsQuestion;

export type GreedyCoinsConsolidationContent = Omit<DiagnosticAssessment, "questions"> & {
  readonly phase: 6;
  readonly stageName: "応用問題";
  readonly code: typeof greedyCoinsCode;
  readonly questions: readonly [GreedyCoinsConsolidationQuestion, ...GreedyCoinsConsolidationQuestion[]];
  readonly reviewLabel: string;
  readonly completion: string;
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type GreedyCoinsConsolidationSummary = {
  assessmentEvidence?: ReturnType<typeof import("../../assessment/assessment").assessmentEvidence>;
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
