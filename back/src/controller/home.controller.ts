import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import { getHomeByUser } from "../service/home.service";

const getAuthUser = (req: Request) => {
  const user = req.authUser;

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return user;
};

export const getHomeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getHomeByUser(getAuthUser(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
