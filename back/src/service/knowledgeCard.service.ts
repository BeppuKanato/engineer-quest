import { KnowledgeCard } from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

export type KnowledgeCardSummary = {
  id: string;
  label: string;
  title: string;
  description: string;
  rarity: string;
};

const toKnowledgeCardSummary = (
  card: Pick<KnowledgeCard, "id" | "label" | "title" | "description" | "rarity">
): KnowledgeCardSummary => ({
  id: card.id,
  label: card.label,
  title: card.title,
  description: card.description,
  rarity: card.rarity,
});

const shuffle = <T>(items: T[]) => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
};

export const getKnowledgeCardChoicesForMission = async (
  userId: string,
  courseId: string,
  limit = 3
): Promise<KnowledgeCardSummary[]> => {
  const collectedCards = await prisma.userKnowledgeCard.findMany({
    where: { userId },
    select: { knowledgeCardId: true },
  });
  const collectedCardIds = collectedCards.map((card) => card.knowledgeCardId);

  const candidates = await prisma.knowledgeCard.findMany({
    where: {
      courseId,
      isPublished: true,
      id: {
        notIn: collectedCardIds,
      },
    },
    orderBy: [{ rarity: "asc" }, { sortOrder: "asc" }],
  });

  return shuffle(candidates).slice(0, limit).map(toKnowledgeCardSummary);
};

export const getKnowledgeCardCandidateIdsForMission = async (
  userId: string,
  courseId: string,
  limit = 3
): Promise<string[]> => {
  const choices = await getKnowledgeCardChoicesForMission(userId, courseId, limit);

  return choices.map((choice) => choice.id);
};

export const toKnowledgeCardSummaries = (
  cards: Pick<KnowledgeCard, "id" | "label" | "title" | "description" | "rarity">[]
) => cards.map(toKnowledgeCardSummary);

export const collectKnowledgeCardByFirebaseUid = async ({
  firebaseUid,
  missionId,
  knowledgeCardId,
}: {
  firebaseUid: string;
  missionId: string;
  knowledgeCardId: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  const missionProgress = await prisma.userMissionProgress.findFirst({
    where: {
      userId: user.id,
      missionId,
      status: "COMPLETED",
    },
    include: {
      mission: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!missionProgress) {
    throw new AppError(
      403,
      "MISSION_NOT_COMPLETED",
      "Mission must be completed before collecting a knowledge card"
    );
  }

  const knowledgeCard = await prisma.knowledgeCard.findFirst({
    where: {
      id: knowledgeCardId,
      courseId: missionProgress.mission.courseId,
      isPublished: true,
    },
  });

  if (!knowledgeCard) {
    throw new AppError(
      404,
      "KNOWLEDGE_CARD_NOT_FOUND",
      "Knowledge card not found"
    );
  }

  const collected = await prisma.userKnowledgeCard.upsert({
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

  return {
    knowledgeCard: toKnowledgeCardSummary(collected.knowledgeCard),
    collectedAt: collected.collectedAt.toISOString(),
  };
};
