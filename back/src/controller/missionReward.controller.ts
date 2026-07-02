import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  getMissionRewardRunByFirebaseUid,
  selectMissionRewardKnowledgeCardByFirebaseUid,
} from "../service/missionReward.service";

const getFirebaseUid = (req: Request) => {
  const firebaseUid = req.authUser?.firebaseUid;

  if (!firebaseUid) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return firebaseUid;
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
    const data = await getMissionRewardRunByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      rewardRunId: getRewardRunId(req),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const selectMissionRewardKnowledgeCardController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const knowledgeCardId =
      typeof req.body?.knowledgeCardId === "string"
        ? req.body.knowledgeCardId
        : null;

    if (!knowledgeCardId) {
      throw new AppError(400, "BAD_REQUEST", "Knowledge card ID is required");
    }

    const data = await selectMissionRewardKnowledgeCardByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      rewardRunId: getRewardRunId(req),
      knowledgeCardId,
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
