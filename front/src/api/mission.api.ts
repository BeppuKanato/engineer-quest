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
  CourseExamAttempt,
  CourseExamHintView,
  CourseExamTestExecution,
  CourseExamTestResultLog,
} from "@/app/mission/[missionId]/play/type";
import { fetchClientQuery, invalidateClientQueries, queryTags } from "@/lib/clientQueryCache";
import { parseActivityContent } from "@/features/learning/activityContent";

const validateMissionActivityContent = <T extends MissionPlayResponse>(mission: T): T => ({
  ...mission,
  activities: mission.activities.map((activity) => ({
    ...activity,
    content: parseActivityContent(activity.content),
  })),
});

const invalidateProgressQueries = () =>
  invalidateClientQueries([
    queryTags.home,
    queryTags.courses,
    queryTags.roadmap,
    queryTags.profile,
    queryTags.collection,
    queryTags.achievements,
    queryTags.history,
    queryTags.missionOverview,
  ]);

export const getCurrentCourseExamAttempt = async (
  token: string,
  missionId: string
): Promise<{ attempt: CourseExamAttempt | null }> =>
  fetcher<{ attempt: CourseExamAttempt | null }>(
    `/missions/${encodeURIComponent(missionId)}/course-exam/attempt`,
    { method: "GET", token }
  );

export const listCourseExamAttempts = async (
  token: string,
  missionId: string
): Promise<{ attempts: CourseExamAttempt[] }> =>
  fetcher<{ attempts: CourseExamAttempt[] }>(
    `/missions/${encodeURIComponent(missionId)}/course-exam/attempts`,
    { method: "GET", token }
  );

export const startCourseExamAttempt = async (
  token: string,
  missionId: string
): Promise<CourseExamAttempt> =>
  fetcher<CourseExamAttempt>(
    `/missions/${encodeURIComponent(missionId)}/course-exam/attempt`,
    { method: "POST", token }
  ).then((result) => {
    invalidateClientQueries([queryTags.home, queryTags.courses, queryTags.roadmap]);
    return result;
  });

export const viewCourseExamHint = async (
  token: string,
  missionId: string,
  attemptId: string,
  hintId: string
): Promise<CourseExamHintView> =>
  fetcher<CourseExamHintView>(
    `/missions/${encodeURIComponent(missionId)}/course-exam/attempts/${encodeURIComponent(attemptId)}/hints/${encodeURIComponent(hintId)}`,
    { method: "POST", token }
  );

export const recordCourseExamTestExecution = async (
  token: string,
  missionId: string,
  attemptId: string,
  payload: {
    code: string;
    testResults: CourseExamTestResultLog[];
    runtimeError: string | null;
  }
): Promise<CourseExamTestExecution> =>
  fetcher<CourseExamTestExecution>(
    `/missions/${encodeURIComponent(missionId)}/course-exam/attempts/${encodeURIComponent(attemptId)}/test-executions`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );

export const getMissionOverview = async (
  token: string,
  missionId: string
): Promise<MissionOverviewResponse> => {
    return fetchClientQuery(
      `mission-overview:${missionId}`,
      () => fetcher<MissionOverviewResponse>(`/missions/${encodeURIComponent(missionId)}/overview`, { method: "GET", token })
        .then(validateMissionActivityContent),
      { staleTimeMs: 20_000, tags: [queryTags.missionOverview] }
    );
};

export const getMissionPlay = async (
  token: string,
  missionId: string,
  difficulty?: Difficulty
): Promise<MissionPlayResponse> => {
  const searchParams = difficulty
    ? `?${new URLSearchParams({ difficulty }).toString()}`
    : "";

  const result = await fetcher<MissionPlayResponse>(
    `/missions/${encodeURIComponent(missionId)}/play${searchParams}`,
    {
      method: "GET",
      token,
    }
  );
  // This legacy GET initializes/resumes progress, so related read caches must be stale.
  invalidateClientQueries([
    queryTags.home,
    queryTags.courses,
    queryTags.roadmap,
    queryTags.profile,
  ]);
  return validateMissionActivityContent(result);
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
  const result = await fetcher<CompleteMissionActivityResponse>(
    `/missions/${encodeURIComponent(missionId)}/activities/${encodeURIComponent(activityId)}/complete`,
    {
      method: "POST",
      token,
    }
  );
  invalidateProgressQueries();
  return result;
};

export const completeMission = async (
  token: string,
  missionId: string
): Promise<CompleteMissionResponse> => {
  const result = await fetcher<CompleteMissionResponse>(
    `/missions/${encodeURIComponent(missionId)}/complete`,
    {
      method: "POST",
      token,
    }
  );
  invalidateProgressQueries();
  invalidateClientQueries([queryTags.badges, queryTags.missionRewards]);
  return result;
};

export const collectKnowledgeCard = async (
  token: string,
  missionId: string,
  knowledgeCardId: string
): Promise<CollectKnowledgeCardResponse> => {
  const result = await fetcher<CollectKnowledgeCardResponse>(
    `/missions/${encodeURIComponent(missionId)}/knowledge-cards/collect`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ knowledgeCardId }),
    }
  );
  invalidateClientQueries([queryTags.collection, queryTags.profile, queryTags.history]);
  return result;
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
  const result = await fetcher<CompleteLessonResponse>(
    `/missions/lesson/${encodeURIComponent(lessonId)}/complete`,
    {
      method: "POST",
      token,
    }
  );
  invalidateProgressQueries();
  return result;
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
  const result = await fetcher<SubmitMissionExamResponse>(
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
  invalidateProgressQueries();
  invalidateClientQueries([queryTags.badges]);
  return result;
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
