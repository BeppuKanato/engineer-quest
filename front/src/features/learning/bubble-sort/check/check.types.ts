import type { ChoiceQuestion, ConceptCheckAssessment, NodeTapQuestion } from "../../assessment/assessment";

/**
 * フェーズ3の設問は共通エンジンの concept-check 形式を使う（配列タップの
 * 設問と、文章・数値の選択肢設問の混在。二分探索フェーズ3と同じ考え方）。
 * 回答対象はグラフのノードIDではなく配列の位置（インデックス）の文字列で、
 * エンジン側の NodeAnswer はそのまま流用する（assessment.ts の契約どおり）。
 * 設問数と内訳は固定数ではなく、フェーズ4（動きとコードの対応）が前提と
 * する理解を一通り判断できるかで決める（2026-11-17 の基準）。
 */
type Situation = {
  /**
   * 場面の状況を1文で示すキャプション（Issue #297）。場面はフェーズ2の
   * ステップ盤面を再利用するため、青ペアの時間的な意味（比べ終えたペアか、
   * これから比べるペアか）が盤面だけでは決まらない。設問ごとに、場面の
   * 直前に起きた比較（タップ設問）／場面の時点（選択肢設問）を文章で固定する。
   */
  readonly situation: string;
};

export type BubbleSortCheckNodeQuestion = NodeTapQuestion & Situation;

export type BubbleSortCheckChoiceQuestion = ChoiceQuestion & Situation;

export type BubbleSortCheckQuestion = BubbleSortCheckNodeQuestion | BubbleSortCheckChoiceQuestion;

export type BubbleSortCheckContent = Omit<ConceptCheckAssessment, "questions"> & {
  readonly phase: 3;
  readonly stageName: "動きの確認問題";
  readonly questions: readonly [BubbleSortCheckQuestion, ...BubbleSortCheckQuestion[]];
  readonly completion: { readonly stepId: string; readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type BubbleSortCheckSummary = {
  assessmentEvidence?: ReturnType<typeof import("../../assessment/assessment").assessmentEvidence>;
  readonly firstAttemptCorrect: number;
  /** 最終的に正解へ到達した問題数（解き直しを含む） */
  readonly eventuallyCorrect?: number;
  readonly totalQuestions: number;
};
