import type { ChoiceQuestion, ConceptCheckAssessment, NodeTapQuestion } from "../../assessment/assessment";

/**
 * フェーズ3の設問は共通エンジンの concept-check 形式を使う（タップ設問と
 * 文章選択肢の設問の混在。バブルソート・貪欲法・棒倒し法フェーズ3と同じ判断）。
 * タップ設問は node-tap 形式をそのまま使い、回答対象はグラフのノードIDでは
 * なくグリッドのセルキー（"x,y"）で、エンジン側の NodeAnswer をそのまま流用
 * する（assessment.ts の契約どおり）。
 * 選択肢設問は「候補の数」「行き止まりの後」「掘った回数」のように、タップ
 * では問えない流れの理解を確認するために使う（ChoiceQuestion は requires を
 * 持てないため、連動は場面と問題文で表す）。
 * 方向は棒倒し法のような独立フィールドでは持たず、基準データ §6-6 のとおり
 * タップ設問の問題文の中で提示する（次の行き先は乱数で決まるため、方向なし
 * では正解が一意に定まらない）。
 */
export type MazeDiggingCheckNodeQuestion = NodeTapQuestion;

export type MazeDiggingCheckChoiceQuestion = ChoiceQuestion;

export type MazeDiggingCheckQuestion = MazeDiggingCheckNodeQuestion | MazeDiggingCheckChoiceQuestion;

export type MazeDiggingCheckContent = Omit<ConceptCheckAssessment, "questions"> & {
  readonly phase: 3;
  readonly stageName: "動きの確認問題";
  readonly questions: readonly [MazeDiggingCheckQuestion, ...MazeDiggingCheckQuestion[]];
  readonly completion: { readonly stepId: string; readonly caption: string };
};

/** 単元フロー接続時（後続Issue）に渡す要約。集計は初回回答のみから導く。 */
export type MazeDiggingCheckSummary = {
  assessmentEvidence?: ReturnType<typeof import("../../assessment/assessment").assessmentEvidence>;
  readonly firstAttemptCorrect: number;
  readonly totalQuestions: number;
};
