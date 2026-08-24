import { MissionType, Prisma, ProgressStatus } from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import { parseActivityContent } from "../type/activityContent";

type HintDefinition = {
  id: string;
  title: string;
};

type StoredTestResult = {
  testCaseId: string;
  passed: boolean;
  expectedOutput?: Prisma.InputJsonValue;
  actualOutput?: Prisma.InputJsonValue;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const getHintDefinitions = (activities: { content: unknown }[]) => {
  const definitions = new Map<string, HintDefinition>();

  for (const activity of activities) {
    const hints = parseActivityContent(activity.content).data.hints;
    if (!Array.isArray(hints)) continue;

    for (const value of hints) {
      const hint = asRecord(value);
      if (typeof hint.id !== "string" || typeof hint.title !== "string") continue;
      definitions.set(hint.id, { id: hint.id, title: hint.title });
    }
  }

  return definitions;
};

const toJsonValue = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const normalizeTestResults = (value: unknown): StoredTestResult[] => {
  if (!Array.isArray(value)) {
    throw new AppError(400, "INVALID_TEST_RESULTS", "テスト結果は配列で指定してください。");
  }

  return value.map((item) => {
    const result = asRecord(item);
    if (
      typeof result.testCaseId !== "string" ||
      typeof result.passed !== "boolean"
    ) {
      throw new AppError(
        400,
        "INVALID_TEST_RESULTS",
        "各テスト結果にはtestCaseIdとpassedが必要です。"
      );
    }

    return {
      testCaseId: result.testCaseId,
      passed: result.passed,
      ...(result.expectedOutput !== undefined
        ? { expectedOutput: toJsonValue(result.expectedOutput) }
        : {}),
      ...(result.actualOutput !== undefined
        ? { actualOutput: toJsonValue(result.actualOutput) }
        : {}),
    };
  });
};

const getCourseExamMission = async (missionId: string) => {
  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      type: MissionType.COURSE_EXAM,
      isPublished: true,
    },
    select: {
      id: true,
      activities: {
        orderBy: { order: "asc" },
        select: { id: true, content: true },
      },
    },
  });

  if (!mission) {
    throw new AppError(
      404,
      "COURSE_EXAM_NOT_FOUND",
      "COURSE_EXAMが見つかりません。"
    );
  }

  return mission;
};

const assertCourseExamUnlocked = async (userId: string, missionId: string) => {
  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      type: MissionType.COURSE_EXAM,
      isPublished: true,
      course: { isPublished: true },
    },
    select: {
      id: true,
      progresses: {
        where: { userId },
        select: { id: true },
      },
      course: {
        select: {
          missions: {
            where: {
              isPublished: true,
              isRequiredForCourseCompletion: true,
            },
            orderBy: { order: "asc" },
            select: {
              id: true,
              progresses: {
                where: { userId, status: ProgressStatus.COMPLETED },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "COURSE_EXAM_NOT_FOUND", "COURSE_EXAMが見つかりません。");
  }
  if (mission.progresses.length > 0) return;

  const requiredMissions = mission.course.missions;
  const currentIndex = requiredMissions.findIndex(
    (candidate) => candidate.id === mission.id
  );
  const previousMission = currentIndex > 0 ? requiredMissions[currentIndex - 1] : null;

  if (previousMission && previousMission.progresses.length === 0) {
    throw new AppError(
      403,
      "MISSION_LOCKED",
      "前のMissionを完了するとCOURSE_EXAMを開始できます。"
    );
  }
};

const toAttemptResponse = (
  attempt: {
    id: string;
    userId: string;
    missionId: string;
    startedAt: Date;
    completedAt: Date | null;
    hintViews: { hintId: string; viewedAt: Date }[];
    testExecutions?: {
      id: string;
      code: string;
      testResults: unknown;
      runtimeError: string | null;
      executedAt: Date;
    }[];
    submissions?: {
      id: string;
      code: string;
      passed: boolean;
      testResults: unknown;
      submittedAt: Date;
    }[];
  },
  hintDefinitions: Map<string, HintDefinition>
) => ({
  id: attempt.id,
  missionId: attempt.missionId,
  startedAt: attempt.startedAt.toISOString(),
  completedAt: attempt.completedAt?.toISOString() ?? null,
  hintViews: attempt.hintViews.map((view) => ({
    hintId: view.hintId,
    title: hintDefinitions.get(view.hintId)?.title ?? view.hintId,
    viewedAt: view.viewedAt.toISOString(),
  })),
  testExecutions: (attempt.testExecutions ?? []).map((execution) => ({
    id: execution.id,
    code: execution.code,
    testResults: execution.testResults,
    runtimeError: execution.runtimeError,
    executedAt: execution.executedAt.toISOString(),
  })),
  submissions: (attempt.submissions ?? []).map((submission) => ({
    id: submission.id,
    code: submission.code,
    passed: submission.passed,
    testResults: submission.testResults,
    submittedAt: submission.submittedAt.toISOString(),
  })),
});

const attemptLogInclude = {
  hintViews: { orderBy: { viewedAt: "asc" as const } },
  testExecutions: { orderBy: { executedAt: "asc" as const } },
  submissions: { orderBy: { submittedAt: "asc" as const } },
};

const getAttemptWithViews = (attemptId: string, userId: string) =>
  prisma.courseExamAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      hintViews: { orderBy: { viewedAt: "asc" } },
    },
  });

