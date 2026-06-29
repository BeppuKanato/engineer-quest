import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import { getHistoryByFirebaseUid } from "../service/history.service";

const getFirebaseUid = (req: Request) => {
  const firebaseUid = req.authUser?.firebaseUid;

  if (!firebaseUid) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return firebaseUid;
};

export const getHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getHistoryByFirebaseUid(getFirebaseUid(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
