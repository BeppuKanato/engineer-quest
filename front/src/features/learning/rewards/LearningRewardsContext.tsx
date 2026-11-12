"use client";
import { createContext, useContext } from "react";
import type { LearningRewards } from "../types/rewards";
/** #111の演出用受け口。先頭カードの演出完了時だけdismissAwardedCardを呼ぶ。 */
export const LearningRewardsContext = createContext<{ rewards: LearningRewards; dismissAwardedCard: (cardId: string) => void } | null>(null);
export function useLearningRewards() {
  const value = useContext(LearningRewardsContext);
  if (!value) throw new Error("Learning rewards provider is required");
  return value;
}
