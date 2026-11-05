import type { GraphCanvasState } from "../../player/graphCanvas.types";
import { bfsGraph } from "../bfsGraph";

export type ConsolidationGraph = GraphCanvasState["data"];
export const transferGraph: ConsolidationGraph = {
  kind: "graph",
  nodes: bfsGraph.nodes.map((node, index) => ({ ...node, id: "GHIJKL"[index], label: "GHIJKL"[index] })),
  edges: [
    { id: "gh", from: "G", to: "H" }, { id: "gi", from: "G", to: "I" },
    { id: "hj", from: "H", to: "J" }, { id: "ij", from: "I", to: "J" },
    { id: "ik", from: "I", to: "K" }, { id: "jl", from: "J", to: "L" }, { id: "kl", from: "K", to: "L" },
  ],
  layers: [],
};
export const isolatedGraph: ConsolidationGraph = {
  ...bfsGraph,
  nodes: [...bfsGraph.nodes, { id: "Z", label: "Z", x: 530, y: 330 }],
};
