/** 大目標の提案・確定APIのHTTP境界（Issue #366）。検証はここで行い、処理は big goal service へ委譲する。 */
import { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../error/appError";
import {
  confirmBigGoalProposal,
  getBigGoalProposal,
  getCurrentBigGoal,
  listBigGoalHistory,
  requestBigGoalProposal,
} from "../service/bigGoalProposal.service";

const getAuthUser = (req: Request) => {
  const user = req.authUser;
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }
  return user;
};

const getProposalId = (req: Request): string => {
  const id = req.params.id;
  if (!id) {
    throw new AppError(400, "BAD_REQUEST", "Proposal ID is required");
  }
  return id;
};

const createProposalSchema = z.object({
  timing: z.enum(["UNIT_START", "ON_ACHIEVEMENT"]),
  startCourseId: z.string().min(1).optional(),
  achievedGoalId: z.string().min(1).optional(),
});

const confirmProposalSchema = z.object({
  candidateKey: z.string().min(1),
});

export const createBigGoalProposalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getAuthUser(req);
    const input = createProposalSchema.parse(req.body);
    if (input.timing === "UNIT_START" && !input.startCourseId) {
      throw new AppError(400, "BAD_REQUEST", "startCourseId is required for UNIT_START");
    }
    if (input.timing === "ON_ACHIEVEMENT" && !input.achievedGoalId) {
      throw new AppError(400, "BAD_REQUEST", "achievedGoalId is required for ON_ACHIEVEMENT");
    }
    const proposal = await requestBigGoalProposal(user, input);
    res.status(200).json(proposal);
  } catch (error) {
    next(error);
  }
};

export const getBigGoalProposalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getAuthUser(req);
    const proposal = await getBigGoalProposal(user, getProposalId(req));
    res.status(200).json(proposal);
  } catch (error) {
    next(error);
  }
};

export const confirmBigGoalProposalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getAuthUser(req);
    const { candidateKey } = confirmProposalSchema.parse(req.body);
    const result = await confirmBigGoalProposal(user, getProposalId(req), candidateKey);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getCurrentBigGoalController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getAuthUser(req);
    res.status(200).json(await getCurrentBigGoal(user));
  } catch (error) {
    next(error);
  }
};

export const listBigGoalHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = getAuthUser(req);
    res.status(200).json(await listBigGoalHistory(user));
  } catch (error) {
    next(error);
  }
};
