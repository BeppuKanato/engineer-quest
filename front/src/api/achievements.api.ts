import { fetcher } from "@/lib/fetcher";

export type AchievementStatus =
  | "achieved"
  | "visible_locked"
  | "secret_locked";

export type AchievementItem = {
  id: string;
  category: string;
  status: AchievementStatus;
  title: string;
  description: string;
  conditionLabel: string | null;
  achievedAt: string | null;
};

export type AchievementCategoryGroup = {
  category: string;
  label: string;
  achievements: AchievementItem[];
};

export const getAchievements = async (
  token: string
): Promise<AchievementCategoryGroup[]> => {
  return fetcher<AchievementCategoryGroup[]>("/achievements", {
    method: "GET",
    token,
  });
};
