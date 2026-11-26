import { fetcher } from "@/lib/fetcher";
import { fetchClientQuery, invalidateClientQueries, queryTags } from "@/lib/clientQueryCache";

export type DevelopmentMissionBest = {
  missionId: string;
  points: number;
  count: number;
  attempts: number;
  lastAttemptAt: string;
};

export const getDevelopmentMissionBests = async (
  token: string
): Promise<{ bests: DevelopmentMissionBest[] }> => {
  return fetchClientQuery(
    "development-mission-bests",
    () => fetcher<{ bests: DevelopmentMissionBest[] }>("/development-missions/bests", { method: "GET", token }),
    { staleTimeMs: 15_000, tags: [queryTags.missionOverview] }
  );
};

export const recordDevelopmentMissionAttempt = async (
  token: string,
  missionId: string,
  input: { points: number; count: number; code: string }
): Promise<{ best: DevelopmentMissionBest | null; isNewBest: boolean }> => {
  const result = await fetcher<{ best: DevelopmentMissionBest | null; isNewBest: boolean }>(
    `/development-missions/${missionId}/attempts`,
    { method: "POST", token, body: JSON.stringify(input) }
  );
  invalidateClientQueries(["development-mission-bests"]);
  return result;
};
