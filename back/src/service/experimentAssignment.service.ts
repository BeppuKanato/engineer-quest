import {
  FeedbackCondition,
  Prisma,
} from "@prisma/client";

import { prisma } from "../lib/prisma";

export const HEXAD_FEEDBACK_EXPERIMENT_KEY = "HEXAD_FEEDBACK_2026";

export const feedbackConditionForAssignmentCount = (
  assignmentCount: number
): FeedbackCondition =>
  assignmentCount % 2 === 0
    ? FeedbackCondition.STANDARD
    : FeedbackCondition.PERSONALIZED;

export const ensureHexadFeedbackExperimentAssignment = async (
  tx: Prisma.TransactionClient,
  userId: string
) => {
  const existing = await tx.experimentAssignment.findUnique({
    where: {
      userId_experimentKey: {
        userId,
        experimentKey: HEXAD_FEEDBACK_EXPERIMENT_KEY,
      },
    },
  });
  if (existing) return existing;

  const assignmentCount = await tx.experimentAssignment.count({
    where: { experimentKey: HEXAD_FEEDBACK_EXPERIMENT_KEY },
  });

  return tx.experimentAssignment.create({
    data: {
      userId,
      experimentKey: HEXAD_FEEDBACK_EXPERIMENT_KEY,
      condition: feedbackConditionForAssignmentCount(assignmentCount),
    },
  });
};

export const getExperimentAssignment = (
  userId: string,
  experimentKey: string
) =>
  prisma.experimentAssignment.findUnique({
    where: { userId_experimentKey: { userId, experimentKey } },
  });

export const getFeedbackCondition = async (userId: string) => {
  const assignment = await getExperimentAssignment(
    userId,
    HEXAD_FEEDBACK_EXPERIMENT_KEY
  );
  return assignment?.condition ?? null;
};
