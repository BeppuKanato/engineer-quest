// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import admin from "../firebase";

// 拡張Request型にuserを追加
export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  //Authorization ヘッダーから取得
  const header = req.headers.authorization || "";
  let token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

  //sendBeacon 用 → body から token を取得
  if (!token && req.body?.token) {
    token = req.body.token;
  }

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: "Invalid token" });
  }
};
