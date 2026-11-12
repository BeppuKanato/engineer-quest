/** コレクション既存色を獲得演出でも共有する。教材の状態色とは分離。 */
export const knowledgeCardTones = {
  COMMON: { label: "Common", color: "#0f766e", bgcolor: "#e6fffb", border: "#99f6e4" },
  RARE: { label: "Rare", color: "#1d4ed8", bgcolor: "#dbeafe", border: "#93c5fd" },
  EPIC: { label: "Epic", color: "#7e22ce", bgcolor: "#f3e8ff", border: "#d8b4fe" },
} as const;
export const uncollectedTone = { color: "#64748b", silhouette: "#94a3b8", background: "#f1f5f9" } as const;
