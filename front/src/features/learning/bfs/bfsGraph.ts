import type { GraphCanvasState } from "../player/graphCanvas.types";

/**
 * BFS 教材のグラフの正本（#88 で統一）。
 * 辺と配置はフェーズ2のレビュー済みサンプルに一致させる。
 * フェーズ1（motivation）とフェーズ2（execution）は、ノードと辺をこのモジュールから参照し、
 * 個別にグラフを再定義しない。距離層のようなフェーズ固有の付加情報は各フェーズ側に置く。
 */
export const bfsGraphNodes: readonly { id: string; x: number; y: number }[] = [
  { id: "A", x: 70, y: 150 }, { id: "B", x: 220, y: 80 }, { id: "C", x: 220, y: 230 },
  { id: "D", x: 380, y: 80 }, { id: "E", x: 380, y: 230 }, { id: "F", x: 530, y: 150 },
];

// 無向辺。この順で隣接点を確認すると B→C、D→E の順に初発見する（フェーズ2の実行順）。
export const bfsGraphEdges: readonly { id: string; from: string; to: string }[] = [
  { id: "ab", from: "A", to: "B" }, { id: "ac", from: "A", to: "C" },
  { id: "bd", from: "B", to: "D" }, { id: "be", from: "B", to: "E" },
  { id: "ce", from: "C", to: "E" }, { id: "df", from: "D", to: "F" }, { id: "ef", from: "E", to: "F" },
];

/** プレイヤーのグラフキャンバス形式に合わせた共有グラフ。 */
export const bfsGraph: GraphCanvasState["data"] = {
  kind: "graph",
  nodes: bfsGraphNodes.map((node) => ({ ...node, label: node.id })),
  edges: [...bfsGraphEdges],
  layers: [],
};
