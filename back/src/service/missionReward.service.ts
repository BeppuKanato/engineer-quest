import { Prisma } from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import { toKnowledgeCardSummaries } from "./knowledgeCard.service";

const categoryLabel = {
  MISSION_COUNT: "Mission数",
  MISSION_CLEAR: "特定Mission",
  MISSION_COMPLETE: "Missionコンプリート",
  COURSE_EXAM: "Course終了試験",
  LEARNING_ACTION: "学習行動",
  COURSE_COMPLETE: "Course完了",
  STREAK: "継続",
} as const;

const getUserByFirebaseUid = async (firebaseUid: string) => {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  return user;
};

const getRewardRunForUser = async (firebaseUid: string, rewardRunId: string) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const rewardRun = await prisma.missionRewardRun.findFirst({
    where: {
      id: rewardRunId,
      userId: user.id,
    },
    include: {
      mission: {
        select: {
          id: true,
          courseId: true,
          title: true,
          learnedItems: true,
          order: true,
          isRequiredForCourseCompletion: true,
        },
      },
    },
  });

  if (!rewardRun) {
    throw new AppError(404, "MISSION_REWARD_RUN_NOT_FOUND", "Reward run not found");
  }

  return { user, rewardRun };
};

const getNextMission = async (courseId: string, currentOrder: number) => {
  return prisma.mission.findFirst({
    where: {
      courseId,
      isPublished: true,
      isRequiredForCourseCompletion: true,
      order: { gt: currentOrder },
    },
    orderBy: { order: "asc" },
    select: { id: true, title: true },
  });
};

const getUnlockedChallenges = async (missionId: string) => {
  return prisma.mission.findMany({
    where: {
      parentMissionId: missionId,
      isPublished: true,
    },
    orderBy: { branchOrder: "asc" },
    select: { id: true, title: true },
  });
};

export const getMissionRewardRunByFirebaseUid = async ({
  firebaseUid,
  rewardRunId,
}: {
  firebaseUid: string;
  rewardRunId: string;
}) => {
  const { rewardRun } = await getRewardRunForUser(firebaseUid, rewardRunId);

  const [candidateCards, selectedCard, unlockedAchievements, nextMission, unlockedChallenges] =
    await Promise.all([
      rewardRun.candidateKnowledgeCardIds.length > 0
        ? prisma.knowledgeCard.findMany({
            where: { id: { in: rewardRun.candidateKnowledgeCardIds } },
          })
        : Promise.resolve([]),
      rewardRun.selectedKnowledgeCardId
        ? prisma.knowledgeCard.findUnique({
            where: { id: rewardRun.selectedKnowledgeCardId },
          })
        : Promise.resolve(null),
      rewardRun.unlockedAchievementIds.length > 0
        ? prisma.achievement.findMany({
            where: { id: { in: rewardRun.unlockedAchievementIds } },
          })
        : Promise.resolve([]),
      getNextMission(rewardRun.mission.courseId, rewardRun.mission.order),
      getUnlockedChallenges(rewardRun.missionId),
    ]);

  const candidateMap = new Map(candidateCards.map((card) => [card.id, card]));
  const achievementMap = new Map(unlockedAchievements.map((achievement) => [achievement.id, achievement]));

  return {
    id: rewardRun.id,
    mission: {
      id: rewardRun.mission.id,
      courseId: rewardRun.mission.courseId,
      title: rewardRun.mission.title,
      learnedItems: rewardRun.mission.learnedItems,
    },
    candidateKnowledgeCards: toKnowledgeCardSummaries(
      rewardRun.candidateKnowledgeCardIds
        .map((id) => candidateMap.get(id))
        .filter((card): card is NonNullable<typeof card> => Boolean(card))
    ),
    selectedKnowledgeCard: selectedCard
      ? toKnowledgeCardSummaries([selectedCard])[0]
      : null,
    unlockedAchievements: rewardRun.unlockedAchievementIds
      .map((id) => achievementMap.get(id))
      .filter((achievement): achievement is NonNullable<typeof achievement> => Boolean(achievement))
      .map((achievement) => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        category: achievement.category,
        categoryLabel: categoryLabel[achievement.category],
      })),
    awardedExp: rewardRun.awardedExp,
    awardedBadgeTickets: rewardRun.awardedBadgeTickets,
    nextMission,
    unlockedChallenges,
    createdAt: rewardRun.createdAt.toISOString(),
  };
};

export const selectMissionRewardKnowledgeCardByFirebaseUid = async ({
  firebaseUid,
  rewardRunId,
  knowledgeCardId,
}: {
  firebaseUid: string;
  rewardRunId: string;
  knowledgeCardId: string;
}) => {
  const { user, rewardRun } = await getRewardRunForUser(firebaseUid, rewardRunId);

  if (rewardRun.selectedKnowledgeCardId) {
    throw new AppError(
      409,
      "KNOWLEDGE_CARD_ALREADY_SELECTED",
      "Knowledge card has already been selected for this reward run."
    );
  }

  if (!rewardRun.candidateKnowledgeCardIds.includes(knowledgeCardId)) {
    throw new AppError(
      400,
      "KNOWLEDGE_CARD_NOT_IN_REWARD_RUN",
      "Knowledge card is not a candidate for this reward run"
    );
  }

  const knowledgeCard = await prisma.knowledgeCard.findFirst({
    where: {
      id: knowledgeCardId,
      courseId: rewardRun.mission.courseId,
      isPublished: true,
    },
  });

  if (!knowledgeCard) {
    throw new AppError(404, "KNOWLEDGE_CARD_NOT_FOUND", "Knowledge card not found");
  }

  const selectedAt = new Date();
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const collected = await tx.userKnowledgeCard.upsert({
      where: {
        userId_knowledgeCardId: {
          userId: user.id,
          knowledgeCardId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        knowledgeCardId,
      },
      include: {
        knowledgeCard: true,
      },
    });

    await tx.missionRewardRun.update({
      where: { id: rewardRun.id },
      data: {
        selectedKnowledgeCardId: knowledgeCardId,
        knowledgeCardSelectedAt: selectedAt,
      },
    });

    return collected;
  });

  return {
    knowledgeCard: toKnowledgeCardSummaries([result.knowledgeCard])[0],
    collectedAt: result.collectedAt.toISOString(),
    selectedAt: selectedAt.toISOString(),
  };
};
