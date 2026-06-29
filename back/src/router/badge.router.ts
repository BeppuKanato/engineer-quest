import { Router } from "express";

import {
  drawTechIconBadgeController,
  getBadgeCollectionController,
  setSelectedTechIconBadgeController,
} from "../controller/badge.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getBadgeCollectionController);
router.post("/gacha", verifyFirebaseToken, drawTechIconBadgeController);
router.post("/profile", verifyFirebaseToken, setSelectedTechIconBadgeController);

export default router;
