import type { NodeTapAssessment, NodeTapQuestion } from "../../assessment/assessment";

/**
 * フェーズ3の設問は共通エンジンの node-tap 形式をそのまま使う。
 * 回答対象はグラフのノードIDではなくグリッドのセルキー（"x,y"）で、
 * エンジン側の NodeAnswer はそのまま流用する（assessment.ts の契約どおり）。
 * 方向は棒倒し法のような独立フィールドでは持たず、基準データ §6-6 のとおり
 * Q1 の問題文の中で提示する（次の行き先は乱数で決まるため、方向なしでは
 * 正解が一意に定まらない）。
 */
export type MazeDiggingCheckQuestion = NodeTapQuestion;

export type MazeDiggingCheckContent = Omit<NodeTapAssessment, "questions"> & {
  readonly phase: 3;
  readonly stageName: "動きの確認問題";
  readonly questions: readonly [MazeDiggingCheckQuestion, MazeDiggingCheckQuestion];
  readonly completion: { readonly stepId: string; readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type MazeDiggingCheckSummary = {
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
