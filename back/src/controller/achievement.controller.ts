import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  getAchievementsByUser,
  updateTargetAchievementByUserId,
} from "../service/achievement.service";

const getAuthUser = (req: Request) => {
  const user = req.authUser;

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return user;
};

export const getAchievementsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getAchievementsByUser(getAuthUser(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const updateTargetAchievementController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawAchievementId = req.body?.achievementId;
    const achievementId =
      rawAchievementId === null
        ? null
        : typeof rawAchievementId === "string" && rawAchievementId.trim()
          ? rawAchievementId.trim()
          : null;
    const data = await updateTargetAchievementByUserId(
      getAuthUser(req).id,
      achievementId
    );

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
