import type { CodeBlankAssessment, CodeBlankQuestion } from "../../assessment/assessment";
import type { binarySearchCode, BinarySearchCodeLineId } from "../code-mapping/binarySearchCode";

/**
 * フェーズ5の設問は共通エンジンの code-blank 形式に、正誤の解説文を足し、
 * 対象行をフェーズ4の契約（binary-search-v1）の意味IDで型に縛る。
 * 解説は正解・不正解のどちらでも「なぜその式か」が一文で分かる文にする。
 */
export type BinarySearchCodeQuestion = Omit<CodeBlankQuestion, "lineId"> & {
  readonly lineId: BinarySearchCodeLineId;
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
  readonly reviewLineId: BinarySearchCodeLineId;
};

export type BinarySearchCodeCheckContent = Omit<CodeBlankAssessment, "questions"> & {
  readonly phase: 5;
  readonly stageName: "コードの確認問題";
  readonly code: typeof binarySearchCode;
  readonly questions: readonly [BinarySearchCodeQuestion, BinarySearchCodeQuestion];
  readonly instruction: string;
  readonly retryFeedback: string;
  readonly reviewLabel: string;
  readonly completion: { readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type BinarySearchCodeCheckSummary = {
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
