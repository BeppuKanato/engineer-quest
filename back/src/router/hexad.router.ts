import { Router } from "express";

import {
  createHexadResponseController,
  getFeedbackAssignmentController,
  getHexadResponseController,
  updateFeedbackAssignmentController,
} from "../controller/hexad.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getHexadResponseController);
router.post("/", verifyFirebaseToken, createHexadResponseController);
router.get("/assignment", verifyFirebaseToken, getFeedbackAssignmentController);
router.put("/assignment", verifyFirebaseToken, updateFeedbackAssignmentController);

export default router;
