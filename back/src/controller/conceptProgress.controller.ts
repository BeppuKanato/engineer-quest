import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/appError";
import { getConceptProgressByUser } from "../service/conceptProgress.service";
export const getConceptProgressController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.authUser) throw new AppError(401, "UNAUTHORIZED", "ログインが必要です。");
    if (typeof req.params.courseId !== "string" || !req.params.courseId) throw new AppError(400, "BAD_REQUEST", "単元IDを指定してください。");
    res.status(200).json(await getConceptProgressByUser(req.authUser, req.params.courseId));
  } catch (error) { next(error); }
};
