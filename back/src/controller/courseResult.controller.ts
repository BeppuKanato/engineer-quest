import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  getCourseResultByFirebaseUid,
  getCourseResultFeedbackByFirebaseUid,
  recordCourseResultEventByFirebaseUid,
  startCourseResultFeedbackByFirebaseUid,
} from "../service/courseResult.service";

const getFirebaseUid = (req: Request) => {
  const firebaseUid = req.authUser?.firebaseUid;
  if (!firebaseUid) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return firebaseUid;
};

const getRewardRunId = (req: Request) => {
  const rewardRunId = req.params.rewardRunId;
  if (!rewardRunId) {
    throw new AppError(400, "BAD_REQUEST", "Reward run ID is required");
  }
  return rewardRunId;
};

export const getCourseResultController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json(
      await getCourseResultByFirebaseUid({
        firebaseUid: getFirebaseUid(req),
        rewardRunId: getRewardRunId(req),
      })
    );
  } catch (error) {
    next(error);
  }
};

export const startCourseResultFeedbackController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(202).json(
      await startCourseResultFeedbackByFirebaseUid({
        firebaseUid: getFirebaseUid(req),
        rewardRunId: getRewardRunId(req),
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getCourseResultFeedbackController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json(
      await getCourseResultFeedbackByFirebaseUid({
        firebaseUid: getFirebaseUid(req),
        rewardRunId: getRewardRunId(req),
      })
    );
  } catch (error) {
    next(error);
  }
};

export const recordCourseResultEventController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = typeof req.body?.eventId === "string" ? req.body.eventId : null;
    const eventType = typeof req.body?.eventType === "string" ? req.body.eventType : null;
    const occurredAt = typeof req.body?.occurredAt === "string" ? req.body.occurredAt : null;
    if (!eventId || !eventType || !occurredAt) {
      throw new AppError(400, "BAD_REQUEST", "Event ID, type and occurredAt are required");
    }
    res.status(202).json(
      await recordCourseResultEventByFirebaseUid({
        firebaseUid: getFirebaseUid(req),
        rewardRunId: getRewardRunId(req),
        eventId,
        eventType,
        occurredAt,
        ...(typeof req.body?.durationMs === "number"
          ? { durationMs: req.body.durationMs }
          : {}),
      })
    );
  } catch (error) {
    next(error);
  }
};
