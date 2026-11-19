import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../error/appError";
import { answerTodayReviewByUser, getTodayReviewByUser } from "../service/dailyReview.service";

const authUser = (req: Request) => {
  if (!req.authUser) throw new AppError(401, "UNAUTHORIZED", "ログインが必要です。");
  return req.authUser;
};
const answerSchema = z.object({ reviewId: z.string().trim().min(1).max(160), correct: z.boolean() }).strict();

export const getTodayReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(200).json(await getTodayReviewByUser(authUser(req))); }
  catch (error) { next(error); }
};
export const answerTodayReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = authUser(req);
    const body = answerSchema.safeParse(req.body);
    if (!body.success) throw new AppError(400, "INVALID_REVIEW_ANSWER", "復習IDと正誤を指定してください。");
    res.status(200).json(await answerTodayReviewByUser(user, body.data.reviewId, body.data.correct));
  } catch (error) { next(error); }
};
