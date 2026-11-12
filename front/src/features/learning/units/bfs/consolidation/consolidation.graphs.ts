import type { GraphCanvasState } from "../../../player/graphCanvas.types";
import { searchGraph } from "../../../graphs/searchGraph";

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
