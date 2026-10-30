import { Router } from "express";

import {
  addQuestCommentController,
  createQuestPostController,
  deleteQuestPostController,
  getQuestPostController,
  listQuestPostsController,
  toggleQuestReactionController,
  updateQuestPostController,
  updateQuestPostStatusController,
} from "../controller/questBoard.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, listQuestPostsController);
router.post("/", verifyFirebaseToken, createQuestPostController);
router.get("/:postId", verifyFirebaseToken, getQuestPostController);
router.patch("/:postId", verifyFirebaseToken, updateQuestPostController);
router.delete("/:postId", verifyFirebaseToken, deleteQuestPostController);
router.post("/:postId/comments", verifyFirebaseToken, addQuestCommentController);
router.post("/:postId/reactions", verifyFirebaseToken, toggleQuestReactionController);
router.post("/:postId/status", verifyFirebaseToken, updateQuestPostStatusController);

export default router;
