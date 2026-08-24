import {
  CourseExamFeedbackActionType as PrismaActionType,
  CourseExamFeedbackStatus,
  FeedbackCondition,
  Prisma,
} from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import { buildCourseExamFeedbackContext } from "./courseExamFeedback.context";
import {
  generateCourseExamFeedbackWithOpenAI,
  getCourseExamFeedbackModel,
  type CourseExamFeedbackGenerationResult,
  type CourseExamFeedbackGenerator,
} from "./courseExamFeedback.openai";
import {
  buildCourseExamFeedbackPrompt,
  COURSE_EXAM_FEEDBACK_PROMPT_VERSION,
} from "./courseExamFeedback.prompt";
import type {
  CourseExamFeedbackActionType,
  GeneratedCourseExamFeedback,
} from "./courseExamFeedback.schema";

let feedbackGenerator: CourseExamFeedbackGenerator =
  generateCourseExamFeedbackWithOpenAI;

export const setCourseExamFeedbackGeneratorForTests = (
  generator: CourseExamFeedbackGenerator
) => {
  feedbackGenerator = generator;
};

export const resetCourseExamFeedbackGeneratorForTests = () => {
  feedbackGenerator = generateCourseExamFeedbackWithOpenAI;
};

const toJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const validateGeneratedFeedback = ({
  generated,
  condition,
  availableActionTypes,
}: {
  generated: GeneratedCourseExamFeedback;
  condition: FeedbackCondition;
  availableActionTypes: Set<string>;
}) => {
  if (
    generated.actionType !== "NO_APP_ACTION" &&
    !availableActionTypes.has(generated.actionType)
  ) {
    throw new Error(`Unavailable action returned: ${generated.actionType}`);
  }
  if (
    condition === FeedbackCondition.STANDARD &&
    generated.selectionAnalysis.personalizationAdjustment !== null
  ) {
    throw new Error("STANDARD feedback must not contain personalization");
  }
  if (
    condition === FeedbackCondition.PERSONALIZED &&
    generated.selectionAnalysis.personalizationAdjustment === null
  ) {
    throw new Error("PERSONALIZED feedback must describe its adjustment");
  }
};

