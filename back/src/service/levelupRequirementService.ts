import { prisma } from "../lib/prisma";

export const fetchLevelupRequirement = async(level: number, select: any) => {
    try {
        const levelupRequirement = await prisma.levelupRequirement.findUnique({
            where: { level },
            select
        });
        return levelupRequirement;
    } catch (error) {
        console.error("Error fetching levelup requirement:", error);
        return null;
    }
};
