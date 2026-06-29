import { NextFunction, Request, Response } from "express";

import { AppError } from "../error/appError";
import {
  deleteUserWorkByFirebaseUid,
  getCreateMissionByFirebaseUid,
  getCreateMissionsByFirebaseUid,
  getUserWorkByFirebaseUid,
  getUserWorksByFirebaseUid,
  normalizeTechnologies,
  reviewUserWorkByFirebaseUid,
  saveUserWorkByFirebaseUid,
  updateUserWorkByFirebaseUid,
} from "../service/createMission.service";

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

const getWorkPayload = (req: Request) => ({
  title: typeof req.body?.title === "string" ? req.body.title.trim() : "",
  description:
    typeof req.body?.description === "string" ? req.body.description.trim() : "",
  focusPoint:
    typeof req.body?.focusPoint === "string" ? req.body.focusPoint.trim() : "",
  technologies: normalizeTechnologies(req.body?.technologies),
  code: typeof req.body?.code === "string" ? req.body.code.trim() : "",
  isFavorite: req.body?.isFavorite === true,
});

export const getCreateMissionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getCreateMissionsByFirebaseUid(getFirebaseUid(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getCreateMissionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getCreateMissionByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      createMissionId: getParam(req, "createMissionId"),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const saveUserWorkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await saveUserWorkByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      createMissionId: getParam(req, "createMissionId"),
      ...getWorkPayload(req),
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const getUserWorksController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getUserWorksByFirebaseUid(getFirebaseUid(req));

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getUserWorkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getUserWorkByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      workId: getParam(req, "workId"),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const updateUserWorkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await updateUserWorkByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      workId: getParam(req, "workId"),
      ...getWorkPayload(req),
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const deleteUserWorkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await deleteUserWorkByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      workId: getParam(req, "workId"),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const reviewUserWorkController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await reviewUserWorkByFirebaseUid({
      firebaseUid: getFirebaseUid(req),
      workId: getParam(req, "workId"),
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};
