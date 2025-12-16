import { Router } from "express";
import { acceptController, homeController } from "../controller/homeController";
import { verifyToken } from "../middleware/verifyToken";

const homeRouter = Router();

homeRouter.post('/', verifyToken, homeController);
homeRouter.post('/acceptMission', verifyToken, acceptController);

export default homeRouter;