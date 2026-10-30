import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  addQuestCommentByFirebaseUid,
  buildCreateQuestPostPayload,
  createQuestPostByFirebaseUid,
  getQuestPostByFirebaseUid,
  listQuestPostsByFirebaseUid,
  softDeleteQuestPostByFirebaseUid,
  toggleQuestReactionByFirebaseUid,
  updateQuestPostByFirebaseUid,
  updateQuestPostStatusByFirebaseUid,
} from "../service/questBoard.service";

const getFirebaseUid = (req: Request) => {
  const firebaseUid = req.authUser?.firebaseUid;

  if (!firebaseUid) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  return firebaseUid;
};

const getParam = (req: Request, key: string) => {
  const value = req.params[key];

  if (!value) {
    throw new AppError(400, "BAD_REQUEST", `${key} is required`);
  }

  return value;
};

const getQueryString = (req: Request, key: string) => {
  const value = req.query[key];

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

export const listQuestPostsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await listQuestPostsByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      q: getQueryString(req, "q"),
      category: getQueryString(req, "category"),
      courseId: getQueryString(req, "courseId"),
      missionId: getQueryString(req, "missionId"),
      status: getQueryString(req, "status"),
      mine: getQueryString(req, "mine"),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const createQuestPostController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createQuestPostByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      ...buildCreateQuestPostPayload(req.body),
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const getQuestPostController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getQuestPostByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      postId: getParam(req, "postId"),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const updateQuestPostController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await updateQuestPostByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      postId: getParam(req, "postId"),
      ...buildCreateQuestPostPayload(req.body),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const deleteQuestPostController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await softDeleteQuestPostByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      postId: getParam(req, "postId"),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const addQuestCommentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = typeof req.body?.body === "string" ? req.body.body : "";
    const data = await addQuestCommentByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      postId: getParam(req, "postId"),
      body,
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const toggleQuestReactionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const type = typeof req.body?.type === "string" ? req.body.type : "";
    const data = await toggleQuestReactionByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      postId: getParam(req, "postId"),
      type,
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const updateQuestPostStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status = typeof req.body?.status === "string" ? req.body.status : "";
    const data = await updateQuestPostStatusByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      postId: getParam(req, "postId"),
      status,
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