const runGeneration = async ({
  feedbackId,
  condition,
  prompt,
  availableActionTypes,
}: {
  feedbackId: string;
  condition: FeedbackCondition;
  prompt: string;
  availableActionTypes: Set<string>;
}) => {
  try {
    if (process.env.COURSE_EXAM_FEEDBACK_PROMPT_DEBUG === "true") {
      console.info("course_exam_feedback_prompt_debug", { feedbackId, prompt });
    }

    let result: CourseExamFeedbackGenerationResult | null = null;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        result = await feedbackGenerator(prompt, condition);
        validateGeneratedFeedback({
          generated: result.feedback,
          condition,
          availableActionTypes,
        });
        break;
      } catch (error) {
        lastError = error;
        result = null;
      }
    }
    if (!result) throw lastError ?? new Error("Feedback generation failed");

    const generated = result.feedback;
    await prisma.courseExamFeedback.update({
      where: { id: feedbackId },
      data: {
        status: CourseExamFeedbackStatus.COMPLETED,
        currentState: generated.currentState,
        nextGoal: generated.nextGoal,
        nextStep: generated.nextStep,
        actionType: generated.actionType as PrismaActionType,
        actionLabel: generated.actionLabel,
        learningAnalysis: toJson(generated.learningAnalysis),
        selectionAnalysis: toJson(generated.selectionAnalysis),
        openAiResponseId: result.responseId,
        model: result.model,
        usage: toJson(result.usage),
        failureCode: null,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    const failureCode =
      error instanceof Error && error.message.includes("OPENAI_API_KEY")
        ? "OPENAI_API_KEY_MISSING"
        : "GENERATION_FAILED";
    console.error("course_exam_feedback_generation_failed", {
      feedbackId,
      failureCode,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    await prisma.courseExamFeedback.updateMany({
      where: { id: feedbackId, status: CourseExamFeedbackStatus.GENERATING },
      data: { status: CourseExamFeedbackStatus.FAILED, failureCode },
    });
  }
};

const toFeedbackResponse = (feedback: {
  status: CourseExamFeedbackStatus;
  currentState: string | null;
  nextGoal: string | null;
  nextStep: string | null;
  actionType: PrismaActionType | null;
  actionLabel: string | null;
  learningAnalysis: Prisma.JsonValue | null;
  selectionAnalysis: Prisma.JsonValue | null;
  createdAt: Date;
  generatedAt: Date | null;
}) => ({
  status: feedback.status,
  source: "GENERATED" as const,
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
          actionType: feedback.actionType as CourseExamFeedbackActionType,
          actionLabel: feedback.actionLabel,
          learningAnalysis: feedback.learningAnalysis,
          selectionAnalysis: feedback.selectionAnalysis,
        }
      : null,
});

const getOwnedFeedback = async (firebaseUid: string, rewardRunId: string) => {
  const rewardRun = await prisma.missionRewardRun.findFirst({
    where: { id: rewardRunId, user: { firebaseUid } },
    select: {
      courseExamAttemptId: true,
      courseExamAttempt: { select: { feedback: true } },
    },
  });
  if (!rewardRun) {
    throw new AppError(404, "COURSE_RESULT_NOT_FOUND", "Course result not found");
  }
  if (!rewardRun.courseExamAttemptId) {
    throw new AppError(409, "COURSE_EXAM_ATTEMPT_REQUIRED", "Attempt is required");
  }
  return rewardRun.courseExamAttempt?.feedback ?? null;
};

export const getCourseExamFeedbackByFirebaseUid = async ({
  firebaseUid,
  rewardRunId,
}: {
  firebaseUid: string;
  rewardRunId: string;
}) => {
  const feedback = await getOwnedFeedback(firebaseUid, rewardRunId);
  if (!feedback) {
    throw new AppError(404, "COURSE_EXAM_FEEDBACK_NOT_FOUND", "Feedback not found");
  }
  return toFeedbackResponse(feedback);
};

export const startCourseExamFeedbackByFirebaseUid = async ({
  firebaseUid,
  rewardRunId,
}: {
  firebaseUid: string;
  rewardRunId: string;
}) => {
  const context = await buildCourseExamFeedbackContext({ firebaseUid, rewardRunId });
  const prompt = buildCourseExamFeedbackPrompt(context);
  const inputSnapshot = {
    learningLog: context.learningLog,
    appState: context.appState,
    availableActions: context.availableActions,
    ...(context.hexadProfile ? { hexadProfile: context.hexadProfile } : {}),
  };

  let feedback = await prisma.courseExamFeedback.findUnique({
    where: { attemptId: context.attemptId },
  });
  if (feedback?.status === CourseExamFeedbackStatus.COMPLETED) {
    return toFeedbackResponse(feedback);
  }
  if (feedback?.status === CourseExamFeedbackStatus.GENERATING) {
    return toFeedbackResponse(feedback);
  }

  let shouldGenerate = false;
  if (feedback?.status === CourseExamFeedbackStatus.FAILED) {
    const updated = await prisma.courseExamFeedback.updateMany({
      where: {
        id: feedback.id,
        status: CourseExamFeedbackStatus.FAILED,
      },
      data: {
        status: CourseExamFeedbackStatus.GENERATING,
        condition: context.condition,
        model: getCourseExamFeedbackModel(),
        promptVersion: COURSE_EXAM_FEEDBACK_PROMPT_VERSION,
        inputSnapshot: toJson(inputSnapshot),
        failureCode: null,
      },
    });
    shouldGenerate = updated.count === 1;
    feedback = await prisma.courseExamFeedback.findUniqueOrThrow({
      where: { attemptId: context.attemptId },
    });
  } else if (!feedback) {
    try {
      feedback = await prisma.courseExamFeedback.create({
        data: {
          attemptId: context.attemptId,
          status: CourseExamFeedbackStatus.GENERATING,
          condition: context.condition,
          model: getCourseExamFeedbackModel(),
          promptVersion: COURSE_EXAM_FEEDBACK_PROMPT_VERSION,
          inputSnapshot: toJson(inputSnapshot),
        },
      });
      shouldGenerate = true;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }
      feedback = await prisma.courseExamFeedback.findUniqueOrThrow({
        where: { attemptId: context.attemptId },
      });
    }
  }

  if (shouldGenerate) {
    const availableActionTypes = new Set(
      context.availableActions.map((action) => action.actionType)
    );
    void runGeneration({
      feedbackId: feedback.id,
      condition: context.condition,
      prompt,
      availableActionTypes,
    }).catch((error) => {
      console.error("course_exam_feedback_background_task_failed", {
        feedbackId: feedback.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    });
  }
  return toFeedbackResponse(feedback);
};
