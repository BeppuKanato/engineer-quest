import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  getProfileByUser,
  updateMascotByUserId,
} from "../service/profile.service";

const getAuthUser = (req: Request) => {
  const user = req.authUser;

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return user;
};

export const getProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getProfileByUser(getAuthUser(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const updateMascotController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const mascotId = typeof req.body?.mascotId === "string" ? req.body.mascotId : "";
    const data = await updateMascotByUserId(getAuthUser(req).id, mascotId);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
