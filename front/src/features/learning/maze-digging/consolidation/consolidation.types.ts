import type {
  ChoiceQuestion, DiagnosticAssessment, NodeTapQuestion, ParsonsQuestion,
} from "../../assessment/assessment";
import type { MazeDiggingCanvasState } from "../mazeDiggingCanvas";
import type { mazeDiggingCode } from "../code-mapping/mazeDiggingCode";

/**
 * フェーズ6の設問は共通エンジンの diagnostic-check 形式に、操作指示と
 * 設問固有の正誤解説、場面の盤面を足す（BFS・棒倒し法フェーズ6の構成に合わせる）。
 * 場面はグラフではなくグリッド盤面で、タップ問題はフェーズ3と同じく
 * 方向を問題文の中で示す（基準データ §6-6。独立した方向フィールドは持たない）。
 */
export type ConsolidationQuestionDetails = {
  readonly instruction: string;
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
};

export type MazeDiggingGridTapQuestion = NodeTapQuestion & ConsolidationQuestionDetails & {
  readonly kind: "node";
  readonly scene: MazeDiggingCanvasState;
};

export type MazeDiggingConsolidationChoiceQuestion = ChoiceQuestion & ConsolidationQuestionDetails & {
  readonly scene: MazeDiggingCanvasState;
};

export type MazeDiggingConsolidationParsonsQuestion = ParsonsQuestion & ConsolidationQuestionDetails;

export type MazeDiggingConsolidationQuestion =
  | MazeDiggingGridTapQuestion
  | MazeDiggingConsolidationChoiceQuestion
  | MazeDiggingConsolidationParsonsQuestion;

export type MazeDiggingConsolidationContent = Omit<DiagnosticAssessment, "questions"> & {
  readonly phase: 6;
  readonly stageName: "応用問題";
  readonly code: typeof mazeDiggingCode;
  readonly questions: readonly [MazeDiggingConsolidationQuestion, ...MazeDiggingConsolidationQuestion[]];
  readonly reviewLabel: string;
  readonly completion: string;
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type MazeDiggingConsolidationSummary = {
  assessmentEvidence?: ReturnType<typeof import("../../assessment/assessment").assessmentEvidence>;
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
