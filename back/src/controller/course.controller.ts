/** Course一覧APIのHTTP境界。永続化と解除判定はCourse serviceへ委譲する。 */
import { NextFunction, Request, Response } from "express";
import { getCoursesByUserId } from "../service/course.service";
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
