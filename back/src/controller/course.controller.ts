import { NextFunction, Request, Response } from "express";
import {
  getCourseRoadmapByFirebaseUid,
  getCoursesByFirebaseUid,
} from "../service/course.service";
import { AppError } from "../error/appError";

type AuthenticatedRequest = Request & {
  firebaseUser?: {
    uid: string;
  };
  authUser?: {
    firebaseUid: string;
  };
};

const getFirebaseUid = (req: AuthenticatedRequest): string | undefined => {
  return req.authUser?.firebaseUid ?? req.firebaseUser?.uid;
};

export const getCoursesController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const firebaseUid = getFirebaseUid(req);

    if (!firebaseUid) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    const courses = await getCoursesByFirebaseUid(firebaseUid);

    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};

export const getCourseRoadmapController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const firebaseUid = getFirebaseUid(req);
    const courseId = req.params.courseId;

    if (!firebaseUid) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    if (!courseId) {
      throw new AppError(400, "BAD_REQUEST", "Course ID is required");
    }

    const course = await getCourseRoadmapByFirebaseUid(firebaseUid, courseId);

    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};
