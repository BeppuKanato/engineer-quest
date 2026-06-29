import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import { getProfileByFirebaseUid } from "../service/profile.service";

const getFirebaseUid = (req: Request) => {
  const firebaseUid = req.authUser?.firebaseUid;

  if (!firebaseUid) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return firebaseUid;
};

export const getProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getProfileByFirebaseUid(getFirebaseUid(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
