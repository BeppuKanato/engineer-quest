import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  drawTechIconBadgeByUser,
  getBadgeCollectionByUser,
  setSelectedTechIconBadgeByUserId,
} from "../service/badge.service";

const getAuthUser = (req: Request) => {
  const user = req.authUser;

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return user;
};

export const getBadgeCollectionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getBadgeCollectionByUser(getAuthUser(req));

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
    const data = await drawTechIconBadgeByUser(getAuthUser(req));

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

    const data = await setSelectedTechIconBadgeByUserId({
      userId: getAuthUser(req).id,
      badgeId,
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
