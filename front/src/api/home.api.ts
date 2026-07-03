import type { Mission, Status, TargetAchievement } from "@/app/home/type";
import { fetcher } from "@/lib/fetcher";

export type HomeResponse = {
  user: {
    displayName: string | null;
    rank: string;
    level: number;
    requireNextLevelExp: number;
    exp: number;
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
  nextRank: {
    name: string;
  } | null;
  nextRankCondition: Record<string, { title: string; status: Status }[]>;
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
  return fetcher<HomeResponse>("/home", {
    method: "GET",
    token,
  });
};
