import { Request, Response } from "express";
import { fetchUsageTime, upsertDailyUsage } from "../service/usageTimeService";
import { AuthRequest } from "../middleware/verifyToken";

export const getUsageTimeController = async(req: Request, res: Response) => {
    const { userId, period } = req.body;
    try {
        const usageTime = await fetchUsageTime(userId, period);
        res.status(200).json({ usageTime });
    } catch (error) {
        console.error("Error fetching usage time:", error);
        res.status(500).json({ error: "学習時間の取得に失敗しました" });
    }
};

export const upsertUsageTimeController = async(req: AuthRequest, res: Response) => {
    console.log("学習時間を追加します");
    const { useTime } = req.body;
    const userId = req.user!.uid;
    try {
        const updatedUsage = await upsertDailyUsage(userId, useTime);
        res.status(200).json({message: "学習時間を更新しました"});
    } catch (error) {
        console.error("Error updating usage time:", error);
        res.status(500).json({ error: "学習時間の更新に失敗しました" });
    }
};