import { Router } from "express";

import {
  createMyWorkController,
  deleteMyWorkController,
  getCreateThemeController,
  getCreateThemesController,
  getMyWorkController,
  getMyWorksController,
  getSharedWorksController,
  shareMyWorkController,
  unshareMyWorkController,
  updateMyWorkController,
} from "../controller/createTheme.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/create-themes", verifyFirebaseToken, getCreateThemesController);
router.get("/create-themes/:themeId", verifyFirebaseToken, getCreateThemeController);
router.post("/create-themes/:themeId/works", verifyFirebaseToken, createMyWorkController);

router.get("/my-works", verifyFirebaseToken, getMyWorksController);
router.get("/my-works/:workId", verifyFirebaseToken, getMyWorkController);
router.patch("/my-works/:workId", verifyFirebaseToken, updateMyWorkController);
router.delete("/my-works/:workId", verifyFirebaseToken, deleteMyWorkController);
router.post("/my-works/:workId/share", verifyFirebaseToken, shareMyWorkController);
router.post("/my-works/:workId/unshare", verifyFirebaseToken, unshareMyWorkController);

router.get("/shared-works", getSharedWorksController);

export default router;
