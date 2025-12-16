import { prisma } from "../lib/prisma"
import { fetchUser, updateUser } from "./userService";

export const fetchRank = async(where: object, select: Object) => {
    try {
        const rank = await prisma.rank.findFirst({
            where: where,
            select
        });

        return rank;
    }
    catch(error) {
        console.log(`Service/rankService/fetchRankでエラー\n${error}`)
        return null
    }
}

export const checkAndUpdateRank = async(userId: string, missionId: string) => {
    const user = await fetchUser(userId, {
        rank: { select: { order: true } },
    }) as { rank: { order: number } } | null;

    if (!user?.rank) return null;

    const targetRank = await fetchRank({
        requiredId: missionId,
        order: user.rank.order + 1
    },{
        id: true,
        order: true,
        name: true
    }) as {
        id: string,
        order: number,
        name: string
    } | null;

    if (!targetRank) return null;

    const updatedUser = await updateUser(userId, { rankId: targetRank.id });
    return targetRank;
}