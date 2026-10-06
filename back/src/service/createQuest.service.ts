import {
  CourseExamFeedbackActionType as PrismaActionType,
  CourseExamFeedbackStatus,
  FeedbackCondition,
  Prisma,
  ProgressStatus,
} from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import {
  generateCourseExamFeedbackWithOpenAI,
  getCourseExamFeedbackModel,
} from "./courseExamFeedback.openai";
import { buildCourseExamFeedbackPrompt } from "./courseExamFeedback.prompt";
import { evaluateAchievementsForUser } from "./achievement.service";

type RequirementResultInput = {
  requirementId: string;
  passed: boolean;
  testResults: unknown[];
};

const toJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const getUser = async (firebaseUid: string) => {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: {
      id: true,
      experience: true,
      _count: { select: { knowledgeCards: true, achievements: true } },
      hexadResponse: true,
      experimentAssignments: {
        select: { condition: true },
        orderBy: { assignedAt: "asc" },
        take: 1,
      },
    },
  });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  return user;
};

const requirementSelect = {
  id: true,
  title: true,
  description: true,
  kind: true,
  category: true,
  points: true,
  order: true,
  tests: true,
  hints: true,
} satisfies Prisma.CreateQuestRequirementSelect;

const questInclude = {
  requirements: { orderBy: { order: "asc" as const }, select: requirementSelect },
  relatedCourses: {
    orderBy: { order: "asc" as const },
    include: { course: { select: { id: true, title: true, description: true } } },
  },
} satisfies Prisma.CreateQuestInclude;

type QuestWithRelations = Prisma.CreateQuestGetPayload<{ include: typeof questInclude }>;

function feedbackResponse(feedback: {
  status: CourseExamFeedbackStatus;
  currentState: string | null;
  nextGoal: string | null;
  nextStep: string | null;
  actionType: PrismaActionType | null;
  actionLabel: string | null;
  createdAt: Date;
  generatedAt: Date | null;
}) {
  return {
    status: feedback.status,
    requestedAt: feedback.createdAt.toISOString(),
    completedAt: feedback.generatedAt?.toISOString() ?? null,
    feedback:
      feedback.status === CourseExamFeedbackStatus.COMPLETED &&
      feedback.currentState &&
      feedback.nextGoal &&
      feedback.nextStep &&
      feedback.actionType &&
      feedback.actionLabel
        ? {
            currentState: feedback.currentState,
            nextGoal: feedback.nextGoal,
            nextStep: feedback.nextStep,
            actionType: feedback.actionType,
            actionLabel: feedback.actionLabel,
          }
        : null,
  };
}

const completedCourseIds = async (userId: string, courseIds: string[]) => {
  if (courseIds.length === 0) return new Set<string>();
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: {
      id: true,
      missions: {
        where: { isPublished: true, isRequiredForCourseCompletion: true },
        select: {
          progresses: {
            where: { userId, status: ProgressStatus.COMPLETED },
            select: { id: true },
          },
        },
      },
    },
  });
  return new Set(
    courses
      .filter(
        (course) =>
          course.missions.length > 0 &&
          course.missions.every((mission) => mission.progresses.length > 0),
      )
      .map((course) => course.id),
  );
};

