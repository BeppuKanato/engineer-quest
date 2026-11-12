import type { LearningPhaseSummary } from "@/api/types/learning";

export type UnitPhaseSummary = LearningPhaseSummary;

export type UnitTransition = "bridge" | "result" | "result-in-phase" | "final";

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
