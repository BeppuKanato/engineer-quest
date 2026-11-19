import { Router } from "express";

import { getCollectionController, getQuestKnowledgeCardsController, getUnitCardKeywordsController } from "../controller/collection.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getCollectionController);
router.get("/knowledge-cards/for-quest/:questId", verifyFirebaseToken, getQuestKnowledgeCardsController);
router.get("/knowledge-cards/for-unit/:courseId", verifyFirebaseToken, getUnitCardKeywordsController);

export default router;
