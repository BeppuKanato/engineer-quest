import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  answerMissionActivityService,
  completeMissionActivityService,
  completeMissionService,
  getMissionOverviewService,
  getMissionPlayService,
} from "../service/mission.service";
import {
  getCurrentCourseExamAttempt,
  listCourseExamAttempts,
  recordCourseExamHintView,
  recordCourseExamTestExecution,
  startOrResumeCourseExamAttempt,
} from "../service/courseExamAttempt.service";

const getFirebaseUid = (req: Request) => {
  const firebaseUid = req.authUser?.firebaseUid;

  if (!firebaseUid) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return firebaseUid;
};

const getUserId = (req: Request) => {
  const userId = req.authUser?.id;
  if (!userId) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return userId;
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

export const getCourseExamAttemptController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json(
      await getCurrentCourseExamAttempt(getUserId(req), getMissionId(req))
    );
  } catch (error) {
    next(error);
  }
};

export const listCourseExamAttemptsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json(
      await listCourseExamAttempts(getUserId(req), getMissionId(req))
    );
  } catch (error) {
    next(error);
  }
};

export const startCourseExamAttemptController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(201).json(
      await startOrResumeCourseExamAttempt(getUserId(req), getMissionId(req))
    );
  } catch (error) {
    next(error);
  }
};

export const recordCourseExamHintViewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attemptId, hintId } = req.params;
    if (!attemptId || !hintId) {
      throw new AppError(400, "BAD_REQUEST", "Attempt ID and hint ID are required");
    }
    res.status(200).json(
      await recordCourseExamHintView({
        userId: getUserId(req),
        missionId: getMissionId(req),
        attemptId,
        hintId,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const recordCourseExamTestExecutionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attemptId } = req.params;
    if (!attemptId) {
      throw new AppError(400, "BAD_REQUEST", "Attempt ID is required");
    }
    res.status(201).json(
      await recordCourseExamTestExecution({
        userId: getUserId(req),
        missionId: getMissionId(req),
        attemptId,
        code: req.body?.code,
        testResults: req.body?.testResults,
        runtimeError: req.body?.runtimeError ?? null,
      })
    );
  } catch (error) {
    next(error);
  }
};
