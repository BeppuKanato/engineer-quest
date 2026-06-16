import { Router } from "express";
import { verifyFirebaseToken } from "../middleware/authMiddleware";
import { getMissionOverviewController } from "../controller/mission.controller";
import { getLessonPlayController, completeLessonController, getLessonCompleteController } from "../controller/lesson.controller";
import { getMissionExamIntroController, startMissionExamController} from "../controller/missionExam.controller";
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

router.get(
  "/:missionId/exam/intro",
  verifyFirebaseToken,
  getMissionExamIntroController
)

router.post(
  "/:missionId/exam/start",
  verifyFirebaseToken,
  startMissionExamController
);
export default router;