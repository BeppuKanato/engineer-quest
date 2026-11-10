import type { UnlockedAchievement } from "../../../api/learning.api";
import { knowledgeCardTones } from "../../collection/knowledgeCard.tokens";

export type RewardStage = "anticipation" | "appearance" | "praise";
export const rewardStages: readonly RewardStage[] = ["anticipation", "appearance", "praise"];
// durations は [発見の前振り, 開示の保持, 賞賛の保持] の目安。#147 以降、発見と賞賛は
// ユーザの操作（開く／次へ進む）で進むため、自動遷移に使うのは開示の保持だけ。
export const cardPresentation = {
  COMMON: { durations: [350, 450, 800], scale: 0.96, turns: 0, rays: 0, glow: 0, tone: knowledgeCardTones.COMMON },
  RARE: { durations: [450, 600, 950], scale: 0.88, turns: 4, rays: 4, glow: 16, tone: knowledgeCardTones.RARE },
  EPIC: { durations: [550, 750, 1100], scale: 0.8, turns: 8, rays: 8, glow: 28, tone: knowledgeCardTones.EPIC },
} as const;
export const presentationFor = (rarity: string) => cardPresentation[rarity as keyof typeof cardPresentation] ?? cardPresentation.COMMON;
// #333: 実績は解除されたフェーズの結果画面で提示する。最終フェーズで解除された分は
// 結果画面を持たないため、最終リザルトの「新しい実績」ゾーンへ回す（ここでは空を返す）。
export const phaseResultAchievements = (phaseKey: string, finalPhaseKey: string | undefined, items: readonly UnlockedAchievement[]) => phaseKey === finalPhaseKey ? [] : items;
// 切れ目ダイアログは知識カード専用（#333）。実績は結果画面側で提示する。
export type RewardBoundary = { phaseKey: string };
export const rewardText = {
  title: "学びの発見", anticipation: "やった！ 学びの途中で、知識カードを見つけました！", appearance: "知識カードを発見！",
  reveal: "カードを開く",
  praise: "学んだ考え方から、知識のつながりが広がりました。", saved: "カードの内容はコレクションでいつでも確認できます。",
  achievement: "実績を獲得しました", newAchievements: "新しい実績",
  skip: "演出をスキップ", close: "学習を続ける", finalTitle: "この単元で獲得した実績", finalCards: "この単元で手に入れた知識カード", finalEmpty: "獲得済みの実績は実績一覧で確認できます。",
  collection: "コレクションを見る", achievements: "実績一覧を見る",
} as const;
