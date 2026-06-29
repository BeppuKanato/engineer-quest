import { Router } from "express";

import { getHistoryController } from "../controller/history.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getHistoryController);

export default router;
