import type { ImplementationInputLevel } from "../implementation/inputLevel";

/**
 * 単元フロー（Issue #77）が各フェーズの単品プレビューから受け取る到達状況。
 * フェーズごとに該当する項目だけが入る（未実施の項目は undefined）。
 * 型だけの共有であり、実行時の依存は持たない。
 */
export type UnitPhaseSummary = {
  /** 完了した実装のコード。旧記録では欠損を補完しない。 */
  code?: string;
  assessmentEvidence?: ReturnType<typeof import("../assessment/assessment").assessmentEvidence>;
  /** 初回解答で正解した問題数（フェーズ3・5・6） */
  firstAttemptCorrect?: number;
  /** 問題の総数（フェーズ3・5・6） */
  totalQuestions?: number;
  /** テスト実行の回数（フェーズ7） */
  testRuns?: number;
  /** ヒントレベル別の使用回数（フェーズ7） */
  hintUsage?: readonly number[];
  /** 完了時点の入力量レベル（フェーズ7、Issue #328） */
  inputLevel?: ImplementationInputLevel;
};

export type UnitTransition = "bridge" | "result" | "result-in-phase" | "final";

/** 任意フェーズのアイコン種別。実アイコンへの引き当ては表示側（単元画面）が持つ。 */
export type OptionalPhaseIcon = "prediction" | "bridge";

/**
 * 任意フェーズの定義（2026-11-28、汎用化）。
 * 必須フェーズの列（UnitPhase[]）には入れない。進捗・再開位置・到達範囲の
 * 計算は必須フェーズだけで行い、任意フェーズは「どの必須フェーズの後に
 * ぶら下がるか（anchorPhase）」を持つ脇の定義として読む。
 * カタログの実体は unit/optionalPhases.ts に置き、表示側はすべてそこを読む。
 */
export type UnitOptionalPhase = {
  /** 識別子。推薦リンク（?phase=）の対象キーと一致させる */
  id: string;
  /** 表示名 */
  name: string;
  /** この任意フェーズがぶら下がる必須フェーズの番号（1.5 なら 1、6.5 なら 6） */
  anchorPhase: number;
  /** 波マップで本線のどちら側に逃がすか */
  side: "above" | "below";
  /** 「いつ取り組めるか」の一言（「任意」の表示はチップが担うので含めない） */
  timing: string;
  icon: OptionalPhaseIcon;
  /** 取り組める条件。mission = 最終チャレンジに挑戦できる状態になってから */
  availability: "always" | "mission";
};

export type UnitPhase = {
  /** フェーズ番号（1〜7） */
  phase: number;
  /** 単品プレビューの contentId と対応する識別子 */
  id: string;
  /** 単元ナビゲーションの短い名前 */
  shortName: string;
  /** 正式名称（リザルトやブリッジで使う） */
  formalName: string;
  /** このフェーズの完了後にどう進むか */
  transitionOut: UnitTransition;
  /** このフェーズに入るときのブリッジ文（目標の提示）。フェーズ1は単元の入口なので持たない */
  bridge?: string;
  /**
   * この段階の区切りで知識カードが提示されうるとき、そのレアリティ。
   * 付与そのものの正本は seed のカードスケジュール（back/prisma/seedData/knowledgeCardSeed.ts）で、
   * ここは単元画面のノードに付けるバッジ表示のために持つ。
   */
  cardRarity?: "COMMON" | "RARE" | "EPIC";
  /** transitionOut が "result" のときのリザルト画面の文言（事実のみ。次の目標はブリッジが担う） */
  result?: {
    heading: string;
  };
};
