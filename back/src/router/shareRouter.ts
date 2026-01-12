import { Router } from "express";
import { ensureUserExitController } from "../controller/authController";
import { verifyToken } from "../middleware/verifyToken";
import { shareMissionExamController } from "../controller/problemController";
import { mainController, selectFilterdMissionController } from "../controller/shareController";

const shareRouter = Router();

shareRouter.post('/create', verifyToken, shareMissionExamController);
shareRouter.post('/selectFiltedMissinExam', verifyToken, selectFilterdMissionController);
shareRouter.post('/main', verifyToken, mainController);

export default shareRouter;