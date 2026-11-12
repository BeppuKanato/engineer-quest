import type { LearningRewards } from "../types/rewards";
import type { PhaseCompletion, UnlockedAchievement } from "../../../api/learning.api";
export const emptyLearningRewards: LearningRewards = { awardedCards: [], unlockedAchievements: [] };
export function mergeLearningRewards(current: LearningRewards, response: { unlockedAchievements: readonly UnlockedAchievement[] } & Partial<Pick<PhaseCompletion, "phase" | "awardedCard">>): LearningRewards {
  return {
    awardedCards: response.awardedCard && response.phase && !current.awardedCards.some(item => item.card.id === response.awardedCard!.id) ? [...current.awardedCards, { phaseKey: response.phase.phaseKey, card: response.awardedCard }] : current.awardedCards,
    unlockedAchievements: [...new Map([...current.unlockedAchievements, ...response.unlockedAchievements].map(item => [item.id, item])).values()],
  };
}
