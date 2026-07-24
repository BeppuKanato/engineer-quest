import { Router } from "express";

import {
  getAchievementsController,
  updateTargetAchievementController,
} from "../controller/achievement.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getAchievementsController);
router.patch("/target", verifyFirebaseToken, updateTargetAchievementController);

export default router;
