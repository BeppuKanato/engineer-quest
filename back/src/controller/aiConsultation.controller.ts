import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import { createAiConsultation, listAiConsultations } from "../service/aiConsultation.service";

const getAuthUser = (req: Request) => {
  const user = req.authUser;
  if (!user) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return user;
};

export const createAiConsultationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuthUser(req);
    const body = (req.body ?? {}) as {
      courseId?: unknown;
      phaseKey?: unknown;
      message?: unknown;
      context?: { code?: unknown; testSummary?: unknown } | null;
    };
    const result = await createAiConsultation(user.id, body);
    res.status(201).json(result);
  } catch (error) { next(error); }
};

export const listAiConsultationsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuthUser(req);
    res.status(200).json(await listAiConsultations(user.id, req.query.courseId));
  } catch (error) { next(error); }
};
