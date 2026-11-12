import type { AwardedCard, UnlockedAchievement } from "../../../api/learning.api";

export type LearningRewards = {
  awardedCards: readonly { phaseKey: string; card: AwardedCard }[];
  unlockedAchievements: readonly UnlockedAchievement[];
};
