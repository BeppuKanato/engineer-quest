import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import { getHistoryByUserId } from "../service/history.service";

const getUserId = (req: Request) => {
  const userId = req.authUser?.id;

  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return userId;
};

export const getHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getHistoryByUserId(getUserId(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
