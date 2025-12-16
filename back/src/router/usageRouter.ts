import { Router } from "express";
import { getUsageTimeController, upsertUsageTimeController } from "../controller/usageController";
import { verifyToken } from "../middleware/verifyToken";

const usageRouter = Router();

usageRouter.post('/upsert', verifyToken, upsertUsageTimeController);
usageRouter.post('/get', verifyToken, getUsageTimeController);

export default usageRouter;