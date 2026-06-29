import { Router } from "express";

import { getHomeController } from "../controller/home.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getHomeController);

export default router;
