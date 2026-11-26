import { knowledgeCardTones } from "./rarity.tokens";

export const rewardColors = { background: "#f3f6fb", surface: "#ffffff", text: "#111827", border: "#dbe3ef" } as const;
export const achievementText = { achievement: "実績を獲得しました", newAchievements: "新しい実績" } as const;

// durations は [発見の前振り, 開示の保持, 賞賛の保持] の目安。
// カードの自動遷移に使うのは開示の保持だけ。実績も同じレアリティ表現を参照する。
// レジェンダリーは色だけ金で、強さはエピックと同じ（デザイン方針の決定 2026-11-20、一旦）。
// 金の色は実績画面の既存チップ（#fff7ed / #b45309）に合わせた。
const legendaryTone = { label: "レジェンダリー", color: "#b45309", bgcolor: "#fff7ed", border: "#f59e0b" } as const;
export const cardPresentation = {
  COMMON: { durations: [350, 450, 800], scale: 0.96, turns: 0, rays: 0, glow: 0, tone: knowledgeCardTones.COMMON },
  RARE: { durations: [450, 600, 950], scale: 0.88, turns: 4, rays: 4, glow: 16, tone: knowledgeCardTones.RARE },
  EPIC: { durations: [550, 750, 1100], scale: 0.8, turns: 8, rays: 8, glow: 28, tone: knowledgeCardTones.EPIC },
  LEGENDARY: { durations: [550, 750, 1100], scale: 0.8, turns: 8, rays: 8, glow: 28, tone: legendaryTone },
} as const;
export const presentationFor = (rarity: string) => cardPresentation[rarity as keyof typeof cardPresentation] ?? cardPresentation.COMMON;
