import { fetcher } from "@/lib/fetcher";
import { invalidateClientQueries, queryTags } from "@/lib/clientQueryCache";
import type { BfsUnitPhaseSummary } from "@/features/learning/bfs/unit/unit.types";

export type LearningStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type UnitProgress = { status: LearningStatus; lastPhaseKey: string | null; startedAt: string; completedAt: string | null };
export type PhaseProgress = { phaseKey: string; status: LearningStatus; summary: unknown; startedAt: string; completedAt: string | null };
export type LearningProgress = { courseId: string; unit: UnitProgress | null; phases: PhaseProgress[] };
export type AwardedCard = {
  id: string; catalogNumber: number; label: string; title: string; description: string;
  connection: string; useCase: string; searchKeywords: string[]; rarity: string;
};
export type UnlockedAchievement = {
  id: string; title: string; description: string; category: string; categoryLabel: string;
  rarity: string; iconKey: string; achievedAt: string;
};
export type PhaseCompletion = { courseId: string; phase: PhaseProgress; awardedCard?: AwardedCard | null; unlockedAchievements: UnlockedAchievement[] };
export type UnitCompletion = { courseId: string; unit: UnitProgress; unlockedAchievements: UnlockedAchievement[] };
export type LearningEvent = {
  eventType: string; courseId?: string; phaseKey?: string; targetId?: string;
  payload?: Record<string, unknown>; clientTimestamp: string;
};
const unitPath = (courseId: string) => `/learning/units/${encodeURIComponent(courseId)}`;
const invalidate = () => invalidateClientQueries([queryTags.courses, queryTags.home, queryTags.collection, queryTags.achievements]);
export const getLearningProgress = (token: string, courseId: string) => fetcher<LearningProgress>(`${unitPath(courseId)}/progress`, { token });
export async function startLearningUnit(token: string, courseId: string, phaseKey?: string) {
  const result = await fetcher<{ courseId: string; unit: UnitProgress }>(`${unitPath(courseId)}/start`, { token, method: "POST", body: JSON.stringify({ phaseKey }) });
  invalidate(); return result;
}
export async function completeLearningPhase(token: string, courseId: string, phaseKey: string, summary?: BfsUnitPhaseSummary) {
  const result = await fetcher<PhaseCompletion>(`${unitPath(courseId)}/phases/${encodeURIComponent(phaseKey)}/complete`, { token, method: "POST", body: JSON.stringify({ summary }) });
  invalidate(); return result;
}
export async function completeLearningUnit(token: string, courseId: string) {
  const result = await fetcher<UnitCompletion>(`${unitPath(courseId)}/complete`, { token, method: "POST", body: "{}" });
  invalidate(); return result;
}
export const sendLearningEvents = (token: string, sessionId: string, events: readonly LearningEvent[], keepalive = false) =>
  fetcher<{ accepted: number }>("/learning/events/batch", { token, method: "POST", body: JSON.stringify({ sessionId, events }), keepalive });
