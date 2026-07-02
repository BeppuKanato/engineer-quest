import { fetcher } from "@/lib/fetcher";
import type {
  CollectKnowledgeCardResponse,
  KnowledgeCardChoice,
  UnlockedAchievement,
} from "@/app/mission/[missionId]/play/type";

export type MissionRewardRunResponse = {
  id: string;
  mission: {
    id: string;
    courseId: string;
    title: string;
    learnedItems: string[];
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
  return fetcher<MissionRewardRunResponse>(
    `/mission-rewards/${encodeURIComponent(rewardRunId)}`,
    {
      method: "GET",
      token,
    }
  );
};

export const selectMissionRewardKnowledgeCard = async (
  token: string,
  rewardRunId: string,
  knowledgeCardId: string
): Promise<CollectKnowledgeCardResponse & { selectedAt: string }> => {
  return fetcher<CollectKnowledgeCardResponse & { selectedAt: string }>(
    `/mission-rewards/${encodeURIComponent(rewardRunId)}/knowledge-card/select`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ knowledgeCardId }),
    }
  );
};
