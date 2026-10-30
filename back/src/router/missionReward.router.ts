import { Router } from "express";

import {
  getMissionRewardRunController,
} from "../controller/missionReward.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/:rewardRunId", verifyFirebaseToken, getMissionRewardRunController);

export default router;
