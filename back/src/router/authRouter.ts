import { Router } from "express";
import { ensureUserExitController } from "../controller/authController";
import { verifyToken } from "../middleware/verifyToken";

const authRouter = Router();

authRouter.post('/ensure', verifyToken, ensureUserExitController);

export default authRouter;