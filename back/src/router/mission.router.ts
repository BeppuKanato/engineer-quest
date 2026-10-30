/**
 * `/api/missions` 配下のHTTPルート定義。
 * 認証後にMission概要・Activity学習・回答・完了・Course Mission試行をcontrollerへ渡す。
 */
import { Router } from "express";

import {
  answerMissionActivityController,
  completeMissionActivityController,
  completeMissionController,
  getMissionOverviewController,
  getMissionPlayController,
  getCourseExamAttemptController,
  listCourseExamAttemptsController,
  recordCourseExamHintViewController,
  recordCourseExamTestExecutionController,
  startCourseExamAttemptController,
} from "../controller/mission.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/:missionId/course-exam/attempt",
  verifyFirebaseToken,
  getCourseExamAttemptController
);
router.get(
  "/:missionId/course-exam/attempts",
  verifyFirebaseToken,
  listCourseExamAttemptsController
);
router.post(
  "/:missionId/course-exam/attempt",
  verifyFirebaseToken,
  startCourseExamAttemptController
);
router.post(
  "/:missionId/course-exam/attempts/:attemptId/hints/:hintId",
  verifyFirebaseToken,
  recordCourseExamHintViewController
);
router.post(
  "/:missionId/course-exam/attempts/:attemptId/test-executions",
  verifyFirebaseToken,
  recordCourseExamTestExecutionController
);

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

export default router;
