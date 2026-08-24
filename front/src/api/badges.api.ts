import { fetcher } from "@/lib/fetcher";
import { fetchClientQuery, invalidateClientQueries, queryTags } from "@/lib/clientQueryCache";

export type TechIconBadgeRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export type TechIconBadge = {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: TechIconBadgeRarity;
};

export type BadgeCollectionItem = TechIconBadge & {
  isOwned: boolean;
  acquiredAt: string | null;
  isSelected: boolean;
};

export type BadgeCollectionResponse = {
  ticketBalance: number;
  ownedCount: number;
  totalCount: number;
  selectedBadge: TechIconBadge | null;
  badges: BadgeCollectionItem[];
};

export type DrawTechIconBadgeResponse = {
  ticketBalance: number;
  acquiredAt: string;
  badge: TechIconBadge;
};

export type SetSelectedTechIconBadgeResponse = {
  selectedBadge: TechIconBadge;
};

export const getBadgeCollection = async (
  token: string
): Promise<BadgeCollectionResponse> => {
  return fetchClientQuery(
    "badges",
    () => fetcher<BadgeCollectionResponse>("/badges", { method: "GET", token }),
    { staleTimeMs: 15_000, tags: [queryTags.badges] }
  );
};

export const drawTechIconBadge = async (
  token: string
): Promise<DrawTechIconBadgeResponse> => {
  const result = await fetcher<DrawTechIconBadgeResponse>("/badges/gacha", {
    method: "POST",
    token,
  });
  invalidateClientQueries([queryTags.badges, queryTags.collection, queryTags.profile, queryTags.history]);
  return result;
};

export const setSelectedTechIconBadge = async (
  token: string,
  badgeId: string
): Promise<SetSelectedTechIconBadgeResponse> => {
  const result = await fetcher<SetSelectedTechIconBadgeResponse>("/badges/profile", {
    method: "POST",
    token,
    body: JSON.stringify({ badgeId }),
  });
  invalidateClientQueries([queryTags.badges, queryTags.collection, queryTags.profile]);
  return result;
};
