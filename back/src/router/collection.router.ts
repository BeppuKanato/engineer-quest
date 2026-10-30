import { Router } from "express";

import { getCollectionController } from "../controller/collection.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getCollectionController);

export default router;
