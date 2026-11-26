import {
  FeedbackCondition,
  Prisma,
} from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

export const HEXAD_FEEDBACK_EXPERIMENT_KEY = "HEXAD_FEEDBACK_2026";

/**
 * In-app assignment slots. The app only ever shows the slot number; the
 * condition name stays server-side so the label cannot reveal the arm.
 * 1 = STANDARD, 2 = TOP_1, 3 = ROULETTE.
 */
export const ASSIGNMENT_SLOT_CONDITIONS = {
  1: FeedbackCondition.STANDARD,
  2: FeedbackCondition.TOP_1,
  3: FeedbackCondition.ROULETTE,
} as const;

export type AssignmentSlot = keyof typeof ASSIGNMENT_SLOT_CONDITIONS;

export const isAssignmentSlot = (value: unknown): value is AssignmentSlot =>
  value === 1 || value === 2 || value === 3;

export const slotForCondition = (
  condition: FeedbackCondition | null | undefined
): AssignmentSlot => {
  const entry = Object.entries(ASSIGNMENT_SLOT_CONDITIONS).find(
    ([, c]) => c === condition
  );
  return entry ? (Number(entry[0]) as AssignmentSlot) : 1;
};

/**
 * New assignments always start at the default (slot 1 / STANDARD).
 * There is no automatic allocation; the slot is changed explicitly
 * in the app (or by the operator script) before feedback exists.
 */
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

  return tx.experimentAssignment.create({
    data: {
      userId,
      experimentKey: HEXAD_FEEDBACK_EXPERIMENT_KEY,
      condition: FeedbackCondition.STANDARD,
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

export const getFeedbackAssignmentSlot = async (
  userId: string
): Promise<AssignmentSlot> => slotForCondition(await getFeedbackCondition(userId));

/**
 * Change the caller's own assignment slot. Mirrors the operator script's
 * guards (setFeedbackExperimentCondition): a condition is never changed
 * after feedback has been generated for the user, and non-default slots
 * require a HEXAD response. Changing the slot clears the persisted
 * TOP_1 type so it is re-derived under the new condition.
 */
export const setFeedbackAssignmentSlot = async (
  userId: string,
  slot: AssignmentSlot
): Promise<AssignmentSlot> => {
  const condition = ASSIGNMENT_SLOT_CONDITIONS[slot];
  await prisma.$transaction(
    async (tx) => {
      const [feedbackCount, user] = await Promise.all([
        tx.feedbackV1.count({ where: { userId } }),
        tx.user.findUnique({
          where: { id: userId },
          select: { id: true, hexadResponse: { select: { id: true } } },
        }),
      ]);
      if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
      if (feedbackCount > 0) {
        throw new AppError(
          409,
          "FEEDBACK_ALREADY_EXISTS",
          "フィードバックが生成済みのため、設定は変更できません"
        );
      }
      if (condition !== FeedbackCondition.STANDARD && !user.hexadResponse) {
        throw new AppError(
          409,
          "HEXAD_RESPONSE_REQUIRED",
          "この設定には特性アンケートへの回答が必要です"
        );
      }
      await tx.experimentAssignment.upsert({
        where: {
          userId_experimentKey: {
            userId,
            experimentKey: HEXAD_FEEDBACK_EXPERIMENT_KEY,
          },
        },
        update: { condition, top1Type: null, assignedAt: new Date() },
        create: {
          userId,
          experimentKey: HEXAD_FEEDBACK_EXPERIMENT_KEY,
          condition,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
  return slot;
};
