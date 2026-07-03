import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  createUserCreateWorkByFirebaseUid,
  deleteUserCreateWorkByFirebaseUid,
  getCreateThemeByFirebaseUid,
  getCreateThemesByFirebaseUid,
  getSharedCreateWorks,
  getUserCreateWorkByFirebaseUid,
  getUserCreateWorksByFirebaseUid,
  parseWorkPayload,
  shareUserCreateWorkByFirebaseUid,
  unshareUserCreateWorkByFirebaseUid,
  updateUserCreateWorkByFirebaseUid,
} from "../service/createTheme.service";

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

export const getCreateThemesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getCreateThemesByFirebaseUid(getFirebaseUid(req));
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getCreateThemeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getCreateThemeByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      themeId: getParam(req, "themeId"),
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getMyWorksController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getUserCreateWorksByFirebaseUid(getFirebaseUid(req));
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getMyWorkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getUserCreateWorkByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      workId: getParam(req, "workId"),
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const createMyWorkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createUserCreateWorkByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      themeId: getParam(req, "themeId"),
      payload: parseWorkPayload(req.body),
    });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const updateMyWorkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await updateUserCreateWorkByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      workId: getParam(req, "workId"),
      payload: parseWorkPayload(req.body),
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const deleteMyWorkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await deleteUserCreateWorkByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      workId: getParam(req, "workId"),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const shareMyWorkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await shareUserCreateWorkByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      workId: getParam(req, "workId"),
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const unshareMyWorkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await unshareUserCreateWorkByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      workId: getParam(req, "workId"),
    });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getSharedWorksController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getSharedCreateWorks();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
