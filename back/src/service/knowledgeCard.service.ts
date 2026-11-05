import { KnowledgeCard } from "@prisma/client";

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

export const toKnowledgeCardSummary = (
  card: Pick<
    KnowledgeCard,
    | "id"
    | "catalogNumber"
    | "label"
    | "title"
    | "description"
    | "connection"
    | "useCase"
    | "searchKeywords"
    | "rarity"
  >
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
