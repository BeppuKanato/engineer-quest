import { Router } from "express";

import { getAchievementsController } from "../controller/achievement.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getAchievementsController);

export default router;
