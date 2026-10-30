// src/router/authRouter.ts

import { Router } from "express";
import {
  getMeController,
  ensureUserController,
} from "../controller/auth.controller";
import { verifyFirebaseTokenOnly, verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/ensure", verifyFirebaseTokenOnly, ensureUserController);
router.get("/me", verifyFirebaseToken, getMeController);

export default router;