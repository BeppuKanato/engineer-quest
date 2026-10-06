import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  getMissionRewardRunByUserId,
} from "../service/missionReward.service";

const getUserId = (req: Request) => {
  const userId = req.authUser?.id;

  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return userId;
};
const getRewardRunId = (req: Request) => {
  const { rewardRunId } = req.params;

  if (!rewardRunId) {
    throw new AppError(400, "BAD_REQUEST", "Reward run ID is required");
  }

  return rewardRunId;
};

export const getMissionRewardRunController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getMissionRewardRunByUserId({
      userId: getUserId(req),
      rewardRunId: getRewardRunId(req),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
