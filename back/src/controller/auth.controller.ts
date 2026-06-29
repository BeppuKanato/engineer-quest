import { Request, Response } from "express";
import {
  ensureUserService,
  getUserByFirebaseUidService,
} from "../service/auth.service";

export const ensureUserController = async (req: Request, res: Response) => {
  if (!req.firebaseUser) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const displayName =
    typeof req.body?.displayName === "string"
      ? req.body.displayName
      : req.firebaseUser.name ?? null;

  const user = await ensureUserService({
    firebaseUid: req.firebaseUser.uid,
    displayName,
  });

  req.authUser = user;

  return res.json({
    user,
  });
};

export const getMeController = async (req: Request, res: Response) => {
  const firebaseUid = req.firebaseUser?.uid ?? req.authUser?.firebaseUid;

  if (!firebaseUid) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const user = await getUserByFirebaseUidService(firebaseUid);

  if (!user) {
    return res.status(404).json({
      error: "User is not registered in app database",
    });
  }

  return res.json({
    user,
  });
};
