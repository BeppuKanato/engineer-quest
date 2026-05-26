import { Router } from "express";
import { getCoursesController, getCoursesDevController } from "../controller/course.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getCoursesController);

// 開発確認用
if (process.env.NODE_ENV !== "production") {
  router.get("/dev/:userId", getCoursesDevController);
}

export default router;