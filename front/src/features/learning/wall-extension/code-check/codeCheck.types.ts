import type { CodeBlankAssessment, CodeBlankQuestion } from "../../assessment/assessment";
import type { wallExtensionCode, WallExtensionCodeLineId } from "../code-mapping/wallExtensionCode";

/**
 * フェーズ5の設問は共通エンジンの code-blank 形式に、正誤の解説文を足し、
 * 対象行をフェーズ4の契約（wall-extension-v1）の意味IDで型に縛る。
 * 解説は正解・不正解のどちらでも「なぜその値か」が一文で分かる文にする。
 */
export type WallExtensionCodeQuestion = Omit<CodeBlankQuestion, "lineId"> & {
  readonly lineId: WallExtensionCodeLineId;
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
  readonly reviewLineId: WallExtensionCodeLineId;
};

export type WallExtensionCodeCheckContent = Omit<CodeBlankAssessment, "questions"> & {
  readonly phase: 5;
  readonly stageName: "コードの確認問題";
  readonly code: typeof wallExtensionCode;
  readonly questions: readonly [WallExtensionCodeQuestion, WallExtensionCodeQuestion];
  readonly instruction: string;
  readonly retryFeedback: string;
  readonly reviewLabel: string;
  readonly completion: { readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type WallExtensionCodeCheckSummary = {
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
