import { prisma } from "../lib/prisma";

export const fetchExperienceLogs = async(userId: string, extraWhere: object, select: object) => {
  try {
    const logs = await prisma.experienceLog.findMany({
      where: {
        userId: userId,
        ...extraWhere
      },
      select
    });
    return logs;
  } catch (error) {
    console.error("Error fetching experience logs:", error);
    return null;
  }
};


export const createExperienceLog = async(userId: string, missionProgressId: string, experience: number) => {
  try {
    const log = await prisma.experienceLog.create({
      data: {
        userId: userId,
        missionProgressId: missionProgressId,
        experience: experience
      }
    });
    return log;
  } catch (error) {
    console.error("Error creating experience log:", error);
    return null;
  }
};