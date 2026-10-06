import { fetcher } from "@/lib/fetcher";
import { fetchClientQuery, queryTags } from "@/lib/clientQueryCache";
import type { AchievementStatus, AchievementRarity } from "./achievements.api";

export type CollectionKnowledgeTip = {
  id: string; courseId: string; courseTitle: string; catalogNumber: number; label: string; title: string;
  description: string; connection: string | null; useCase: string | null; searchKeywords: string[];
  rarity: "COMMON" | "RARE" | "EPIC"; isCollected: boolean; collectedAt: string | null;
};
export type CollectionAchievement = {
  id: string; category: string; categoryLabel: string; status: AchievementStatus; title: string;
  description: string; conditionLabel: string | null; achievedAt: string | null;
  rarity: AchievementRarity; iconKey: string; isProfileSelected: boolean;
};
export type CollectionResponse = {
  knowledgeTips: { collectedCount: number; totalCount: number; items: CollectionKnowledgeTip[] };
  achievements: { achievedCount: number; totalCount: number; items: CollectionAchievement[] };
};
export const getCollection = (token: string): Promise<CollectionResponse> => fetchClientQuery(
  "collection", () => fetcher<CollectionResponse>("/collection", { method: "GET", token }),
  { staleTimeMs: 20_000, tags: [queryTags.collection] },
);
