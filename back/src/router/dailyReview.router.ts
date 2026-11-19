import { Router } from "express";
import { answerTodayReviewController, getTodayReviewController } from "../controller/dailyReview.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();
router.get("/today", verifyFirebaseToken, getTodayReviewController);
router.post("/today/answer", verifyFirebaseToken, answerTodayReviewController);
export default router;
