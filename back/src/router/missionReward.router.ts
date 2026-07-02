import { Router } from "express";

import {
  getMissionRewardRunController,
  selectMissionRewardKnowledgeCardController,
} from "../controller/missionReward.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/:rewardRunId", verifyFirebaseToken, getMissionRewardRunController);
router.post(
  "/:rewardRunId/knowledge-card/select",
  verifyFirebaseToken,
  selectMissionRewardKnowledgeCardController
);

export default router;
