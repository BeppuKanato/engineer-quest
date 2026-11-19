import type { KnowledgeCard } from "@prisma/client";
import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

/** IDの対応だけを正とし、非公開・削除済みの課題は導線に出さない。 */
export async function getPublishedCardQuests(cards: readonly Pick<KnowledgeCard, "relatedCreateQuestIds">[]) {
  const ids = [...new Set(cards.flatMap(card => card.relatedCreateQuestIds))];
  return ids.length ? prisma.createQuest.findMany({
    where: { id: { in: ids }, isPublished: true }, select: { id: true, title: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  }) : [];
}

export async function getQuestKnowledgeCards(userId: string, questId: string) {
  if (!await prisma.createQuest.findFirst({ where: { id: questId, isPublished: true }, select: { id: true } })) throw new AppError(404, "CREATE_QUEST_NOT_FOUND", "この作る課題は見つかりませんでした。");
  const cards = await prisma.knowledgeCard.findMany({
    where: { isPublished: true, relatedCreateQuestIds: { has: questId } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, rarity: true, title: true, description: true, useCase: true, userKnowledgeCards: { where: { userId }, select: { id: true } } },
  });
  return { items: cards.map(card => card.userKnowledgeCards.length
    ? { id: card.id, rarity: card.rarity, isCollected: true as const, title: card.title, description: card.description, useCase: card.useCase }
    : { id: card.id, rarity: card.rarity, isCollected: false as const }) };
}

/** この単元で獲得済みのカードのみ。再訪時も送信待ちの報酬状態に依存しない。 */
export async function getUnitCardKeywords(userId: string, courseId: string) {
  const items = await prisma.knowledgeCard.findMany({
    where: { courseId, isPublished: true, course: { isPublished: true }, userKnowledgeCards: { some: { userId } } },
    select: { id: true, title: true, searchKeywords: true }, orderBy: [{ catalogNumber: "asc" }, { id: "asc" }],
  });
  return { items };
}
