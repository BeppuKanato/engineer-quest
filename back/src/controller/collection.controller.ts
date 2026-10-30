import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import { getCollectionByUser } from "../service/collection.service";

const getAuthUser = (req: Request) => {
  const user = req.authUser;

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return user;
};

export const getCollectionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getCollectionByUser(getAuthUser(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
