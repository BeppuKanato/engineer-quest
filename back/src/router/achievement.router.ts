import { Router } from "express";

import {
  getAchievementsController,
  updateProfileAchievementController,
  updateTargetAchievementController,
} from "../controller/achievement.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getAchievementsController);
router.patch("/target", verifyFirebaseToken, updateTargetAchievementController);
router.patch("/profile", verifyFirebaseToken, updateProfileAchievementController);

export default router;
