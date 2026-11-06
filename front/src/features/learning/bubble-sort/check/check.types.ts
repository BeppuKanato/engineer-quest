import type { NodeTapAssessment, NodeTapQuestion } from "../../assessment/assessment";

/**
 * フェーズ3の設問は共通エンジンの node-tap 形式をそのまま使う。
 * 回答対象はグラフのノードIDではなく配列の位置（インデックス）の文字列で、
 * エンジン側の NodeAnswer はそのまま流用する（assessment.ts の契約どおり）。
 */
export type BubbleSortCheckQuestion = NodeTapQuestion;

export type BubbleSortCheckContent = Omit<NodeTapAssessment, "questions"> & {
  readonly phase: 3;
  readonly stageName: "動きの確認問題";
  readonly questions: readonly [BubbleSortCheckQuestion, BubbleSortCheckQuestion];
  readonly completion: { readonly stepId: string; readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type BubbleSortCheckSummary = {
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
