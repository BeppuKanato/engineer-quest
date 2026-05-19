// src/middleware/authMiddleware.ts

import { NextFunction, Request, Response } from "express";
import admin from "../firebase";

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

export const verifyFirebaseToken = async (
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

    return res.status(403).json({
      error: "Invalid token",
    });
  }
};