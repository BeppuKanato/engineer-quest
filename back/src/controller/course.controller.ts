/** Course一覧APIのHTTP境界。永続化と解除判定はCourse serviceへ委譲する。 */
import { NextFunction, Request, Response } from "express";
import { getCoursesByUserId, getRelatedCreateQuestsByCourseId } from "../service/course.service";
import { AppError } from "../error/appError";

const getUserId = (req: Request): string => {
  const userId = req.authUser?.id;
  if (!userId) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return userId;
};

export const getRelatedCreateQuestsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    getUserId(req);
    const courseId = req.params.courseId;
    if (!courseId?.trim()) throw new AppError(400, "BAD_REQUEST", "courseId is required");
    res.json(await getRelatedCreateQuestsByCourseId(courseId));
  } catch (error) { next(error); }
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
