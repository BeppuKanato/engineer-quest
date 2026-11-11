import type { NodeTapAssessment, NodeTapQuestion } from "../../assessment/assessment";
import type { WallExtensionDirection } from "../wallExtensionMaze";

/**
 * フェーズ3の設問は共通エンジンの node-tap 形式に、方向の指示だけを足す。
 * 回答対象はグラフのノードIDではなくグリッドのセルキー（"x,y"）で、
 * エンジン側の NodeAnswer はそのまま流用する（assessment.ts の契約どおり）。
 */
export type WallExtensionCheckQuestion = NodeTapQuestion & {
  /** 方向の指示がある設問（Q2）だけ方向を持つ。場面では処理中の柱と併せて示す。 */
  readonly direction: WallExtensionDirection | null;
  /**
   * 場面の状況を1文で示すキャプション（Issue #297、バブルソートと同型）。
   * 場面の青い柱は Q1 では伸ばし終えた柱、Q2 ではこれから処理する柱を
   * 指し、色だけでは時制が読めないため、文章で固定する。
   */
  readonly situation: string;
};

export type WallExtensionCheckContent = Omit<NodeTapAssessment, "questions"> & {
  readonly phase: 3;
  readonly stageName: "動きの確認問題";
  readonly questions: readonly [WallExtensionCheckQuestion, WallExtensionCheckQuestion];
  readonly completion: { readonly stepId: string; readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type WallExtensionCheckSummary = {
  assessmentEvidence?: ReturnType<typeof import("../../assessment/assessment").assessmentEvidence>;
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