const mapQuest = (
  quest: QuestWithRelations,
  completedIds: Set<string>,
  attempt?: {
    id: string;
    code: string;
    selectedRequirementIds: string[];
    status: string;
    bestScore: number;
    updatedAt: Date;
    hintViews?: Array<{ requirementId: string; hintId: string }>;
    executions?: Array<{ results: Prisma.JsonValue }>;
    submissions?: Array<{
      id: string;
      score: number;
      maxScore: number;
      feedback: Parameters<typeof feedbackResponse>[0] | null;
    }>;
  } | null,
) => {
  const maxScore = quest.requirements.reduce((sum, item) => sum + item.points, 0);
  const basicScore = quest.requirements
    .filter((item) => item.kind === "BASIC")
    .reduce((sum, item) => sum + item.points, 0);
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    scenario: quest.scenario,
    problemType: quest.problemType,
    functionName: quest.functionName,
    starterCode: quest.starterCode,
    estimatedMinutes: quest.estimatedMinutes,
    tags: quest.tags,
    thumbnailUrl: quest.thumbnailUrl,
    previewData: quest.previewData,
    maxScore,
    basicScore,
    requirements: quest.requirements,
    relatedCourses: quest.relatedCourses.map((link) => ({
      id: link.course.id,
      title: link.course.title,
      description: link.course.description,
      reason: link.reason,
      isCompleted: completedIds.has(link.course.id),
    })),
    attempt: attempt
      ? {
          id: attempt.id,
          code: attempt.code,
          selectedRequirementIds: attempt.selectedRequirementIds,
          status: attempt.status,
          bestScore: attempt.bestScore,
          viewedHints: attempt.hintViews ?? [],
          updatedAt: attempt.updatedAt.toISOString(),
          latestExecution: attempt.executions?.[0]
            ? { requirementResults: attempt.executions[0].results }
            : null,
          latestSubmission: attempt.submissions?.[0]
            ? {
                id: attempt.submissions[0].id,
                score: attempt.submissions[0].score,
                maxScore: attempt.submissions[0].maxScore,
                feedback: attempt.submissions[0].feedback
                  ? feedbackResponse(attempt.submissions[0].feedback)
                  : null,
              }
            : null,
        }
      : null,
  };
};

export const getCreateQuestsByFirebaseUid = async (firebaseUid: string) => {
  const user = await getUser(firebaseUid);
  const quests = await prisma.createQuest.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      ...questInclude,
      attempts: {
        where: { userId: user.id },
        select: {
          id: true,
          code: true,
          selectedRequirementIds: true,
          status: true,
          bestScore: true,
          updatedAt: true,
        },
        take: 1,
      },
    },
  });
  const courseIds = quests.flatMap((quest) =>
    quest.relatedCourses.map((link) => link.course.id),
  );
  const completedIds = await completedCourseIds(user.id, courseIds);
  return quests.map((quest) => mapQuest(quest, completedIds, quest.attempts[0]));
};

export const getCreateQuestByFirebaseUid = async ({
  firebaseUid,
  questId,
}: {
  firebaseUid: string;
  questId: string;
}) => {
  const user = await getUser(firebaseUid);
  const quest = await prisma.createQuest.findFirst({
    where: { id: questId, isPublished: true },
    include: questInclude,
  });
  if (!quest) throw new AppError(404, "CREATE_QUEST_NOT_FOUND", "Create quest not found");
  const attempt = await prisma.createQuestAttempt.findUnique({
    where: { userId_questId: { userId: user.id, questId } },
    select: {
      id: true,
      code: true,
      selectedRequirementIds: true,
      status: true,
      bestScore: true,
      updatedAt: true,
      hintViews: { select: { requirementId: true, hintId: true } },
      executions: {
        orderBy: { executedAt: "desc" },
        take: 1,
        select: { results: true },
      },
      submissions: {
        orderBy: { submittedAt: "desc" },
        take: 1,
        select: {
          id: true,
          score: true,
          maxScore: true,
          feedback: {
            select: {
              status: true,
              currentState: true,
              nextGoal: true,
              nextStep: true,
              actionType: true,
              actionLabel: true,
              createdAt: true,
              generatedAt: true,
            },
          },
        },
      },
    },
  });
  const completedIds = await completedCourseIds(
    user.id,
    quest.relatedCourses.map((link) => link.course.id),
  );
  return mapQuest(quest, completedIds, attempt);
};

export const startCreateQuestAttemptByFirebaseUid = async ({
  firebaseUid,
  questId,
}: {
  firebaseUid: string;
  questId: string;
}) => {
  const user = await getUser(firebaseUid);
  const quest = await prisma.createQuest.findFirst({
    where: { id: questId, isPublished: true },
    select: { id: true, starterCode: true },
  });
  if (!quest) throw new AppError(404, "CREATE_QUEST_NOT_FOUND", "Create quest not found");
  const attempt = await prisma.createQuestAttempt.upsert({
    where: { userId_questId: { userId: user.id, questId } },
    update: {},
    create: { userId: user.id, questId, code: quest.starterCode },
    select: { id: true },
  });
  return { attemptId: attempt.id };
};

