import { Router } from "express";

import { createAiConsultationController, listAiConsultationsController } from "../controller/aiConsultation.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, listAiConsultationsController);
router.post("/", verifyFirebaseToken, createAiConsultationController);

export default router;
