import { AchievementCategory } from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import { toKnowledgeCardSummary } from "./knowledgeCard.service";

const categoryLabel: Record<AchievementCategory, string> = {
  MISSION_COUNT: "Mission数",
  MISSION_CLEAR: "特定Mission",
  MISSION_COMPLETE: "Missionコンプリート",
  COURSE_EXAM: "Course終了試験",
  LEARNING_ACTION: "学習行動",
  COURSE_COMPLETE: "Course完了",
  CREATE_QUEST: "作る課題",
  COLLECTION: "コレクション",
  STREAK: "継続",
};

const getNextMission = (courseId: string, currentOrder: number) =>
  prisma.mission.findFirst({
    where: { courseId, isPublished: true, isRequiredForCourseCompletion: true, order: { gt: currentOrder } },
    orderBy: { order: "asc" },
    select: { id: true, title: true },
  });

const getUnlockedChallenges = (missionId: string) =>
  prisma.mission.findMany({
    where: { parentMissionId: missionId, isPublished: true },
    orderBy: { branchOrder: "asc" },
    select: { id: true, title: true },
  });

export const getMissionRewardRunByUserId = async ({ userId, rewardRunId }: { userId: string; rewardRunId: string }) => {
  const rewardRun = await prisma.missionRewardRun.findFirst({
    where: { id: rewardRunId, userId },
    include: {
      mission: {
        select: {
          id: true, courseId: true, title: true, learnedItems: true, order: true, type: true,
          course: { select: { title: true } },
        },
      },
    },
  });

  if (!rewardRun) throw new AppError(404, "MISSION_REWARD_RUN_NOT_FOUND", "Reward run not found");

  const [awardedCard, unlockedAchievements, nextMission, unlockedChallenges] = await Promise.all([
    rewardRun.awardedKnowledgeCardId
      ? prisma.knowledgeCard.findUnique({ where: { id: rewardRun.awardedKnowledgeCardId } })
      : Promise.resolve(null),
    rewardRun.unlockedAchievementIds.length
      ? prisma.achievement.findMany({ where: { id: { in: rewardRun.unlockedAchievementIds } } })
      : Promise.resolve([]),
    getNextMission(rewardRun.mission.courseId, rewardRun.mission.order),
    getUnlockedChallenges(rewardRun.missionId),
  ]);
  const achievementMap = new Map(unlockedAchievements.map((item) => [item.id, item]));

  return {
    id: rewardRun.id,
    mission: {
      id: rewardRun.mission.id,
      courseId: rewardRun.mission.courseId,
      title: rewardRun.mission.title,
      learnedItems: rewardRun.mission.learnedItems,
      courseTitle: rewardRun.mission.course.title,
      isCourseCompletion: rewardRun.mission.type === "COURSE_EXAM",
    },
    awardedKnowledgeCard: awardedCard ? toKnowledgeCardSummary(awardedCard) : null,
    unlockedAchievements: rewardRun.unlockedAchievementIds
      .map((id) => achievementMap.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        categoryLabel: categoryLabel[item.category],
        rarity: item.rarity,
        iconKey: item.iconKey,
      })),
    awardedExp: rewardRun.awardedExp,
    nextMission,
    unlockedChallenges,
    createdAt: rewardRun.createdAt.toISOString(),
  };
};
