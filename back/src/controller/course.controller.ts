import { NextFunction, Request, Response } from "express";
import {
  getCourseRoadmapByUserId,
  getCoursesByUserId,
} from "../service/course.service";
import { AppError } from "../error/appError";

const getUserId = (req: Request): string => {
  const userId = req.authUser?.id;
  if (!userId) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return userId;
};

export const getCoursesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const courses = await getCoursesByUserId(getUserId(req));

    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};

export const getCourseRoadmapController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const courseId = req.params.courseId;

    if (!courseId) {
      throw new AppError(400, "BAD_REQUEST", "Course ID is required");
    }

    const course = await getCourseRoadmapByUserId(getUserId(req), courseId);

    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};
