import { Router } from "express";

import {
  addQuestCommentController,
  createQuestPostController,
  getQuestPostController,
  listQuestPostsController,
  toggleQuestReactionController,
  updateQuestPostStatusController,
} from "../controller/questBoard.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, listQuestPostsController);
router.post("/", verifyFirebaseToken, createQuestPostController);
router.get("/:postId", verifyFirebaseToken, getQuestPostController);
router.post("/:postId/comments", verifyFirebaseToken, addQuestCommentController);
router.post("/:postId/reactions", verifyFirebaseToken, toggleQuestReactionController);
router.post("/:postId/status", verifyFirebaseToken, updateQuestPostStatusController);

export default router;
