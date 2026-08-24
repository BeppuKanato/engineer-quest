import { fetcher } from "@/lib/fetcher";
import type {
  CollectKnowledgeCardResponse,
  KnowledgeCardChoice,
  UnlockedAchievement,
} from "@/app/mission/[missionId]/play/type";
import { fetchClientQuery, invalidateClientQueries, queryTags, updateClientQueryData } from "@/lib/clientQueryCache";

export type MissionRewardRunResponse = {
  id: string;
  mission: {
    id: string;
    courseId: string;
    title: string;
    learnedItems: string[];
    courseTitle: string;
    isCourseCompletion: boolean;
  };
  candidateKnowledgeCards: KnowledgeCardChoice[];
  selectedKnowledgeCard: KnowledgeCardChoice | null;
  unlockedAchievements: Omit<UnlockedAchievement, "achievedAt">[];
  awardedExp: number;
  awardedBadgeTickets: number;
  nextMission: {
    id: string;
    title: string;
  } | null;
  unlockedChallenges: {
    id: string;
    title: string;
  }[];
  createdAt: string;
};

export const getMissionRewardRun = async (
  token: string,
  rewardRunId: string
): Promise<MissionRewardRunResponse> => {
  return fetchClientQuery(
    `mission-reward:${rewardRunId}`,
    () => fetcher<MissionRewardRunResponse>(
      `/mission-rewards/${encodeURIComponent(rewardRunId)}`,
      { method: "GET", token }
    ),
    { staleTimeMs: 2 * 60_000, tags: [queryTags.missionRewards] }
  );
};

export const selectMissionRewardKnowledgeCard = async (
  token: string,
  rewardRunId: string,
  knowledgeCardId: string
): Promise<CollectKnowledgeCardResponse & { selectedAt: string }> => {
  const result = await fetcher<CollectKnowledgeCardResponse & { selectedAt: string }>(
    `/mission-rewards/${encodeURIComponent(rewardRunId)}/knowledge-card/select`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ knowledgeCardId }),
    }
  );
  updateClientQueryData<MissionRewardRunResponse>(
    `mission-reward:${rewardRunId}`,
    (current) => ({ ...current, selectedKnowledgeCard: result.knowledgeCard })
  );
  invalidateClientQueries([queryTags.collection, queryTags.profile, queryTags.history]);
  return result;
};
