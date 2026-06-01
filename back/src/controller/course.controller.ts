import { NextFunction, Request, Response } from "express";
import { getCoursesByFirebaseUid } from "../service/course.service";
import { AppError } from "../error/appError";

type AuthenticatedRequest = Request & {
  firebaseUser?: {
    uid: string;
  };
};

export const getCoursesController = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
  try {
    const firebaseUid = req.firebaseUser?.uid;
    if (!firebaseUid) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    const courses = await getCoursesByFirebaseUid(firebaseUid);

    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};