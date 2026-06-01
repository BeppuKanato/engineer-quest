import { Router } from "express";
import { verifyFirebaseToken } from "../middleware/authMiddleware";
import { getMissionOverviewController } from "../controller/mission.controller";

const router = Router();

router.get(
  "/:missionId/overview",
  verifyFirebaseToken,
  getMissionOverviewController
);

export default router;