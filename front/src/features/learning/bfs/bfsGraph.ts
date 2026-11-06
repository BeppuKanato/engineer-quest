import type { GraphCanvasState } from "../player/graphCanvas.types";

/** 導入の格子配置もBFS・DFSで共有する（上段A B D／下段C E F）。 */
export const bfsMaze = {
  rows: 2, columns: 3,
  places: [
    { id: "A", row: 0, column: 0 }, { id: "B", row: 0, column: 1 }, { id: "D", row: 0, column: 2 },
    { id: "C", row: 1, column: 0 }, { id: "E", row: 1, column: 1 }, { id: "F", row: 1, column: 2 },
  ],
} as const;

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

/** 正本グラフの上で幅優先に距離を計算する。到達図のような静的表示が、距離を二重に持たないための導出。 */
export function bfsDistancesFrom(startId: string): ReadonlyMap<string, number> {
  const distances = new Map<string, number>([[startId, 0]]);
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of bfsGraphEdges) {
      const next = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (next !== null && !distances.has(next)) {
        distances.set(next, distances.get(current)! + 1);
        queue.push(next);
      }
    }
  }
  return distances;
}

/** プレイヤーのグラフキャンバス形式に合わせた共有グラフ。 */
export const bfsGraph: GraphCanvasState["data"] = {
  kind: "graph",
  nodes: bfsGraphNodes.map((node) => ({ ...node, label: node.id })),
  edges: [...bfsGraphEdges],
  layers: [],
};
