import { Router } from "express";

import {
  createHexadResponseController,
  getHexadResponseController,
} from "../controller/hexad.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getHexadResponseController);
router.post("/", verifyFirebaseToken, createHexadResponseController);

export default router;
