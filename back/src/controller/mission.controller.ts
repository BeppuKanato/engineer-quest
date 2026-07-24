import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  answerMissionActivityService,
  completeMissionActivityService,
  completeMissionService,
  getMissionOverviewService,
  getMissionPlayService,
} from "../service/mission.service";

const getFirebaseUid = (req: Request) => {
  const firebaseUid = req.authUser?.firebaseUid;

  if (!firebaseUid) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return firebaseUid;
};

const getMissionId = (req: Request) => {
  const { missionId } = req.params;

  if (!missionId) {
    throw new AppError(400, "BAD_REQUEST", "Mission ID is required");
  }

  return missionId;
};

const getActivityId = (req: Request) => {
  const { activityId } = req.params;

  if (!activityId) {
    throw new AppError(400, "BAD_REQUEST", "Activity ID is required");
  }

  return activityId;
};

const getDifficulty = (req: Request) => {
  const difficulty = req.query.difficulty;
  if (
    difficulty === "easy" ||
    difficulty === "normal" ||
    difficulty === "hard"
  ) {
    return difficulty;
  }

  return undefined;
};

export const getMissionPlayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getMissionPlayService({
      missionId: getMissionId(req),
      firebaseUid: getFirebaseUid(req),
      difficulty: getDifficulty(req),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getMissionOverviewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getMissionOverviewService({
      missionId: getMissionId(req),
      firebaseUid: getFirebaseUid(req),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const answerMissionActivityController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await answerMissionActivityService({
      missionId: getMissionId(req),
      activityId: getActivityId(req),
      firebaseUid: getFirebaseUid(req),
      answer: req.body?.answer,
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const completeMissionActivityController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await completeMissionActivityService({
      missionId: getMissionId(req),
      activityId: getActivityId(req),
      firebaseUid: getFirebaseUid(req),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const completeMissionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await completeMissionService({
      missionId: getMissionId(req),
      firebaseUid: getFirebaseUid(req),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
