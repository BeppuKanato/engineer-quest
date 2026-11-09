import type {
  ChoiceQuestion, DiagnosticAssessment, NodeTapQuestion, ParsonsQuestion,
} from "../../assessment/assessment";
import type { ArrayBarsCanvasState } from "../../player/arrayBars.types";
import type { binarySearchCode } from "../code-mapping/binarySearchCode";

/**
 * フェーズ6の設問は共通エンジンの diagnostic-check 形式に、操作指示と
 * 設問固有の正誤解説、場面の配列を足す（バブルソートフェーズ6の構成に合わせる）。
 * 文章4択はフェーズ3（concept-check）と同じ ChoiceQuestion の形を使う。
 * 場面は共通配列基盤の形で持つ。不在ケース（探す値が盤面に無い）と
 * 未整列リストは、単元盤面型の検証（対象が値に含まれ・小さい順であること）を
 * 満たさないため、単元盤面型では場面を表せないのが理由である。
 * タップ問題の回答対象はフェーズ3と同じく、配列の位置（インデックス）の文字列。
 */
export type ConsolidationQuestionDetails = {
  readonly instruction: string;
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
  /** 設問で使う変数記号の定義（例: Parsons の lo / hi）。記号が初出の設問にだけ置き、操作指示の下に小さく表示する。 */
  readonly definitions?: string;
};

export type BinarySearchArrayTapQuestion = NodeTapQuestion & ConsolidationQuestionDetails & {
  readonly kind: "node";
  readonly scene: ArrayBarsCanvasState;
};

export type BinarySearchConsolidationChoiceQuestion = ChoiceQuestion & ConsolidationQuestionDetails & {
  readonly scene: ArrayBarsCanvasState;
};

export type BinarySearchConsolidationParsonsQuestion = ParsonsQuestion & ConsolidationQuestionDetails;

export type BinarySearchConsolidationQuestion =
  | BinarySearchArrayTapQuestion
  | BinarySearchConsolidationChoiceQuestion
  | BinarySearchConsolidationParsonsQuestion;

export type BinarySearchConsolidationContent = Omit<DiagnosticAssessment, "questions"> & {
  readonly phase: 6;
  readonly stageName: "応用問題";
  readonly code: typeof binarySearchCode;
  readonly questions: readonly [BinarySearchConsolidationQuestion, ...BinarySearchConsolidationQuestion[]];
  readonly reviewLabel: string;
  readonly completion: string;
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type BinarySearchConsolidationSummary = {
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
