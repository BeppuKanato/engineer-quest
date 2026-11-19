import type { Mission, TargetAchievement } from "@/app/home/type";
import { fetcher } from "@/lib/fetcher";
import { fetchClientQuery, queryTags } from "@/lib/clientQueryCache";

export type HomeUnit = {
  id: string; title: string; group: string; status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  completedPhases: number; totalPhases: number; collectedCards: number; totalCards: number;
  href: string; resumeHref: string; nextPhase: string | null;
};
export type HomeResponse = {
  overview: { completedUnits: number; totalUnits: number; collectedCards: number; totalCards: number; units: HomeUnit[] };
  today: { recommended: HomeUnit | null; nearAchievements: { id: string; title: string; progress: number; goal: number; href: string }[]; nearCards: HomeUnit[] };
  resume: (HomeUnit & { nextStep: string | null }) | null;
  hasInProgressUnit: boolean;
  week: { streakDays: number; days: { date: string; label: string; learned: boolean; isToday: boolean }[] };
  questions: { id: string; title: string; createdAt: string; href: string }[];
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
