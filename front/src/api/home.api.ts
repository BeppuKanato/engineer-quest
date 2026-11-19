import type { Mission, TargetAchievement } from "@/app/home/type";
import { fetcher } from "@/lib/fetcher";
import { fetchClientQuery, queryTags } from "@/lib/clientQueryCache";

export type HomeResponse = {
  user: {
    displayName: string | null;
    selectedMascotId: string;
    completedMissionNum: number;
    completedAchievementNum: number;
    todayCompletedMissionCount: number;
    dailyMissionGoal: number;
    continuationDays: number;
    totalDays: number;
  };
  missions: {
    resume: Mission | null;
    recommended: Mission | null;
    recommendedList: Mission[];
  };
  targetAchievement: TargetAchievement | null;
  calendar: {
    year: number;
    month: number;
    date: number;
    learnedDays: number[];
    continuationDays: number;
    totalDays: number;
    hasLearnedToday: boolean;
  };
};

export const getHome = async (token: string): Promise<HomeResponse> => {
  return fetchClientQuery(
    "home",
    () => fetcher<HomeResponse>("/home", { method: "GET", token }),
    { staleTimeMs: 300_000, tags: [queryTags.home] }
  );
};
