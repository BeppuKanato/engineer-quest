import { NextFunction, Request, Response } from "express";
import { getCoursesByFirebaseUid, getCoursesByUserId } from "../service/course.service";
import { AppError } from "../error/appError";

type AuthenticatedRequest = Request & {
  user?: {
    uid?: string;
    firebaseUid?: string;
  };
};

export const getCoursesController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const firebaseUid = req.user?.firebaseUid ?? req.user?.uid;
    console.log(firebaseUid)
    if (!firebaseUid) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    const courses = await getCoursesByFirebaseUid(firebaseUid);

    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};

export const getCoursesDevController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    console.log(userId)

    const courses = await getCoursesByUserId(userId);

    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};