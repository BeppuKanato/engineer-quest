import { Router } from "express";

import {
  completePhaseController,
  completeUnitController,
  getUnitProgressController,
  ingestLearningEventsController,
  startUnitController,
} from "../controller/learning.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/units/:courseId/progress", verifyFirebaseToken, getUnitProgressController);
router.post("/units/:courseId/start", verifyFirebaseToken, startUnitController);
router.post("/units/:courseId/complete", verifyFirebaseToken, completeUnitController);
router.post("/units/:courseId/phases/:phaseKey/complete", verifyFirebaseToken, completePhaseController);
router.post("/events/batch", verifyFirebaseToken, ingestLearningEventsController);

export default router;
