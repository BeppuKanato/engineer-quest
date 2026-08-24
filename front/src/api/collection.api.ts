import { fetcher } from "@/lib/fetcher";
import type { TechIconBadge, TechIconBadgeRarity } from "./badges.api";
import type { AchievementStatus } from "./achievements.api";
import { fetchClientQuery, queryTags } from "@/lib/clientQueryCache";

export type CollectionBadgeItem = TechIconBadge & {
  isOwned: boolean;
  acquiredAt: string | null;
  isSelected: boolean;
};

export type CollectionKnowledgeTip = {
  id: string;
  courseId: string;
  courseTitle: string;
  label: string;
  title: string;
  description: string;
  rarity: "COMMON" | "RARE" | "EPIC";
  isCollected: boolean;
  collectedAt: string | null;
};

export type CollectionAchievement = {
  id: string;
  category: string;
  categoryLabel: string;
  status: AchievementStatus;
  title: string;
  description: string;
  conditionLabel: string | null;
  achievedAt: string | null;
};

export type CollectionResponse = {
  badges: {
    ticketBalance: number;
    selectedBadge: TechIconBadge | null;
    ownedCount: number;
    totalCount: number;
    items: CollectionBadgeItem[];
  };
  knowledgeTips: {
    collectedCount: number;
    totalCount: number;
    items: CollectionKnowledgeTip[];
  };
  achievements: {
    achievedCount: number;
    totalCount: number;
    items: CollectionAchievement[];
  };
};

export const getCollection = async (
  token: string
): Promise<CollectionResponse> => {
  return fetchClientQuery(
    "collection",
    () => fetcher<CollectionResponse>("/collection", { method: "GET", token }),
    { staleTimeMs: 20_000, tags: [queryTags.collection] }
  );
};

export type { TechIconBadgeRarity };
