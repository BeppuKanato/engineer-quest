import type { ChoiceQuestion, ConceptCheckAssessment, NodeTapQuestion } from "../../assessment/assessment";
import type { WallExtensionDirection } from "../wallExtensionMaze";

/**
 * フェーズ3の設問は共通エンジンの concept-check 形式を使う（タップ設問と
 * 文章選択肢の設問の混在。バブルソート・貪欲法フェーズ3と同じ判断）。
 * タップ設問は node-tap 形式に方向の指示だけを足す。回答対象はグラフの
 * ノードIDではなくグリッドのセルキー（"x,y"）で、エンジン側の NodeAnswer は
 * そのまま流用する（assessment.ts の契約どおり）。
 * 選択肢設問は「許される方向の規則」「完成の判断」のように、タップでは
 * 問えない流れの理解を確認するために使う（ChoiceQuestion は requires を
 * 持てないため、連動は場面と状況キャプションで表す）。
 */
export type WallExtensionCheckNodeQuestion = NodeTapQuestion & {
  /** 方向の指示がある設問（壁になるマスを問う設問）だけ方向を持つ。場面では処理中の柱と併せて示す。 */
  readonly direction: WallExtensionDirection | null;
  /**
   * 場面の状況を1文で示すキャプション（Issue #297、バブルソートと同型）。
   * 場面の青い柱は設問によって伸ばし終えた柱・これから処理する柱を
   * 指し、色だけでは時制が読めないため、文章で固定する。
   */
  readonly situation: string;
};

export type WallExtensionCheckChoiceQuestion = ChoiceQuestion & {
  /** 場面の状況を1文で示すキャプション（タップ設問と同じ理由で持つ）。 */
  readonly situation: string;
};

export type WallExtensionCheckQuestion = WallExtensionCheckNodeQuestion | WallExtensionCheckChoiceQuestion;

export type WallExtensionCheckContent = Omit<ConceptCheckAssessment, "questions"> & {
  readonly phase: 3;
  readonly stageName: "動きの確認問題";
  readonly questions: readonly [WallExtensionCheckQuestion, ...WallExtensionCheckQuestion[]];
  readonly completion: { readonly stepId: string; readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type WallExtensionCheckSummary = {
  assessmentEvidence?: ReturnType<typeof import("../../assessment/assessment").assessmentEvidence>;
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
