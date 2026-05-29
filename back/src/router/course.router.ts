import { Router } from "express";
import { getCoursesController } from "../controller/course.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getCoursesController);

export default router;