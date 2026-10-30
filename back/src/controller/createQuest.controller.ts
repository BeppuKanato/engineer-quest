import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  getCreateQuestAttemptsByFirebaseUid,
  getCreateQuestByFirebaseUid,
  getCreateQuestFeedbackByFirebaseUid,
  getCreateQuestsByFirebaseUid,
  recordCreateQuestHintViewByFirebaseUid,
  saveCreateQuestExecutionByFirebaseUid,
  startCreateQuestAttemptByFirebaseUid,
  startCreateQuestFeedbackByFirebaseUid,
  submitCreateQuestByFirebaseUid,
  updateCreateQuestAttemptByFirebaseUid,
} from "../service/createQuest.service";

const uid = (req: Request) => {
  if (!req.authUser?.firebaseUid) throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  return req.authUser.firebaseUid;
};
const param = (req: Request, key: string) => {
  const value = req.params[key];
  if (!value) throw new AppError(400, "BAD_REQUEST", `${key} is required`);
  return value;
};
const code = (req: Request) =>
  typeof req.body?.code === "string" ? req.body.code : "";
const requirementResults = (req: Request) =>
  Array.isArray(req.body?.requirementResults) ? req.body.requirementResults : [];

export const listCreateQuests = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await getCreateQuestsByFirebaseUid(uid(req))); } catch (error) { next(error); }
};
export const getCreateQuest = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await getCreateQuestByFirebaseUid({ firebaseUid: uid(req), questId: param(req, "questId") })); } catch (error) { next(error); }
};
export const startCreateQuestAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json(await startCreateQuestAttemptByFirebaseUid({ firebaseUid: uid(req), questId: param(req, "questId") })); } catch (error) { next(error); }
};
export const saveCreateQuestAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await updateCreateQuestAttemptByFirebaseUid({
      firebaseUid: uid(req), attemptId: param(req, "attemptId"), code: code(req),
      selectedRequirementIds: Array.isArray(req.body?.selectedRequirementIds) ? req.body.selectedRequirementIds.filter((value: unknown): value is string => typeof value === "string") : [],
    }));
  } catch (error) { next(error); }
};
export const saveCreateQuestExecution = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await saveCreateQuestExecutionByFirebaseUid({
      firebaseUid: uid(req), attemptId: param(req, "attemptId"), code: code(req),
      requirementResults: requirementResults(req),
      runtimeError: typeof req.body?.runtimeError === "string" ? req.body.runtimeError : null,
    }));
  } catch (error) { next(error); }
};
export const viewCreateQuestHint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await recordCreateQuestHintViewByFirebaseUid({
      firebaseUid: uid(req), attemptId: param(req, "attemptId"),
      requirementId: param(req, "requirementId"), hintId: param(req, "hintId"),
    }));
  } catch (error) { next(error); }
};
export const submitCreateQuest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await submitCreateQuestByFirebaseUid({
      firebaseUid: uid(req), attemptId: param(req, "attemptId"), code: code(req),
      requirementResults: requirementResults(req),
    }));
  } catch (error) { next(error); }
};
export const startCreateQuestFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(202).json(await startCreateQuestFeedbackByFirebaseUid({ firebaseUid: uid(req), submissionId: param(req, "submissionId") })); } catch (error) { next(error); }
};
export const getCreateQuestFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await getCreateQuestFeedbackByFirebaseUid({ firebaseUid: uid(req), submissionId: param(req, "submissionId") })); } catch (error) { next(error); }
};
export const listCreateQuestAttempts = async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await getCreateQuestAttemptsByFirebaseUid(uid(req))); } catch (error) { next(error); }
};
