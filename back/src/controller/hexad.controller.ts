import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  createHexadResponse,
  getHexadResponse,
} from "../service/hexad.service";

const getUserId = (req: Request) => {
  const userId = req.authUser?.id;
  if (!userId) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }
  return userId;
};

export const getHexadResponseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json(await getHexadResponse(getUserId(req)));
  } catch (error) {
    next(error);
  }
};

export const createHexadResponseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createHexadResponse(getUserId(req), {
      questionnaireVersion: req.body?.questionnaireVersion,
      answers: req.body?.answers,
    });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};
