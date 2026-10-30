import { Router } from "express";

import {
  getCreateQuest,
  getCreateQuestFeedback,
  listCreateQuestAttempts,
  listCreateQuests,
  saveCreateQuestAttempt,
  saveCreateQuestExecution,
  startCreateQuestAttempt,
  startCreateQuestFeedback,
  submitCreateQuest,
  viewCreateQuestHint,
} from "../controller/createQuest.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();
router.use(verifyFirebaseToken);
router.get("/create-quests", listCreateQuests);
router.get("/create-quests/:questId", getCreateQuest);
router.post("/create-quests/:questId/attempts", startCreateQuestAttempt);
router.get("/create-quest-attempts", listCreateQuestAttempts);
router.patch("/create-quest-attempts/:attemptId", saveCreateQuestAttempt);
router.post("/create-quest-attempts/:attemptId/executions", saveCreateQuestExecution);
router.post("/create-quest-attempts/:attemptId/hints/:requirementId/:hintId", viewCreateQuestHint);
router.post("/create-quest-attempts/:attemptId/submissions", submitCreateQuest);
router.post("/create-quest-submissions/:submissionId/feedback", startCreateQuestFeedback);
router.get("/create-quest-submissions/:submissionId/feedback", getCreateQuestFeedback);

export default router;
