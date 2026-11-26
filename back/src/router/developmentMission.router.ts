import { Router } from "express";

import { getDevelopmentMissionBestsController, recordDevelopmentMissionAttemptController } from "../controller/developmentMission.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/bests", verifyFirebaseToken, getDevelopmentMissionBestsController);
router.post("/:missionId/attempts", verifyFirebaseToken, recordDevelopmentMissionAttemptController);

export default router;
