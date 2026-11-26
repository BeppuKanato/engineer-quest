import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import { getDevelopmentMissionBests, recordDevelopmentMissionAttempt } from "../service/developmentMission.service";

const getAuthUser = (req: Request) => {
  const user = req.authUser;
  if (!user) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return user;
};

export const getDevelopmentMissionBestsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await getDevelopmentMissionBests(getAuthUser(req).id));
  } catch (error) { next(error); }
};

export const recordDevelopmentMissionAttemptController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuthUser(req);
    const missionId = req.params.missionId;
    if (typeof missionId !== "string" || !missionId.trim()) throw new AppError(400, "INVALID_MISSION", "ミッションを指定してください。");
    res.status(201).json(await recordDevelopmentMissionAttempt(user.id, missionId, req.body ?? {}));
  } catch (error) { next(error); }
};
