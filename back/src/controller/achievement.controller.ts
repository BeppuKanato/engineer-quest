import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  getAchievementsByFirebaseUid,
  updateTargetAchievementByFirebaseUid,
} from "../service/achievement.service";

const getFirebaseUid = (req: Request) => {
  const firebaseUid = req.authUser?.firebaseUid;

  if (!firebaseUid) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return firebaseUid;
};

export const getAchievementsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getAchievementsByFirebaseUid(getFirebaseUid(req));

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
    const data = await updateTargetAchievementByFirebaseUid(
      getFirebaseUid(req),
      achievementId
    );

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
