// src/router/authRouter.ts

import { Router } from "express";
import {
  getMeController,
  ensureUserController,
} from "../controller/authController";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/ensure", verifyFirebaseToken, ensureUserController);
router.get("/me", verifyFirebaseToken, getMeController);

export default router;