// src/middleware/authMiddleware.ts

import { NextFunction, Request, Response } from "express";
import admin from "../firebase";
import { prisma } from "../lib/prisma";
import { ensureUserService } from "../service/auth.service";

const extractBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.split(" ")[1];

  return token || null;
};

const setAuthUserByFirebaseUid = async (
  req: Request,
  firebaseUid: string
): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: {
      firebaseUid,
    },
    select: {
      id: true,
      firebaseUid: true,
      displayName: true,
      experience: true,
      knowledgeCardTableNumber: true,
      selectedProfileAchievementId: true,
      selectedMascotId: true,
      selectedTargetAchievementId: true,
      hexadResponse: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    return false;
  }

  req.authUser = {
    id: user.id,
    firebaseUid: user.firebaseUid,
    displayName: user.displayName,
    experience: user.experience,
    knowledgeCardTableNumber: user.knowledgeCardTableNumber,
    selectedProfileAchievementId: user.selectedProfileAchievementId,
    selectedMascotId: user.selectedMascotId,
    selectedTargetAchievementId: user.selectedTargetAchievementId,
    hasHexadResponse: user.hexadResponse !== null,
  };

  return true;
};

export const verifyFirebaseTokenOnly = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      error: "No token provided",
    });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    req.firebaseUser = decoded;

    return next();
  } catch (error) {
    console.error("Firebase token verification failed:", error);

    return res.status(401).json({
      error: "Invalid token",
    });
  }
};

export const verifyFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const devFirebaseUid = req.headers["x-dev-firebase-uid"];

  if (
    process.env.ENABLE_DEV_AUTH === "true" &&
    typeof devFirebaseUid === "string"
  ) {
    const foundUser = await setAuthUserByFirebaseUid(req, devFirebaseUid);

    if (!foundUser) {
      return res.status(401).json({
        error: "Dev user not found",
      });
    }

    return next();
  }

  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      error: "No token provided",
    });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    req.firebaseUser = decoded;

    let foundUser = await setAuthUserByFirebaseUid(req, decoded.uid);

    if (!foundUser) {
      // Provisioning is otherwise only done by POST /api/auth/ensure, which
      // the front end calls only when the login / signup form is submitted.
      // A Firebase user whose DB row was never created (e.g. signup was
      // interrupted after the Firebase account was created) or was deleted
      // can therefore never recover through the restored-session flow
      // (GET /api/auth/me and every other authenticated route returned 401).
      // Create the row here, on the first authenticated API access, using
      // the same upsert as /ensure.
      await ensureUserService({
        firebaseUid: decoded.uid,
        displayName: decoded.name ?? null,
      });

      foundUser = await setAuthUserByFirebaseUid(req, decoded.uid);
    }

    if (!foundUser) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    return next();
  } catch (error) {
    console.error("Firebase token verification failed:", error);

    return res.status(401).json({
      error: "Invalid token",
    });
  }
};
