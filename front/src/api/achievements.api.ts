import { fetcher } from "@/lib/fetcher";
import { fetchClientQuery, invalidateClientQueries, queryTags } from "@/lib/clientQueryCache";

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
  return fetchClientQuery(
    "achievements",
    () => fetcher<AchievementsResponse>("/achievements", { method: "GET", token }),
    { staleTimeMs: 15_000, tags: [queryTags.achievements] }
  );
};

export const updateTargetAchievement = async (
  token: string,
  achievementId: string | null
): Promise<{ targetAchievementId: string | null }> => {
  const result = await fetcher<{ targetAchievementId: string | null }>("/achievements/target", {
    method: "PATCH",
    token,
    body: JSON.stringify({ achievementId }),
  });
  invalidateClientQueries([queryTags.achievements, queryTags.home]);
  return result;
};
