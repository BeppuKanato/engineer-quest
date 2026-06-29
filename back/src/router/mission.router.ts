import { Router } from "express";

import {
  answerMissionActivityController,
  collectMissionKnowledgeCardController,
  completeMissionActivityController,
  completeMissionController,
  getMissionOverviewController,
  getMissionPlayController,
} from "../controller/mission.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/:missionId/overview", verifyFirebaseToken, getMissionOverviewController);

router.get("/:missionId/play", verifyFirebaseToken, getMissionPlayController);

router.post(
  "/:missionId/activities/:activityId/answer",
  verifyFirebaseToken,
  answerMissionActivityController
);

router.post(
  "/:missionId/activities/:activityId/complete",
  verifyFirebaseToken,
  completeMissionActivityController
);

router.post("/:missionId/complete", verifyFirebaseToken, completeMissionController);

router.post(
  "/:missionId/knowledge-cards/collect",
  verifyFirebaseToken,
  collectMissionKnowledgeCardController
);

export default router;
