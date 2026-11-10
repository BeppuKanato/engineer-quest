import { Router } from "express";

import {
  confirmBigGoalProposalController,
  createBigGoalProposalController,
  getBigGoalProposalController,
  getCurrentBigGoalController,
  listBigGoalHistoryController,
} from "../controller/bigGoal.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.post("/proposals", verifyFirebaseToken, createBigGoalProposalController);
router.get("/proposals/:id", verifyFirebaseToken, getBigGoalProposalController);
router.post("/proposals/:id/confirm", verifyFirebaseToken, confirmBigGoalProposalController);
router.get("/current", verifyFirebaseToken, getCurrentBigGoalController);
router.get("/history", verifyFirebaseToken, listBigGoalHistoryController);

export default router;
