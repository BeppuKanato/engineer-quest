import { Router } from "express";

import {
  deleteUserWorkController,
  getCreateMissionController,
  getCreateMissionsController,
  getUserWorkController,
  getUserWorksController,
  reviewUserWorkController,
  saveUserWorkController,
  updateUserWorkController,
} from "../controller/createMission.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/create-missions", verifyFirebaseToken, getCreateMissionsController);
router.get(
  "/create-missions/:createMissionId",
  verifyFirebaseToken,
  getCreateMissionController
);
router.post(
  "/create-missions/:createMissionId/works",
  verifyFirebaseToken,
  saveUserWorkController
);

router.get("/my-works", verifyFirebaseToken, getUserWorksController);
router.get("/my-works/:workId", verifyFirebaseToken, getUserWorkController);
router.put("/my-works/:workId", verifyFirebaseToken, updateUserWorkController);
router.delete("/my-works/:workId", verifyFirebaseToken, deleteUserWorkController);
router.post(
  "/my-works/:workId/review",
  verifyFirebaseToken,
  reviewUserWorkController
);

export default router;
