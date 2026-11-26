import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  getFeedbackAssignmentSlot,
  isAssignmentSlot,
  setFeedbackAssignmentSlot,
} from "../service/experimentAssignment.service";
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

export const getFeedbackAssignmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slot = await getFeedbackAssignmentSlot(getUserId(req));
    res.status(200).json({ slot });
  } catch (error) {
    next(error);
  }
};

export const updateFeedbackAssignmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const slot = req.body?.slot;
    if (!isAssignmentSlot(slot)) {
      throw new AppError(400, "INVALID_SLOT", "slot must be 1, 2 or 3");
    }
    const updated = await setFeedbackAssignmentSlot(getUserId(req), slot);
    res.status(200).json({ slot: updated });
  } catch (error) {
    next(error);
  }
};
