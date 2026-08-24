import { MissionType } from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import { parseActivityContent } from "../type/activityContent";
export {
  getCourseExamFeedbackByFirebaseUid as getCourseResultFeedbackByFirebaseUid,
  startCourseExamFeedbackByFirebaseUid as startCourseResultFeedbackByFirebaseUid,
} from "./courseExamFeedback.service";

const acceptedEventIds = new Set<string>();

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const getOwnedCourseRewardRun = async (firebaseUid: string, rewardRunId: string) => {
  const rewardRun = await prisma.missionRewardRun.findFirst({
    where: {
      id: rewardRunId,
      user: { firebaseUid },
    },
    include: {
      courseExamAttempt: {
        select: {
          id: true,
          startedAt: true,
          completedAt: true,
          hintViews: {
            orderBy: { viewedAt: "asc" },
            select: { hintId: true, viewedAt: true },
          },
          submissions: {
            orderBy: { submittedAt: "asc" },
            select: { passed: true, testResults: true },
          },
        },
      },
      mission: {
        include: {
          course: { select: { id: true, title: true } },
          activities: {
            orderBy: { order: "asc" },
            select: { id: true, content: true },
          },
          progresses: {
            where: { user: { firebaseUid } },
            select: { startedAt: true, completedAt: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!rewardRun) {
    throw new AppError(404, "COURSE_RESULT_NOT_FOUND", "Course result not found");
  }
  if (rewardRun.mission.type !== MissionType.COURSE_EXAM) {
    throw new AppError(
      400,
      "NOT_COURSE_COMPLETION_RESULT",
      "This reward run is not a course completion result"
    );
  }

  return rewardRun;
};

const getCourseResultMetadata = (contents: unknown[]) => {
  for (const content of contents) {
    const metadata = asRecord(parseActivityContent(content).data.courseResult);
    if (Object.keys(metadata).length > 0) return metadata;
  }
  return {};
};

export const getCourseResultByFirebaseUid = async ({
  firebaseUid,
  rewardRunId,
}: {
  firebaseUid: string;
  rewardRunId: string;
}) => {
  const rewardRun = await getOwnedCourseRewardRun(firebaseUid, rewardRunId);
  const activityIds = rewardRun.mission.activities.map((activity) => activity.id);
  const answerLogs = await prisma.activityAnswerLog.findMany({
    where: {
      user: { firebaseUid },
      activityId: { in: activityIds },
    },
    orderBy: { answeredAt: "asc" },
    select: { answer: true, isCorrect: true, answeredAt: true },
  });
  const unlockedAchievements =
    rewardRun.unlockedAchievementIds.length > 0
      ? await prisma.achievement.findMany({
          where: { id: { in: rewardRun.unlockedAchievementIds } },
        })
      : [];
  const achievementMap = new Map(
    unlockedAchievements.map((achievement) => [achievement.id, achievement])
  );

  const metadata = getCourseResultMetadata(
    rewardRun.mission.activities.map((activity) => activity.content)
  );
  const hintTitleById = new Map<string, string>();
  for (const activity of rewardRun.mission.activities) {
    const hints = parseActivityContent(activity.content).data.hints;
    if (!Array.isArray(hints)) continue;
    for (const value of hints) {
      const hint = asRecord(value);
      if (typeof hint.id === "string" && typeof hint.title === "string") {
        hintTitleById.set(hint.id, hint.title);
      }
    }
  }
  const courseLabel = rewardRun.mission.course.title.replace(
    /の動きを理解する$/,
    ""
  );
  const testActivity = rewardRun.mission.activities.find((activity) => {
    const content = parseActivityContent(activity.content).data;
    return content.evaluationMode === "TEST_CASES";
  });
  const testActivityData = testActivity
    ? parseActivityContent(testActivity.content).data
    : {};
  const testCases = Array.isArray(testActivityData.testCases)
    ? (testActivityData.testCases as unknown[])
    : [];
  const latestCorrectAnswer = [...answerLogs]
    .reverse()
    .find((log) => log.isCorrect === true);
  const correctAnswer = asRecord(latestCorrectAnswer?.answer);
  const progress = rewardRun.mission.progresses[0];
  const attempt = rewardRun.courseExamAttempt;
  const successfulSubmission = attempt
    ? [...attempt.submissions].reverse().find((submission) => submission.passed)
    : undefined;
  const successfulTestResults = Array.isArray(successfulSubmission?.testResults)
    ? successfulSubmission.testResults
    : [];
  const successfulPassedTestCount = successfulTestResults.filter(
    (value) => asRecord(value).passed === true
  ).length;
  const durationSeconds =
    attempt?.startedAt && attempt.completedAt
      ? Math.max(
          0,
          Math.round(
            (attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000
          )
        )
      : progress?.startedAt && progress.completedAt
      ? Math.max(
          0,
          Math.round(
            (progress.completedAt.getTime() - progress.startedAt.getTime()) / 1000
          )
        )
      : 0;

  return {
    id: rewardRun.id,
    mission: {
      id: rewardRun.mission.id,
      title: rewardRun.mission.title,
    },
    course: rewardRun.mission.course,
    attempt: attempt
      ? {
          id: attempt.id,
          startedAt: attempt.startedAt.toISOString(),
          completedAt: attempt.completedAt?.toISOString() ?? null,
          hintViews: attempt.hintViews.map((view) => ({
            hintId: view.hintId,
            title: hintTitleById.get(view.hintId) ?? view.hintId,
            viewedAt: view.viewedAt.toISOString(),
          })),
        }
      : null,
    completedAt:
      attempt?.completedAt?.toISOString() ??
      progress?.completedAt?.toISOString() ??
      rewardRun.createdAt.toISOString(),
    rewards: {
      experience: rewardRun.awardedExp,
      badgeTickets: rewardRun.awardedBadgeTickets,
      unlockedAchievementCount: rewardRun.unlockedAchievementIds.length,
    },
    unlockedAchievements: rewardRun.unlockedAchievementIds
      .map((id) => achievementMap.get(id))
      .filter((achievement): achievement is NonNullable<typeof achievement> =>
        Boolean(achievement)
      )
      .map((achievement) => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        category: achievement.category,
        categoryLabel:
          achievement.category === "COURSE_COMPLETE" ? "コース完了" : "実績解除",
      })),
    summary: {
      passedTests:
        successfulTestResults.length > 0
          ? successfulPassedTestCount
          : typeof correctAnswer.passedTestCount === "number"
          ? correctAnswer.passedTestCount
          : testCases.length,
      totalTests: testCases.length,
      submissionCount: attempt?.submissions.length ?? answerLogs.length,
      hintUsageCount:
        attempt?.hintViews.length ??
        (typeof correctAnswer.hintUsageCount === "number"
          ? correctAnswer.hintUsageCount
          : 0),
      durationSeconds,
    },
    presentation: {
      masteryTitle:
        typeof metadata.masteryTitle === "string"
          ? metadata.masteryTitle
          : `${courseLabel}をマスター`,
      description:
        typeof metadata.description === "string"
          ? metadata.description
          : `${courseLabel}コースをすべて修了しました。`,
      learningOutcome:
        typeof metadata.learningOutcome === "string"
          ? metadata.learningOutcome
          : `${courseLabel}を実装できるようになりました。`,
    },
  };
};

export const recordCourseResultEventByFirebaseUid = async ({
  firebaseUid,
  rewardRunId,
  eventId,
  eventType,
  occurredAt,
  durationMs,
}: {
  firebaseUid: string;
  rewardRunId: string;
  eventId: string;
  eventType: string;
  occurredAt: string;
  durationMs?: number;
}) => {
  const ownedRewardRun = await prisma.missionRewardRun.findFirst({
    where: {
      id: rewardRunId,
      user: { firebaseUid },
      mission: { type: MissionType.COURSE_EXAM },
    },
    select: { id: true },
  });
  if (!ownedRewardRun) {
    throw new AppError(404, "COURSE_RESULT_NOT_FOUND", "Course result not found");
  }
  const dedupeKey = `${firebaseUid}:${rewardRunId}:${eventId}`;
  if (acceptedEventIds.has(dedupeKey)) {
    return { accepted: true, duplicate: true };
  }
  acceptedEventIds.add(dedupeKey);
  console.info("course_result_event", {
    rewardRunId,
    eventType,
    occurredAt,
    durationMs: durationMs ?? null,
    storage: "STUB_MEMORY",
  });
  return { accepted: true, duplicate: false };
};
