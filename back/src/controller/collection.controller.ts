import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import { getCollectionByFirebaseUid } from "../service/collection.service";

const getFirebaseUid = (req: Request) => {
  const firebaseUid = req.authUser?.firebaseUid;

  if (!firebaseUid) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return firebaseUid;
};

export const getCollectionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getCollectionByFirebaseUid(getFirebaseUid(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
