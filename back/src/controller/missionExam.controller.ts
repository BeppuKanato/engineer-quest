// src/controller/missionExam.controller.ts

import { Request, Response, NextFunction } from "express";
import { AppError } from "../error/appError";
import {
  getMissionExamIntroService,
  startMissionExamService,
  getMissionExamPlayService,
  submitMissionExamService,
  getMissionExamResultService,
} from "../service/missionExam.service";

export const getMissionExamIntroController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { missionId } = req.params;

    if (!missionId) {
      throw new AppError(400, "BAD_REQUEST", "Mission ID is required");
    }

    const firebaseUid = req.authUser?.firebaseUid;

    if (!firebaseUid) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    const examIntro = await getMissionExamIntroService({
      missionId,
      firebaseUid,
    });

    res.status(200).json(examIntro);
  } catch (error) {
    next(error);
  }
};

export const startMissionExamController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { missionId } = req.params;

    if (!missionId) {
      throw new AppError(400, "BAD_REQUEST", "Mission ID is required");
    }

    const { difficulty } = req.body;

    if (!difficulty || typeof difficulty !== "string") {
      throw new AppError(400, "BAD_REQUEST", "Difficulty is required");
    }

    const firebaseUid = req.authUser?.firebaseUid;

    if (!firebaseUid) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    const result = await startMissionExamService({
      missionId,
      firebaseUid,
      difficulty,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMissionExamPlayController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { missionId } = req.params;

    if (!missionId) {
      throw new AppError(400, "BAD_REQUEST", "Mission ID is required");
    }

    const difficulty = req.query.difficulty;

    if (!difficulty || typeof difficulty !== "string") {
      throw new AppError(400, "BAD_REQUEST", "Difficulty is required");
    }

    const firebaseUid = req.authUser?.firebaseUid;

    if (!firebaseUid) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    const result = await getMissionExamPlayService({
      missionId,
      firebaseUid,
      difficulty,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const submitMissionExamController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { missionId } = req.params;

    if (!missionId) {
      throw new AppError(400, "BAD_REQUEST", "Mission ID is required");
    }

    const { difficulty, submittedCode } = req.body;

    if (!difficulty || typeof difficulty !== "string") {
      throw new AppError(400, "BAD_REQUEST", "Difficulty is required");
    }

    if (typeof submittedCode !== "string") {
      throw new AppError(400, "BAD_REQUEST", "Submitted code is required");
    }

    const firebaseUid = req.authUser?.firebaseUid;

    if (!firebaseUid) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    const result = await submitMissionExamService({
      missionId,
      firebaseUid,
      difficulty,
      submittedCode,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMissionExamResultController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { missionId } = req.params;

    if (!missionId) {
      throw new AppError(400, "BAD_REQUEST", "Mission ID is required");
    }

    const difficulty = req.query.difficulty;

    if (!difficulty || typeof difficulty !== "string") {
      throw new AppError(400, "BAD_REQUEST", "Difficulty is required");
    }

    const firebaseUid = req.authUser?.firebaseUid;

    if (!firebaseUid) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    const result = await getMissionExamResultService({
      missionId,
      firebaseUid,
      difficulty,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