const getOwnedAttempt = async (firebaseUid: string, attemptId: string) => {
  const attempt = await prisma.createQuestAttempt.findFirst({
    where: { id: attemptId, user: { firebaseUid } },
    include: { quest: { include: questInclude } },
  });
  if (!attempt) throw new AppError(404, "CREATE_QUEST_ATTEMPT_NOT_FOUND", "Attempt not found");
  return attempt;
};

const normalizeResults = (
  quest: QuestWithRelations,
  values: RequirementResultInput[],
) => {
  const incoming = new Map(values.map((value) => [value.requirementId, value]));
  const results = quest.requirements.map((requirement) => {
    const value = incoming.get(requirement.id);
    return {
      requirementId: requirement.id,
      title: requirement.title,
      kind: requirement.kind,
      category: requirement.category,
      points: requirement.points,
      passed: value?.passed === true,
      testResults: Array.isArray(value?.testResults) ? value.testResults : [],
    };
  });
  const basicPassed = results
    .filter((result) => result.kind === "BASIC")
    .every((result) => result.passed);
  const score = results
    .filter((result) => result.passed)
    .reduce((sum, result) => sum + result.points, 0);
  return { results, score, basicPassed };
};

export const saveCreateQuestExecutionByFirebaseUid = async ({
  firebaseUid,
  attemptId,
  code,
  requirementResults,
  runtimeError,
}: {
  firebaseUid: string;
  attemptId: string;
  code: string;
  requirementResults: RequirementResultInput[];
  runtimeError?: string | null;
}) => {
  const attempt = await getOwnedAttempt(firebaseUid, attemptId);
  const normalized = normalizeResults(attempt.quest, requirementResults);
  const execution = await prisma.$transaction(async (tx) => {
    const created = await tx.createQuestTestExecution.create({
      data: {
        attemptId,
        code,
        score: normalized.score,
        basicPassed: normalized.basicPassed,
        results: toJson(normalized.results),
        runtimeError: runtimeError?.trim() || null,
      },
    });
    await tx.createQuestAttempt.update({
      where: { id: attemptId },
      data: {
        code,
        bestScore: Math.max(attempt.bestScore, normalized.score),
      },
    });
    return created;
  });
  return {
    executionId: execution.id,
    score: normalized.score,
    maxScore: attempt.quest.requirements.reduce((sum, item) => sum + item.points, 0),
    basicPassed: normalized.basicPassed,
    requirementResults: normalized.results,
  };
};

export const updateCreateQuestAttemptByFirebaseUid = async ({
  firebaseUid,
  attemptId,
  code,
  selectedRequirementIds,
}: {
  firebaseUid: string;
  attemptId: string;
  code: string;
  selectedRequirementIds: string[];
}) => {
  const attempt = await getOwnedAttempt(firebaseUid, attemptId);
  const validIds = new Set(attempt.quest.requirements.map((item) => item.id));
  const selected = [...new Set(selectedRequirementIds)].filter((id) => validIds.has(id));
  await prisma.createQuestAttempt.update({
    where: { id: attemptId },
    data: { code, selectedRequirementIds: selected },
  });
  return { attemptId, savedAt: new Date().toISOString() };
};

export const recordCreateQuestHintViewByFirebaseUid = async ({
  firebaseUid,
  attemptId,
  requirementId,
  hintId,
}: {
  firebaseUid: string;
  attemptId: string;
  requirementId: string;
  hintId: string;
}) => {
  const attempt = await getOwnedAttempt(firebaseUid, attemptId);
  const requirement = attempt.quest.requirements.find((item) => item.id === requirementId);
  if (!requirement) throw new AppError(404, "CREATE_QUEST_REQUIREMENT_NOT_FOUND", "Requirement not found");
  const hints = Array.isArray(requirement.hints) ? requirement.hints : [];
  const exists = hints.some(
    (value) => typeof value === "object" && value !== null && "id" in value && value.id === hintId,
  );
  if (!exists) throw new AppError(404, "CREATE_QUEST_HINT_NOT_FOUND", "Hint not found");
  await prisma.createQuestHintView.upsert({
    where: { attemptId_requirementId_hintId: { attemptId, requirementId, hintId } },
    update: {},
    create: { attemptId, requirementId, hintId },
  });
  return { requirementId, hintId };
};

