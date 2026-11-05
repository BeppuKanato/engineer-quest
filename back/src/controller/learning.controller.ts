/** 新フロー学習基盤APIのHTTP境界（Issue #108）。検証はここで行い、記録は learning service へ委譲する。 */
import { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../error/appError";
import {
  completePhaseByUser,
  completeUnitByUser,
  getUnitProgressByUser,
  ingestLearningEvents,
  startUnitByUser,
} from "../service/learning.service";

const getAuthUser = (req: Request) => {
  const user = req.authUser;
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }
  return user;
};

const getCourseId = (req: Request): string => {
  const courseId = req.params.courseId;
  if (!courseId) {
    throw new AppError(400, "BAD_REQUEST", "Course ID is required");
  }
  return courseId;
};

const phaseSummarySchema = z.record(z.unknown()).optional();

export const getUnitProgressController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json(await getUnitProgressByUser(getAuthUser(req), getCourseId(req)));
  } catch (error) {
    next(error);
  }
};

export const startUnitController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = z.object({ phaseKey: z.string().min(1).optional() }).parse(req.body ?? {});
    res.status(200).json(await startUnitByUser(getAuthUser(req), getCourseId(req), body.phaseKey));
  } catch (error) {
    next(error);
  }
};

export const completePhaseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const phaseKey = req.params.phaseKey;
    if (!phaseKey) {
      throw new AppError(400, "BAD_REQUEST", "Phase key is required");
    }
    const body = z.object({ summary: phaseSummarySchema }).parse(req.body ?? {});
    res
      .status(200)
      .json(await completePhaseByUser(getAuthUser(req), getCourseId(req), phaseKey, body.summary));
  } catch (error) {
    next(error);
  }
};

export const completeUnitController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json(await completeUnitByUser(getAuthUser(req), getCourseId(req)));
  } catch (error) {
    next(error);
  }
};

const eventBatchSchema = z.object({
  sessionId: z.string().min(1),
  events: z
    .array(
      z.object({
        eventType: z.string().min(1),
        courseId: z.string().min(1).optional(),
        phaseKey: z.string().min(1).optional(),
        targetId: z.string().min(1).optional(),
        payload: z.record(z.unknown()).optional(),
        clientTimestamp: z.string().min(1),
      })
    )
    .max(500),
});

export const ingestLearningEventsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = eventBatchSchema.parse(req.body ?? {});
    const result = await ingestLearningEvents(getAuthUser(req), body.sessionId, body.events);
    // 受け付けたら即返す。呼び出し側は fire-and-forget で使う前提。
    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
};