export const getCurrentCourseExamAttempt = async (
  userId: string,
  missionId: string
) => {
  const mission = await getCourseExamMission(missionId);
  const attempt = await prisma.courseExamAttempt.findFirst({
    where: { userId, missionId, completedAt: null },
    orderBy: { startedAt: "desc" },
    include: attemptLogInclude,
  });

  return {
    attempt: attempt
      ? toAttemptResponse(attempt, getHintDefinitions(mission.activities))
      : null,
  };
};

export const listCourseExamAttempts = async (
  userId: string,
  missionId: string
) => {
  const mission = await getCourseExamMission(missionId);
  const definitions = getHintDefinitions(mission.activities);
  const attempts = await prisma.courseExamAttempt.findMany({
    where: { userId, missionId },
    orderBy: { startedAt: "desc" },
    include: attemptLogInclude,
  });

  return {
    attempts: attempts.map((attempt) =>
      toAttemptResponse(attempt, definitions)
    ),
  };
};

export const startOrResumeCourseExamAttempt = async (
  userId: string,
  missionId: string
) => {
  await assertCourseExamUnlocked(userId, missionId);
  const mission = await getCourseExamMission(missionId);
  const definitions = getHintDefinitions(mission.activities);
  const current = await prisma.courseExamAttempt.findFirst({
    where: { userId, missionId, completedAt: null },
    orderBy: { startedAt: "desc" },
    include: attemptLogInclude,
  });

  if (current) {
    return toAttemptResponse(current, definitions);
  }

  try {
    const attempt = await prisma.$transaction(async (tx) => {
      const [progress, previousAttempt] = await Promise.all([
        tx.userMissionProgress.findUnique({
          where: { userId_missionId: { userId, missionId } },
          select: { status: true },
        }),
        tx.courseExamAttempt.findFirst({
          where: { userId, missionId },
          orderBy: { startedAt: "desc" },
          select: { completedAt: true },
        }),
      ]);
      const startedAt = new Date();
      const isRetry =
        progress?.status === ProgressStatus.COMPLETED ||
        previousAttempt?.completedAt != null;

      if (isRetry) {
        await tx.userMissionActivityProgress.deleteMany({
          where: {
            userId,
            activityId: { in: mission.activities.map((activity) => activity.id) },
          },
        });
      }

      await tx.userMissionProgress.upsert({
        where: { userId_missionId: { userId, missionId } },
        update: isRetry
          ? {
              status: ProgressStatus.IN_PROGRESS,
              currentActivityId: mission.activities[0]?.id ?? null,
              startedAt,
              completedAt: null,
            }
          : {},
        create: {
          userId,
          missionId,
          status: ProgressStatus.IN_PROGRESS,
          currentActivityId: mission.activities[0]?.id ?? null,
          startedAt,
        },
      });

      return tx.courseExamAttempt.create({
        data: { userId, missionId, startedAt },
        include: {
          hintViews: true,
          testExecutions: true,
          submissions: true,
        },
      });
    });

    return toAttemptResponse(attempt, definitions);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const concurrentAttempt = await prisma.courseExamAttempt.findFirst({
        where: { userId, missionId, completedAt: null },
        include: attemptLogInclude,
      });
      if (concurrentAttempt) {
        return toAttemptResponse(concurrentAttempt, definitions);
      }
    }
    throw error;
  }
};

