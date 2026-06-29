import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  drawTechIconBadgeByFirebaseUid,
  getBadgeCollectionByFirebaseUid,
  setSelectedTechIconBadgeByFirebaseUid,
} from "../service/badge.service";

const getFirebaseUid = (req: Request) => {
  const firebaseUid = req.authUser?.firebaseUid;

  if (!firebaseUid) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return firebaseUid;
};

export const getBadgeCollectionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getBadgeCollectionByFirebaseUid(getFirebaseUid(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const drawTechIconBadgeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await drawTechIconBadgeByFirebaseUid(getFirebaseUid(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const setSelectedTechIconBadgeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const badgeId = typeof req.body?.badgeId === "string" ? req.body.badgeId : null;

    if (!badgeId) {
      throw new AppError(400, "BAD_REQUEST", "Badge ID is required");
    }

    const data = await setSelectedTechIconBadgeByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      badgeId,
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
