import { fetcher } from "@/lib/fetcher";

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
  return fetcher<BadgeCollectionResponse>("/badges", {
    method: "GET",
    token,
  });
};

export const drawTechIconBadge = async (
  token: string
): Promise<DrawTechIconBadgeResponse> => {
  return fetcher<DrawTechIconBadgeResponse>("/badges/gacha", {
    method: "POST",
    token,
  });
};

export const setSelectedTechIconBadge = async (
  token: string,
  badgeId: string
): Promise<SetSelectedTechIconBadgeResponse> => {
  return fetcher<SetSelectedTechIconBadgeResponse>("/badges/profile", {
    method: "POST",
    token,
    body: JSON.stringify({ badgeId }),
  });
};
