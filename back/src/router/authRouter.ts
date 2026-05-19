import { Router } from "express";
import { ensureUserExistController } from "../controller/olds/authController";
import { verifyToken } from "../middleware/verifyToken";

const authRouter = Router();

authRouter.post('/ensure', verifyToken, ensureUserExistController);

export default authRouter;