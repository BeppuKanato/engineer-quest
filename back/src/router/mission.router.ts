import { Router } from "express";
import { verifyFirebaseToken } from "../middleware/authMiddleware";
import { getMissionOverviewController } from "../controller/mission.controller";
import { getLessonPlayController, completeLessonController, getLessonCompleteController } from "../controller/lesson.controller";
const router = Router();

router.get(
  "/:missionId/overview",
  verifyFirebaseToken,
  getMissionOverviewController
);

router.get(
  "/lesson/:lessonId/play",
  verifyFirebaseToken,
  getLessonPlayController
);

router.post(
  "/lesson/:lessonId/complete",
  verifyFirebaseToken,
  completeLessonController
);

router.get(
  "/lesson/:lessonId/complete",
  verifyFirebaseToken,
  getLessonCompleteController
);
export default router;