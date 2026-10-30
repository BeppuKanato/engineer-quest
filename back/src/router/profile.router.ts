import { Router } from "express";

import {
  getProfileController,
  updateMascotController,
} from "../controller/profile.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getProfileController);
router.patch("/mascot", verifyFirebaseToken, updateMascotController);

export default router;
