import type { GraphCanvasState } from "../player/graphCanvas.types";

/** BFS・DFSが対等に使う探索教材の正本。配列順は隣を調べる順序でもあり、並べ替えない。 */
export const searchGraphNodes: readonly { id: string; x: number; y: number }[] = [
  { id: "A", x: 70, y: 150 }, { id: "B", x: 220, y: 80 }, { id: "C", x: 220, y: 230 },
  { id: "D", x: 380, y: 80 }, { id: "E", x: 380, y: 230 }, { id: "F", x: 530, y: 150 },
];
export const searchGraphEdges: readonly { id: string; from: string; to: string }[] = [
  { id: "ab", from: "A", to: "B" }, { id: "ac", from: "A", to: "C" },
  { id: "bd", from: "B", to: "D" }, { id: "be", from: "B", to: "E" },
  { id: "ce", from: "C", to: "E" }, { id: "df", from: "D", to: "F" }, { id: "ef", from: "E", to: "F" },
];
export const searchGraph: GraphCanvasState["data"] = {
  kind: "graph", nodes: searchGraphNodes.map(node => ({ ...node, label: node.id })), edges: [...searchGraphEdges], layers: [],
};
/** 隣接順も同じ辺列から導出し、別の辞書へ接続を複製しない。 */
export const searchGraphAdjacency: Readonly<Record<string, readonly string[]>> = Object.fromEntries(searchGraphNodes.map(node => [node.id,
  searchGraphEdges.flatMap(edge => edge.from === node.id ? [edge.to] : edge.to === node.id ? [edge.from] : []),
]));
/** 導入の具体的な表現も共通。上段A B D／下段C E Fで、全辺が隣接マスに対応する。 */
export const searchMaze = {
  rows: 2, columns: 3,
  places: [
    { id: "A", row: 0, column: 0 }, { id: "B", row: 0, column: 1 }, { id: "D", row: 0, column: 2 },
    { id: "C", row: 1, column: 0 }, { id: "E", row: 1, column: 1 }, { id: "F", row: 1, column: 2 },
  ],
} as const;
