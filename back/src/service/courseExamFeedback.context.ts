import { FeedbackCondition, MissionType } from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import { parseActivityContent } from "../type/activityContent";
import { HEXAD_FEEDBACK_EXPERIMENT_KEY } from "./experimentAssignment.service";
import { getAvailableCourseExamFeedbackActions } from "./courseExamFeedback.actions";

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const buildCourseExamFeedbackContext = async ({
  firebaseUid,
  rewardRunId,
}: {
  firebaseUid: string;
  rewardRunId: string;
}) => {
  const rewardRun = await prisma.missionRewardRun.findFirst({
    where: { id: rewardRunId, user: { firebaseUid } },
    include: {
      user: {
        select: {
          id: true,
          experience: true,
          badgeTickets: true,
          selectedTargetAchievement: { select: { id: true, title: true } },
          hexadResponse: {
            select: {
              questionnaireVersion: true,
              philanthropistScore: true,
              socialiserScore: true,
              freeSpiritScore: true,
              achieverScore: true,
              disruptorScore: true,
              playerScore: true,
            },
          },
          experimentAssignments: {
            where: { experimentKey: HEXAD_FEEDBACK_EXPERIMENT_KEY },
            select: { condition: true },
            take: 1,
          },
        },
      },
      courseExamAttempt: {
        include: {
          hintViews: { orderBy: { viewedAt: "asc" } },
          testExecutions: { orderBy: { executedAt: "asc" } },
          submissions: { orderBy: { submittedAt: "asc" } },
        },
      },
      mission: {
        include: {
          course: { select: { id: true, title: true } },
          activities: {
            orderBy: { order: "asc" },
            select: { content: true },
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
  const attempt = rewardRun.courseExamAttempt;
  if (!attempt || !attempt.completedAt) {
    throw new AppError(
      409,
      "COURSE_EXAM_NOT_COMPLETED",
      "The course exam attempt is not completed"
    );
  }
  if (!attempt.submissions.some((submission) => submission.passed)) {
    throw new AppError(
      409,
      "COURSE_EXAM_NOT_PASSED",
      "A successful course exam submission is required"
    );
  }

  const condition = rewardRun.user.experimentAssignments[0]?.condition;
  if (!condition) {
    throw new AppError(
      409,
      "EXPERIMENT_ASSIGNMENT_REQUIRED",
      "A feedback experiment assignment is required"
    );
  }
  if (
    condition === FeedbackCondition.PERSONALIZED &&
    !rewardRun.user.hexadResponse
  ) {
    throw new AppError(
      409,
      "HEXAD_RESPONSE_REQUIRED",
      "PERSONALIZED feedback requires a HEXAD response"
    );
  }

  const [ownedKnowledgeCardCount, ownedBadgeCount, publishedBadgeCount, workCount] =
    await Promise.all([
      prisma.userKnowledgeCard.count({ where: { userId: rewardRun.user.id } }),
      prisma.userTechIconBadge.count({ where: { userId: rewardRun.user.id } }),
      prisma.techIconBadge.count({ where: { isPublished: true } }),
      prisma.userWork.count({ where: { userId: rewardRun.user.id } }),
    ]);

  const unlockedAchievements = rewardRun.unlockedAchievementIds.length
    ? await prisma.achievement.findMany({
        where: { id: { in: rewardRun.unlockedAchievementIds } },
        select: { id: true, title: true },
      })
    : [];
  const selectedKnowledgeCard = rewardRun.selectedKnowledgeCardId
    ? await prisma.knowledgeCard.findUnique({
        where: { id: rewardRun.selectedKnowledgeCardId },
        select: { id: true, title: true },
      })
    : null;

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

  const learningLog = {
    attemptId: attempt.id,
    course: { id: rewardRun.mission.course.id, title: rewardRun.mission.course.title },
    mission: { id: rewardRun.mission.id, title: rewardRun.mission.title },
    startedAt: attempt.startedAt.toISOString(),
    completedAt: attempt.completedAt.toISOString(),
    testExecutions: attempt.testExecutions.map((execution) => ({
      id: execution.id,
      executedAt: execution.executedAt.toISOString(),
      code: execution.code,
      testResults: execution.testResults,
      runtimeError: execution.runtimeError,
    })),
    hintViews: attempt.hintViews.map((view) => ({
      hintId: view.hintId,
      title: hintTitleById.get(view.hintId) ?? view.hintId,
      viewedAt: view.viewedAt.toISOString(),
    })),
    submissions: attempt.submissions.map((submission) => ({
      id: submission.id,
      submittedAt: submission.submittedAt.toISOString(),
      code: submission.code,
      passed: submission.passed,
      testResults: submission.testResults,
    })),
  };

  const appState = {
    experience: rewardRun.user.experience,
    badgeTickets: rewardRun.user.badgeTickets,
    selectedTargetAchievement: rewardRun.user.selectedTargetAchievement,
    collections: {
      knowledgeCardCount: ownedKnowledgeCardCount,
      techIconBadgeCount: ownedBadgeCount,
      publishedTechIconBadgeCount: publishedBadgeCount,
    },
    thisCompletion: {
      awardedExperience: rewardRun.awardedExp,
      awardedBadgeTickets: rewardRun.awardedBadgeTickets,
      unlockedAchievements,
      selectedKnowledgeCard,
    },
  };

  const availableActions = getAvailableCourseExamFeedbackActions({
    hasWork: workCount > 0,
    hasKnowledgeCard: ownedKnowledgeCardCount > 0,
    badgeTickets: rewardRun.user.badgeTickets,
    ownedBadgeCount,
    publishedBadgeCount,
  });
  const hexad = rewardRun.user.hexadResponse;
  const hexadProfile =
    condition === FeedbackCondition.PERSONALIZED && hexad
      ? {
          questionnaireVersion: hexad.questionnaireVersion,
          Philanthropist: hexad.philanthropistScore,
          Socialiser: hexad.socialiserScore,
          "Free Spirit": hexad.freeSpiritScore,
          Achiever: hexad.achieverScore,
          Disruptor: hexad.disruptorScore,
          Player: hexad.playerScore,
        }
      : null;

  return {
    attemptId: attempt.id,
    condition,
    learningLog,
    appState,
    availableActions,
    hexadProfile,
  };
};

export type CourseExamFeedbackContext = Awaited<
  ReturnType<typeof buildCourseExamFeedbackContext>
>;