export const submitCreateQuestByFirebaseUid = async ({
  firebaseUid,
  attemptId,
  code,
  requirementResults,
}: {
  firebaseUid: string;
  attemptId: string;
  code: string;
  requirementResults: RequirementResultInput[];
}) => {
  const attempt = await getOwnedAttempt(firebaseUid, attemptId);
  const normalized = normalizeResults(attempt.quest, requirementResults);
  if (!normalized.basicPassed) {
    throw new AppError(409, "CREATE_QUEST_BASIC_REQUIREMENTS_NOT_MET", "Basic requirements are required");
  }
  const maxScore = attempt.quest.requirements.reduce((sum, item) => sum + item.points, 0);
  const submission = await prisma.$transaction(async (tx) => {
    const created = await tx.createQuestSubmission.create({
      data: {
        attemptId,
        code,
        score: normalized.score,
        maxScore,
        basicPassed: true,
        results: toJson(normalized.results),
      },
    });
    await tx.createQuestAttempt.update({
      where: { id: attemptId },
      data: {
        code,
        status: "COMPLETED",
        completedAt: attempt.completedAt ?? new Date(),
        bestScore: Math.max(attempt.bestScore, normalized.score),
      },
    });
    return created;
  });
  const unlockedAchievements = await evaluateAchievementsForUser(attempt.userId);
  return { submissionId: submission.id, score: normalized.score, maxScore, unlockedAchievements };
};

