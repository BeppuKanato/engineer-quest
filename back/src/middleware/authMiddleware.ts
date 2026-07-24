// src/middleware/authMiddleware.ts

import { NextFunction, Request, Response } from "express";
import admin from "../firebase";
import { prisma } from "../lib/prisma";

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
      badgeTickets: true,
      selectedTechIconBadgeId: true,
      selectedMascotId: true,
      selectedTargetAchievementId: true,
    },
  });

  if (!user) {
    return false;
  }

  req.authUser = user;

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

    const foundUser = await setAuthUserByFirebaseUid(req, decoded.uid);

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