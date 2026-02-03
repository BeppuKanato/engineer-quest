import { Router } from "express";
import { completeStepController, missionConfirmController, missionExamAIJudgeController, missionExamController, missionResultController, missionSelectController, selectFeedbackController, shareMissionExamController, startMissionController, stepExamController, stepExplainController } from "../controller/problemController";
import { verifyToken } from "../middleware/verifyToken";

const problemRouter = Router();

problemRouter.post('/missionSelect', verifyToken, missionSelectController);
problemRouter.post('/missionConfirm', verifyToken, missionConfirmController);
problemRouter.post('/stepExplain', stepExplainController);
problemRouter.post('/stepExam', stepExamController);
problemRouter.post('/missionExam', verifyToken, missionExamController);
problemRouter.post(`/missionExamAIJudge`, verifyToken, missionExamAIJudgeController);
problemRouter.post('/missionResult', verifyToken, missionResultController);
problemRouter.post('/startMission', startMissionController);
problemRouter.post('/completeStep', verifyToken, completeStepController);
problemRouter.post('/shareExam', verifyToken, shareMissionExamController);
problemRouter.post('/selectFeedback', verifyToken, selectFeedbackController);

export default problemRouter;