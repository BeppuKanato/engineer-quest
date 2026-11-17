import type { GraphCanvasState } from "../../player/graphCanvas.types";
import { searchGraph } from "../../graphs/searchGraph";

export type ConsolidationGraph = GraphCanvasState["data"];
export const transferGraph: ConsolidationGraph = {
  kind: "graph",
  nodes: searchGraph.nodes.map((node, index) => ({ ...node, id: "GHIJKL"[index], label: "GHIJKL"[index] })),
  edges: [
    { id: "gh", from: "G", to: "H" }, { id: "gi", from: "G", to: "I" },
    { id: "hj", from: "H", to: "J" }, { id: "ij", from: "I", to: "J" },
    { id: "ik", from: "I", to: "K" }, { id: "jl", from: "J", to: "L" }, { id: "kl", from: "K", to: "L" },
  ],
  layers: [],
};
export const isolatedGraph: ConsolidationGraph = {
  ...searchGraph,
  nodes: [...searchGraph.nodes, { id: "Z", label: "Z", x: 530, y: 330 }],
};
/** フェーズ7の判定用テストJ3と同じ形: Bへはたどり着けるが、Bの隣の情報は登録されていない。 */
export const missingAdjacencyGraph: ConsolidationGraph = {
  kind: "graph",
  nodes: searchGraph.nodes.filter(node => node.id === "A" || node.id === "B"),
  edges: [{ id: "ab", from: "A", to: "B" }],
  layers: [],
};
/** フェーズ7の判定用テストJ2と同じ形: 出発点だけで、隣が1つもない。 */
export const startOnlyGraph: ConsolidationGraph = {
  kind: "graph",
  nodes: searchGraph.nodes.filter(node => node.id === "A"),
  edges: [],
  layers: [],
};
