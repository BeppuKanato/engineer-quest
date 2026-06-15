import type { Mission } from "@/app/mission/[missionId]/overview/type";
import type { Lesson } from "@/app/mission/[missionId]/lesson/[lessonId]/play/type";
import { fetcher } from "@/lib/fetcher";

export const getMissionOverview = async (token: string, missionId: string): Promise<Mission> => {
    return fetcher<Mission>(`/missions/${encodeURIComponent(missionId)}/overview`, {
        method: "GET",
        token,
    });
};

export const getLessonPlay = async (
  token: string,
  lessonId: string
): Promise<Lesson> => {
  return fetcher<Lesson>(
    `/missions/lesson/${encodeURIComponent(lessonId)}/play`,
    {
      method: "GET",
      token,
    }
  );
};

export type CompleteLessonResponse = {
  lessonId: string;
  missionId: string;
  status: "completed" | "in_progress";
  completedAt: string | null;
};

export const completeLesson = async (
  token: string,
  lessonId: string
): Promise<CompleteLessonResponse> => {
  return fetcher<CompleteLessonResponse>(
    `/missions/lesson/${encodeURIComponent(lessonId)}/complete`,
    {
      method: "POST",
      token,
    }
  );
};