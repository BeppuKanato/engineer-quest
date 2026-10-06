import { KnowledgeCard, Prisma } from "@prisma/client";

export type KnowledgeCardSummary = {
  id: string;
  catalogNumber: number;
  label: string;
  title: string;
  description: string;
  connection: string;
  useCase: string;
  searchKeywords: string[];
  rarity: string;
};

const CARD_FIELDS = {
  id: true,
  catalogNumber: true,
  label: true,
  title: true,
  description: true,
  connection: true,
  useCase: true,
  searchKeywords: true,
  rarity: true,
} satisfies Prisma.KnowledgeCardSelect;

export const toKnowledgeCardSummary = (
  card: Pick<KnowledgeCard, keyof typeof CARD_FIELDS>
): KnowledgeCardSummary => ({
  id: card.id,
  catalogNumber: card.catalogNumber,
  label: card.label,
  title: card.title,
  description: card.description,
  connection: card.connection,
  useCase: card.useCase,
  searchKeywords: card.searchKeywords,
  rarity: card.rarity,
});

export const awardScheduledKnowledgeCard = async (
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    missionId: string;
    courseId: string;
    courseVersion: number;
    tableNumber: number;
  }
) => {
  const schedule = await tx.knowledgeCardScheduleEntry.findUnique({
    where: {
      courseId_courseVersion_tableNumber_missionId: {
        courseId: input.courseId,
        courseVersion: input.courseVersion,
        tableNumber: input.tableNumber,
        missionId: input.missionId,
      },
    },
    include: { knowledgeCard: { select: CARD_FIELDS } },
  });

  if (!schedule) return null;

  const existing = await tx.userKnowledgeCard.findUnique({
    where: {
      userId_knowledgeCardId: {
        userId: input.userId,
        knowledgeCardId: schedule.knowledgeCardId,
      },
    },
    select: { collectedAt: true },
  });

  const collected = existing ?? await tx.userKnowledgeCard.create({
    data: {
      userId: input.userId,
      knowledgeCardId: schedule.knowledgeCardId,
    },
    select: { collectedAt: true },
  });

  return {
    card: toKnowledgeCardSummary(schedule.knowledgeCard),
    newlyCollected: !existing,
    collectedAt: collected.collectedAt,
  };
};