export const startCreateQuestFeedbackByFirebaseUid = async ({
  firebaseUid,
  submissionId,
}: {
  firebaseUid: string;
  submissionId: string;
}) => {
  const user = await getUser(firebaseUid);
  const submission = await prisma.createQuestSubmission.findFirst({
    where: { id: submissionId, attempt: { userId: user.id } },
    include: {
      feedback: true,
      attempt: {
        include: {
          quest: { include: questInclude },
          executions: { orderBy: { executedAt: "asc" } },
          hintViews: { orderBy: { viewedAt: "asc" } },
          submissions: { orderBy: { submittedAt: "asc" } },
        },
      },
    },
  });
  if (!submission) throw new AppError(404, "CREATE_QUEST_SUBMISSION_NOT_FOUND", "Submission not found");
  if (!submission.basicPassed) throw new AppError(409, "CREATE_QUEST_NOT_COMPLETED", "Basic requirements are required");
  if (submission.feedback) return feedbackResponse(submission.feedback);

  const condition = user.experimentAssignments[0]?.condition ?? FeedbackCondition.STANDARD;
  if (condition === FeedbackCondition.PERSONALIZED && !user.hexadResponse) {
    throw new AppError(409, "HEXAD_RESPONSE_REQUIRED", "PERSONALIZED feedback requires a HEXAD response");
  }
  const attempt = submission.attempt;
  const requirementById = new Map(attempt.quest.requirements.map((item) => [item.id, item]));
  const learningLog = {
    activityType: "CREATE_QUEST",
    quest: { id: attempt.quest.id, title: attempt.quest.title, scenario: attempt.quest.scenario },
    startedAt: attempt.startedAt.toISOString(),
    completedAt: attempt.completedAt?.toISOString() ?? null,
    selectedRequirementIds: attempt.selectedRequirementIds,
    requirements: attempt.quest.requirements.map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.kind,
      category: item.category,
      points: item.points,
    })),
    testExecutions: attempt.executions.map((item) => ({
      executedAt: item.executedAt.toISOString(),
      code: item.code,
      score: item.score,
      basicPassed: item.basicPassed,
      results: item.results,
      runtimeError: item.runtimeError,
    })),
    hintViews: attempt.hintViews.map((item) => ({
      requirementId: item.requirementId,
      requirementTitle: requirementById.get(item.requirementId)?.title ?? item.requirementId,
      hintId: item.hintId,
      viewedAt: item.viewedAt.toISOString(),
    })),
    submissions: attempt.submissions.map((item) => ({
      submittedAt: item.submittedAt.toISOString(),
      code: item.code,
      score: item.score,
      maxScore: item.maxScore,
      results: item.results,
    })),
  };
  const availableActions = [
    { actionType: "RETRY_CREATE_QUEST", label: "この作る課題を改善する", description: "未達成の追加要件へ再挑戦します。" },
    ...attempt.quest.relatedCourses.map((item) => ({
      actionType: "OPEN_RELATED_COURSE",
      label: `${item.course.title}を学ぶ`,
      description: item.reason,
      courseId: item.course.id,
    })),
    { actionType: "SHARE_CREATE_QUEST", label: "掲示板で作品を共有する", description: "提出コードと達成要件を作品として共有します。" },
    { actionType: "VIEW_BOARD_POSTS", label: "掲示板を見る", description: "他の学習者の作品や考え方を確認します。" },
  ];
  const hexad = user.hexadResponse;
  const context = {
    condition,
    learningLog,
    appState: {
      experience: user.experience,
      knowledgeCardCount: user._count.knowledgeCards,
      achievementCount: user._count.achievements,
      thisSubmission: { score: submission.score, maxScore: submission.maxScore },
    },
    availableActions,
    hexadProfile:
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
        : null,
  };
  const prompt = buildCourseExamFeedbackPrompt(context);
  const created = await prisma.createQuestFeedback.create({
    data: {
      submissionId,
      status: CourseExamFeedbackStatus.GENERATING,
      condition,
      model: getCourseExamFeedbackModel(),
      inputSnapshot: toJson({
        learningLog: context.learningLog,
        appState: context.appState,
        availableActions,
        ...(context.hexadProfile ? { hexadProfile: context.hexadProfile } : {}),
      }),
    },
  });

  void (async () => {
    try {
      const result = await generateCourseExamFeedbackWithOpenAI(prompt, condition);
      const validActions = new Set(availableActions.map((item) => item.actionType));
      if (result.feedback.actionType !== "NO_APP_ACTION" && !validActions.has(result.feedback.actionType)) {
        throw new Error(`Unavailable action returned: ${result.feedback.actionType}`);
      }
      await prisma.createQuestFeedback.update({
        where: { id: created.id },
        data: {
          status: CourseExamFeedbackStatus.COMPLETED,
          currentState: result.feedback.currentState,
          nextGoal: result.feedback.nextGoal,
          nextStep: result.feedback.nextStep,
          actionType: result.feedback.actionType as PrismaActionType,
          actionLabel: result.feedback.actionLabel,
          learningAnalysis: toJson(result.feedback.learningAnalysis),
          selectionAnalysis: toJson(result.feedback.selectionAnalysis),
          openAiResponseId: result.responseId,
          model: result.model,
          usage: toJson(result.usage),
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("create_quest_feedback_generation_failed", error);
      await prisma.createQuestFeedback.update({
        where: { id: created.id },
        data: { status: CourseExamFeedbackStatus.FAILED, failureCode: "GENERATION_FAILED" },
      });
    }
  })();

  return feedbackResponse(created);
};

export const getCreateQuestFeedbackByFirebaseUid = async ({
  firebaseUid,
  submissionId,
}: {
  firebaseUid: string;
  submissionId: string;
}) => {
  const feedback = await prisma.createQuestFeedback.findFirst({
    where: { submissionId, submission: { attempt: { user: { firebaseUid } } } },
  });
  if (!feedback) throw new AppError(404, "CREATE_QUEST_FEEDBACK_NOT_FOUND", "Feedback not found");
  return feedbackResponse(feedback);
};

export const getCreateQuestAttemptsByFirebaseUid = async (firebaseUid: string) => {
  const user = await getUser(firebaseUid);
  return prisma.createQuestAttempt.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      questId: true,
      status: true,
      bestScore: true,
      updatedAt: true,
      quest: { select: { title: true, description: true, thumbnailUrl: true, problemType: true } },
      submissions: { orderBy: { submittedAt: "desc" }, take: 1, select: { id: true, score: true, maxScore: true } },
    },
  });
};
