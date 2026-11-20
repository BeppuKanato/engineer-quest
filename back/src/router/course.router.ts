/** `/api/courses` の一覧取得ルートをCourse controllerへ接続する。 */
import { Router } from "express";
import { getCoursesController, getRelatedCreateQuestsController } from "../controller/course.controller";
import { verifyFirebaseToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyFirebaseToken, getCoursesController);
router.get("/:courseId/create-quests", verifyFirebaseToken, getRelatedCreateQuestsController);

export default router;
