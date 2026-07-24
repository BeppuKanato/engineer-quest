import { fetcher } from "@/lib/fetcher";

export type AchievementStatus =
  | "achieved"
  | "visible_locked"
  | "secret_locked";

export type AchievementItem = {
  id: string;
  category: string;
  conditionType: string;
  conditionValue: number | null;
  seriesKey: string;
  seriesTitle: string;
  level: number;
  status: AchievementStatus;
  title: string;
  description: string;
  conditionLabel: string | null;
  goal: number;
  progress: number;
  href: string;
  actionLabel: string;
  achievedAt: string | null;
};

export type AchievementCategoryGroup = {
  category: string;
  label: string;
  achievements: AchievementItem[];
};

export type AchievementsResponse = {
  groups: AchievementCategoryGroup[];
  targetAchievementId: string | null;
};

export const getAchievements = async (
  token: string
): Promise<AchievementsResponse> => {
  return fetcher<AchievementsResponse>("/achievements", {
    method: "GET",
    token,
  });
};

export const updateTargetAchievement = async (
  token: string,
  achievementId: string | null
): Promise<{ targetAchievementId: string | null }> => {
  return fetcher<{ targetAchievementId: string | null }>("/achievements/target", {
    method: "PATCH",
    token,
    body: JSON.stringify({ achievementId }),
  });
};
