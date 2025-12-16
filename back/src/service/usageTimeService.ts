import { prisma } from "../lib/prisma";

export type UsagePeriod = "day" | "week" | "month" | "total";
/**
 * @abstract ユーザの学習時間を取得
 * @summary ユーザの指定した期間の学習時間を取得する
 * @example
 * Request
 * {
 *   "userId": "user123",
 *   "period": "week"
 * }
 * Response
 * {
 *   "usageTime": 600
 * }
 * @description
 * ユーザの指定した期間の学習時間を取得するAPIです。
 * ユーザIDと期間を指定して、学習時間をデータベースから取得します。
 * 成功した場合は、学習時間をJSON形式で返します。
 * 失敗した場合は、エラーメッセージを返します。
 * 
 * @param userId 
 * @param period 
 * @returns 
 */
export const fetchUsageTime = async (userId: string, period: UsagePeriod) => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
        case "day":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            startDate.setHours(0, 0, 0, 0);
            break;
        case "week":
            const dayOfWeek = now.getDay();
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            startDate.setHours(0, 0, 0, 0);
            break;
        case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        case "total":
            startDate = new Date(0);
            break;
    }

    try {
        const usage = await prisma.usageTime.aggregate({
            where: {
                userId: userId,
                date: { gte: startDate }
            },
            _sum: {
                usageTime: true
            }
        });

        return usage._sum.usageTime ?? 0;
    } catch (error) {
        console.error("Error fetching usage time:", error);
        throw new Error("Failed to fetch usage time");
    }
};

/**
 * @abstract ユーザの今日の学習時間を更新または挿入
 * @summary ユーザの今日の学習時間を更新または挿入する
 * @example
 * Request
 * {
 *   "userId": "user123",
 *   "useTime": 120
 * }
 * Response
 * {
 *   "message": "学習時間を更新しました"
 * }
 * @description
 * ユーザの今日の学習時間を更新または挿入するAPIです。
 * ユーザIDと使用時間を指定して、学習時間をデータベースに保存します。
 * 成功した場合は、成功メッセージをJSON形式で返します。
 * 失敗した場合は、エラーメッセージを返します。
 * 
 * @param userId
 * @param useTime
 * @returns
 */
export const upsertDailyUsage = async(userId: string, useTime: number) => {
    const date = new Date();
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    today.setHours(0, 0, 0, 0);
    try {
        const dailyUsage = await prisma.usageTime.upsert({
            where: {
                userId_date: {
                    userId, date: today
                }
            },
            update: {
                usageTime: {
                    increment: useTime
                }
            },
            create: {
                userId,
                date: today,
                usageTime: useTime
            }
        });
        return dailyUsage;
    } catch (error) {
        console.error("Error upserting daily usage:", error);
        throw new Error("Failed to upsert daily usage");
    }
}