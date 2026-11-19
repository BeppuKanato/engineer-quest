import { fetcher } from "@/lib/fetcher";

type CardRarity = "COMMON" | "RARE" | "EPIC";
export type QuestKnowledgeCard = { id: string; rarity: CardRarity } & (
  { isCollected: false } | { isCollected: true; title: string; description: string; useCase: string }
);
export type UnitCardKeywords = { id: string; title: string; searchKeywords: string[] };
export const getQuestKnowledgeCards = (token: string, questId: string) => fetcher<{ items: QuestKnowledgeCard[] }>(
  `/collection/knowledge-cards/for-quest/${encodeURIComponent(questId)}`, { method: "GET", token },
);
export const getUnitCardKeywords = (token: string, courseId: string) => fetcher<{ items: UnitCardKeywords[] }>(
  `/collection/knowledge-cards/for-unit/${encodeURIComponent(courseId)}`, { method: "GET", token },
);
