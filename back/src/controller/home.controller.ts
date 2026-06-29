import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import { getHomeByFirebaseUid } from "../service/home.service";

const getFirebaseUid = (req: Request) => {
  const firebaseUid = req.authUser?.firebaseUid;

  if (!firebaseUid) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return firebaseUid;
};

export const getHomeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getHomeByFirebaseUid(getFirebaseUid(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
