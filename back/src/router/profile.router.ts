import { Router } from "express";

import { getProfileController } from "../controller/profile.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getProfileController);

export default router;
