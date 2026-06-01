import { Request, Response, NextFunction } from "express";
import { getMissionOverviewService } from "../service/mission.service";
import { AppError } from "../error/appError";

export const getMissionOverviewController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { missionId } = req.params;

        if (!missionId) {
            throw new AppError(400, "BAD_REQUEST", "Mission ID is required");
        }

        const firebaseUid = req.authUser?.firebaseUid;

        if (!firebaseUid) {
            throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
        }

        const mission = await getMissionOverviewService({
            missionId,
            firebaseUid,
        });

        res.status(200).json(mission);
    } catch (error) {
        next(error);
    }
};