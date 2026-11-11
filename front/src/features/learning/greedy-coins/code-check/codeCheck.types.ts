import type { CodeBlankAssessment, CodeBlankQuestion } from "../../assessment/assessment";
import type { greedyCoinsCode, GreedyCoinsCodeLineId } from "../code-mapping/greedyCoinsCode";

/**
 * フェーズ5の設問は共通エンジンの code-blank 形式に、正誤の解説文を足し、
 * 対象行をフェーズ4の契約（greedy-coins-v1）の意味IDで型に縛る。
 * 解説は正解・不正解のどちらでも「なぜその変数か」が一文で分かる文にする。
 */
export type GreedyCoinsCodeQuestion = Omit<CodeBlankQuestion, "lineId"> & {
  readonly lineId: GreedyCoinsCodeLineId;
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
  readonly reviewLineId: GreedyCoinsCodeLineId;
};

export type GreedyCoinsCodeCheckContent = Omit<CodeBlankAssessment, "questions"> & {
  readonly phase: 5;
  readonly stageName: "コードの確認問題";
  readonly code: typeof greedyCoinsCode;
  readonly questions: readonly [GreedyCoinsCodeQuestion, GreedyCoinsCodeQuestion];
  readonly instruction: string;
  readonly retryFeedback: string;
  readonly reviewLabel: string;
  readonly completion: { readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type GreedyCoinsCodeCheckSummary = {
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
