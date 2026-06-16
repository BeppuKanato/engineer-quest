import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/appError";
import {
  getLessonPlayById,
  completeLessonById,
  getLessonCompleteById,
} from "../service/lesson.service";

type AuthenticatedRequest = Request & {
  authUser?: {
    firebaseUid: string;
  };
};

const getFirebaseUid = (req: AuthenticatedRequest) => {
  return req.authUser?.firebaseUid;
};

export const getLessonPlayController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const firebaseUid = getFirebaseUid(req);

    if (!firebaseUid) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    const { lessonId } = req.params;

    if (!lessonId) {
      throw new AppError(400, "BAD_REQUEST", "lessonId is required");
    }

    const lesson = await getLessonPlayById(firebaseUid, lessonId);

    res.status(200).json(lesson);
  } catch (error) {
    next(error);
  }
};

export const completeLessonController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const firebaseUid = getFirebaseUid(req);

    if (!firebaseUid) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    const { lessonId } = req.params;

    if (!lessonId) {
      throw new AppError(400, "BAD_REQUEST", "lessonId is required");
    }

    const result = await completeLessonById(firebaseUid, lessonId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getLessonCompleteController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const firebaseUid = getFirebaseUid(req);

    console.log("ユーザのFirebase UID:", firebaseUid);

    if (!firebaseUid) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }
    
    const { lessonId } = req.params;

    if (!lessonId) {
      throw new AppError(400, "BAD_REQUEST", "lessonId is required");
    }

    const completeData = await getLessonCompleteById(firebaseUid, lessonId);

    res.status(200).json(completeData);
  } catch (error) {
    next(error);
  }
};