import { Router } from "express";

import {
  getCourseResultController,
  getCourseResultFeedbackController,
  recordCourseResultEventController,
  startCourseResultFeedbackController,
} from "../controller/courseResult.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/:rewardRunId", verifyFirebaseToken, getCourseResultController);
router.post(
  "/:rewardRunId/feedback",
  verifyFirebaseToken,
  startCourseResultFeedbackController
);
router.get(
  "/:rewardRunId/feedback",
  verifyFirebaseToken,
  getCourseResultFeedbackController
);
router.post(
  "/:rewardRunId/events",
  verifyFirebaseToken,
  recordCourseResultEventController
);

export default router;
