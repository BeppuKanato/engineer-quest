import { Router } from "express";
import {
  getCourseRoadmapController,
  getCoursesController,
} from "../controller/course.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getCoursesController);
router.get("/:courseId", verifyFirebaseToken, getCourseRoadmapController);

export default router;
