import { fetcher } from "@/lib/fetcher";
import { fetchClientQuery, invalidateClientQueries, queryTags } from "@/lib/clientQueryCache";
import type { AchievementRarity } from "./achievements.api";
export type ProfileHistoryType = "mission_completed" | "achievement_unlocked" | "activity_completed";
export type ProfileHistoryItem = { id: string; type: ProfileHistoryType; title: string; description: string; occurredAt: string; href: string | null };
export type ProfileResponse = {
  user: { displayName: string | null; rank: string; level: number; exp: number; completedCourseCount: number; completedMissionCount: number; achievementCount: number; knowledgeCardCount: number; selectedMascotId: string };
  selectedAchievement: { id: string; title: string; description: string; rarity: AchievementRarity; iconKey: string } | null;
  hexadProfile: { questionnaireVersion: string; scores: { philanthropist: number; socialiser: number; freeSpirit: number; achiever: number; disruptor: number; player: number }; completedAt: string } | null;
  recentWorks: { id: string; title: string; description: string; createMissionTitle: string; isFavorite: boolean; updatedAt: string; href: string }[];
  history: ProfileHistoryItem[];
};
export const getProfile = (token: string): Promise<ProfileResponse> => fetchClientQuery("profile", () => fetcher<ProfileResponse>("/profile", { method: "GET", token }), { staleTimeMs: 15_000, tags: [queryTags.profile] });
export const updateProfileMascot = async (token: string, mascotId: string) => {
  const result = await fetcher<{ selectedMascotId: string }>("/profile/mascot", { method: "PATCH", token, body: JSON.stringify({ mascotId }) });
  invalidateClientQueries([queryTags.profile, queryTags.home]); return result;
};
