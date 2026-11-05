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
