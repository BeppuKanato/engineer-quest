import type { CollectionKnowledgeTip } from "../../api/collection.api";

export function sortKnowledgeCards(cards: readonly CollectionKnowledgeTip[], sort: string) {
  return [...cards].sort((a, b) => {
    // 未所持分のレア度や獲得日時で並び順から情報が伝わらないようにする。
    if (!a.isCollected || !b.isCollected) {
      if (a.isCollected !== b.isCollected) return a.isCollected ? -1 : 1;
      return a.catalogNumber - b.catalogNumber;
    }
    if (sort === "rarity") {
      const order = { EPIC: 3, RARE: 2, COMMON: 1 };
      return order[b.rarity] - order[a.rarity];
    }
    if (sort === "course") return a.courseTitle.localeCompare(b.courseTitle, "ja");
    return new Date(b.collectedAt ?? 0).getTime() - new Date(a.collectedAt ?? 0).getTime();
  });
}