export const recordCourseExamHintView = async ({
  userId,
  missionId,
  attemptId,
  hintId,
}: {
  userId: string;
  missionId: string;
  attemptId: string;
  hintId: string;
}) => {
  const mission = await getCourseExamMission(missionId);
  const definitions = getHintDefinitions(mission.activities);
  const definition = definitions.get(hintId);

  if (!definition) {
    throw new AppError(400, "INVALID_COURSE_EXAM_HINT", "無効なヒントIDです。");
  }

  const attempt = await getAttemptWithViews(attemptId, userId);
  if (!attempt || attempt.missionId !== missionId) {
    throw new AppError(404, "COURSE_EXAM_ATTEMPT_NOT_FOUND", "挑戦データが見つかりません。");
  }
  if (attempt.completedAt) {
    throw new AppError(409, "COURSE_EXAM_ATTEMPT_COMPLETED", "完了済みの挑戦は変更できません。");
  }

  const hintView = await prisma.courseExamHintView.upsert({
    where: { attemptId_hintId: { attemptId, hintId } },
    update: {},
    create: { attemptId, hintId },
  });

  return {
    hintId: hintView.hintId,
    title: definition.title,
    viewedAt: hintView.viewedAt.toISOString(),
  };
};

const getOwnedActiveAttempt = async (
  userId: string,
  missionId: string,
  attemptId?: string
) => {
  const attempt = await prisma.courseExamAttempt.findFirst({
    where: {
      ...(attemptId ? { id: attemptId } : {}),
      userId,
      missionId,
      completedAt: null,
    },
    select: { id: true },
  });

  if (!attempt) {
    throw new AppError(
      404,
      "COURSE_EXAM_ATTEMPT_NOT_FOUND",
      "進行中の挑戦データが見つかりません。"
    );
  }
  return attempt;
};

export const recordCourseExamTestExecution = async ({
  userId,
  missionId,
  attemptId,
  code,
  testResults,
  runtimeError,
}: {
  userId: string;
  missionId: string;
  attemptId: string;
  code: unknown;
  testResults: unknown;
  runtimeError: unknown;
}) => {
  await getCourseExamMission(missionId);
  const attempt = await getOwnedActiveAttempt(userId, missionId, attemptId);
  if (typeof code !== "string") {
    throw new AppError(400, "INVALID_TEST_CODE", "実行時のコードが必要です。");
  }
  if (runtimeError !== null && typeof runtimeError !== "string") {
    throw new AppError(400, "INVALID_RUNTIME_ERROR", "実行時エラーの形式が不正です。");
  }
  const normalizedResults = normalizeTestResults(testResults);
  const execution = await prisma.courseExamTestExecution.create({
    data: {
      attemptId: attempt.id,
      code,
      testResults: normalizedResults,
      runtimeError,
    },
  });

  return {
    id: execution.id,
    code: execution.code,
    testResults: execution.testResults,
    runtimeError: execution.runtimeError,
    executedAt: execution.executedAt.toISOString(),
  };
};

export const recordCourseExamSubmission = async ({
  userId,
  missionId,
  code,
  passed,
  testResults,
}: {
  userId: string;
  missionId: string;
  code: unknown;
  passed: boolean;
  testResults: unknown;
}) => {
  await getCourseExamMission(missionId);
  const attempt = await getOwnedActiveAttempt(userId, missionId);
  if (typeof code !== "string") {
    throw new AppError(400, "INVALID_SUBMISSION_CODE", "提出コードが必要です。");
  }
  const normalizedResults = normalizeTestResults(testResults);
  const submission = await prisma.courseExamSubmission.create({
    data: {
      attemptId: attempt.id,
      code,
      passed,
      testResults: normalizedResults,
    },
  });

  return {
    id: submission.id,
    attemptId: attempt.id,
    passed: submission.passed,
    submittedAt: submission.submittedAt.toISOString(),
  };
};
