import { fetcher } from "@/lib/fetcher";
import type { KnowledgeCardChoice, UnlockedAchievement } from "@/features/learning/mission-activity-play/missionActivityPlay.types";
import { fetchClientQuery, queryTags } from "@/lib/clientQueryCache";
export type MissionRewardRunResponse = {
  id: string;
  mission: { id: string; courseId: string; title: string; learnedItems: string[]; courseTitle: string; isCourseCompletion: boolean };
  awardedKnowledgeCard: (KnowledgeCardChoice & { catalogNumber: number; connection: string; useCase: string; searchKeywords: string[] }) | null;
  unlockedAchievements: (Omit<UnlockedAchievement, "achievedAt"> & { rarity: string; iconKey: string })[];
  awardedExp: number; nextMission: { id: string; title: string } | null; unlockedChallenges: { id: string; title: string }[]; createdAt: string;
};
export const getMissionRewardRun = (token: string, rewardRunId: string): Promise<MissionRewardRunResponse> => fetchClientQuery(
  `mission-reward:${rewardRunId}`,
  () => fetcher<MissionRewardRunResponse>(`/mission-rewards/${encodeURIComponent(rewardRunId)}`, { method: "GET", token }),
  { staleTimeMs: 120_000, tags: [queryTags.missionRewards] },
);
