import type {
  ChoiceQuestion, DiagnosticAssessment, NodeTapQuestion, ParsonsQuestion,
} from "../../../assessment/assessment";
import type { MazeGridCanvasState } from "../../../player/mazeGrid.types";
import type { wallExtensionCode } from "../code-mapping/wallExtensionCode";
import type { WallExtensionDirection } from "../wallExtensionMaze";

/**
 * フェーズ6の設問は共通エンジンの diagnostic-check 形式に、操作指示と
 * 設問固有の正誤解説、場面の盤面を足す（BFS フェーズ6の構成に合わせる）。
 * 場面はグラフではなくグリッド盤面で、タップ問題はフェーズ3と同じく
 * 処理中の柱と方向の指示を併せて示す。
 */
export type ConsolidationQuestionDetails = {
  readonly instruction: string;
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
};

export type WallExtensionGridTapQuestion = NodeTapQuestion & ConsolidationQuestionDetails & {
  readonly kind: "node";
  readonly scene: MazeGridCanvasState;
  readonly direction: WallExtensionDirection;
};

export type WallExtensionConsolidationChoiceQuestion = ChoiceQuestion & ConsolidationQuestionDetails & {
  readonly scene: MazeGridCanvasState;
};

export type WallExtensionConsolidationParsonsQuestion = ParsonsQuestion & ConsolidationQuestionDetails;

export type WallExtensionConsolidationQuestion =
  | WallExtensionGridTapQuestion
  | WallExtensionConsolidationChoiceQuestion
  | WallExtensionConsolidationParsonsQuestion;

export type WallExtensionConsolidationContent = Omit<DiagnosticAssessment, "questions"> & {
  readonly phase: 6;
  readonly stageName: "応用問題";
  readonly code: typeof wallExtensionCode;
  readonly questions: readonly [WallExtensionConsolidationQuestion, ...WallExtensionConsolidationQuestion[]];
  readonly reviewLabel: string;
  readonly completion: string;
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type WallExtensionConsolidationSummary = {
  assessmentEvidence?: ReturnType<typeof import("../../../assessment/assessment").assessmentEvidence>;
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
