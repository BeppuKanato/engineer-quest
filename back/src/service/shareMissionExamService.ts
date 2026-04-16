import { prisma } from "../lib/prisma"
import { Prisma } from "@prisma/client";

export const fetchSharedMissions = async(args: Prisma.SharedMissionExamProgressFindManyArgs) => {
    try {
       return await prisma.sharedMissionExamProgress.findMany(args);
    } catch(error) {
        console.log(`fetchSharedMissionsでエラー ${error}`);
        return null;
    }
}

export const createSharedMissionExamProgress = async(userId: string, examProgressId: string) => {
    try {
        const exists = await prisma.sharedMissionExamProgress.findUnique({
            where: { examProgressId },
        });

        if (exists) {
            console.log("すでに共有済みです");
            return null;
        }
        const result = await prisma.sharedMissionExamProgress.create({
            data: {
                userId: userId,
                examProgressId: examProgressId,
            }
        })

        return result;
    }
    catch(error) {
        console.log(`${examProgressId}を共有テーブルに追加中にエラー${error}`)
        return null;
    }
}