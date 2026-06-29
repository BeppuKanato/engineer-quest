import type { MissionOverviewResponse } from "@/app/mission/[missionId]/overview/type";
import type { Lesson } from "@/app/mission/[missionId]/lesson/[lessonId]/play/type";
import type { LessonCompleteData } from "@/app/mission/[missionId]/lesson/[lessonId]/complete/type";
import { fetcher } from "@/lib/fetcher";
import type { ExamIntroData } from "@/app/mission/[missionId]/exam/intro/type";
import type { Difficulty } from "@/app/mission/[missionId]/exam/intro/type";
import type {
  MissionExamDifficulty,
  MissionExamPlayResponse,
} from "@/app/mission/[missionId]/exam/play/type";
import type {
  AnswerMissionActivityResponse,
  CollectKnowledgeCardResponse,
  CompleteMissionActivityResponse,
  CompleteMissionResponse,
  MissionPlayResponse,
} from "@/app/mission/[missionId]/play/type";

export const getMissionOverview = async (
  token: string,
  missionId: string
): Promise<MissionOverviewResponse> => {
    return fetcher<MissionOverviewResponse>(`/missions/${encodeURIComponent(missionId)}/overview`, {
        method: "GET",
        token,
    });
};

export const getMissionPlay = async (
  token: string,
  missionId: string
): Promise<MissionPlayResponse> => {
  return fetcher<MissionPlayResponse>(
    `/missions/${encodeURIComponent(missionId)}/play`,
    {
      method: "GET",
      token,
    }
  );
};

export const answerMissionActivity = async (
  token: string,
  missionId: string,
  activityId: string,
  answer: unknown
): Promise<AnswerMissionActivityResponse> => {
  return fetcher<AnswerMissionActivityResponse>(
    `/missions/${encodeURIComponent(missionId)}/activities/${encodeURIComponent(activityId)}/answer`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ answer }),
    }
  );
};

export const completeMissionActivity = async (
  token: string,
  missionId: string,
  activityId: string
): Promise<CompleteMissionActivityResponse> => {
  return fetcher<CompleteMissionActivityResponse>(
    `/missions/${encodeURIComponent(missionId)}/activities/${encodeURIComponent(activityId)}/complete`,
    {
      method: "POST",
      token,
    }
  );
};

export const completeMission = async (
  token: string,
  missionId: string
): Promise<CompleteMissionResponse> => {
  return fetcher<CompleteMissionResponse>(
    `/missions/${encodeURIComponent(missionId)}/complete`,
    {
      method: "POST",
      token,
    }
  );
};

export const collectKnowledgeCard = async (
  token: string,
  missionId: string,
  knowledgeCardId: string
): Promise<CollectKnowledgeCardResponse> => {
  return fetcher<CollectKnowledgeCardResponse>(
    `/missions/${encodeURIComponent(missionId)}/knowledge-cards/collect`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ knowledgeCardId }),
    }
  );
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

export const getLessonComplete = async (
  token: string,
  lessonId: string
): Promise<LessonCompleteData> => {
  return fetcher<LessonCompleteData>(
    `/missions/lesson/${encodeURIComponent(lessonId)}/complete`,
    {
      method: "GET",
      token,
    }
  );
};

export const getMissionExamIntro = async (
  token: string,
  missionId: string
): Promise<ExamIntroData> => {
  return fetcher<ExamIntroData>(
    `/missions/${encodeURIComponent(missionId)}/exam/intro`,
    {
      method: "GET",
      token,
    }
  );
};

export type StartMissionExamResponse = {
  missionId: string;
  missionExamId: string;
  difficulty: Difficulty;
  startedAt: string | null;
  passed: boolean;
};

export const startMissionExam = async (
  token: string,
  missionId: string,
  difficulty: Difficulty
): Promise<StartMissionExamResponse> => {
  return fetcher<StartMissionExamResponse>(
    `/missions/${encodeURIComponent(missionId)}/exam/start`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        difficulty,
      }),
    }
  );
};

export const getMissionExamPlay = async (
  token: string,
  missionId: string,
  difficulty: MissionExamDifficulty
): Promise<MissionExamPlayResponse> => {
  const searchParams = new URLSearchParams({
    difficulty,
  });

  return fetcher<MissionExamPlayResponse>(
    `/missions/${encodeURIComponent(missionId)}/exam/play?${searchParams.toString()}`,
    {
      method: "GET",
      token,
    }
  );
};

export type SubmitMissionExamResponse = {
  missionId: string;
  missionExamId: string;
  difficulty: MissionExamDifficulty;
  isCorrect: boolean;
  passed: boolean;
  rewardExp: number;
  submittedAt: string;
  nextMission: {
    id: string;
    title: string;
  } | null;
};

export const submitMissionExam = async (
  token: string,
  missionId: string,
  difficulty: MissionExamDifficulty,
  submittedCode: string
): Promise<SubmitMissionExamResponse> => {
  return fetcher<SubmitMissionExamResponse>(
    `/missions/${encodeURIComponent(missionId)}/exam/submit`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        difficulty,
        submittedCode,
      }),
    }
  );
};

export type MissionExamResultResponse = {
  missionId: string;
  missionExamId: string;
  missionTitle: string;
  examTitle: string;
  difficulty: MissionExamDifficulty;
  rewardExp: number;
  completedAt: string;
  nextMission: {
    id: string;
    title: string;
  } | null;
  clearedDifficulties: {
    easy: boolean;
    normal: boolean;
    hard: boolean;
  };
};

export const getMissionExamResult = async (
  token: string,
  missionId: string,
  difficulty: MissionExamDifficulty
): Promise<MissionExamResultResponse> => {
  const searchParams = new URLSearchParams({
    difficulty,
  });

  return fetcher<MissionExamResultResponse>(
    `/missions/${encodeURIComponent(missionId)}/exam/result?${searchParams.toString()}`,
    {
      method: "GET",
      token,
    }
  );
};
