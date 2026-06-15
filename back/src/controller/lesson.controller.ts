import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/appError";
import { getLessonPlayById, completeLessonById } from "../service/lesson.service";

type AuthenticatedRequest = Request & {
  firebaseUser?: {
    uid: string;
  };
};

export const getLessonPlayController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(req.authUser?.firebaseUid);
    const firebaseUid = req.authUser?.firebaseUid;
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
    const firebaseUid = req.firebaseUser?.uid;

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