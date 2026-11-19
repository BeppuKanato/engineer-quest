import type { UnlockedAchievement } from "../../../api/learning.api";
import { achievementText } from "../../../components/rewards/presentation";
export { cardPresentation, presentationFor } from "../../../components/rewards/presentation";

export type RewardStage = "anticipation" | "appearance" | "praise";
export const rewardStages: readonly RewardStage[] = ["anticipation", "appearance", "praise"];
// #333: 実績は解除されたフェーズの結果画面で提示する。最終フェーズで解除された分は
// 結果画面を持たないため、最終リザルトの「新しい実績」ゾーンへ回す（ここでは空を返す）。
export const phaseResultAchievements = (phaseKey: string, finalPhaseKey: string | undefined, items: readonly UnlockedAchievement[]) => phaseKey === finalPhaseKey ? [] : items;
// 切れ目ダイアログは知識カード専用（#333）。実績は結果画面側で提示する。
export type RewardBoundary = { phaseKey: string };
export const rewardText = {
  title: "学びの発見", anticipation: "やった！ 学びの途中で、知識カードを見つけました！", appearance: "知識カードを発見！",
  reveal: "カードを開く",
  praise: "学んだ考え方から、知識のつながりが広がりました。", saved: "カードの内容はコレクションでいつでも確認できます。",
  ...achievementText,
  skip: "演出をスキップ", close: "学習を続ける", finalTitle: "この単元で獲得した実績", finalCards: "この単元で手に入れた知識カード", finalEmpty: "獲得済みの実績は実績一覧で確認できます。",
  collection: "コレクションを見る", achievements: "実績一覧を見る",
} as const;
