import type { GraphCanvasState } from "../player/graphCanvas.types";

/** #69 の格子と同じ接続。#70 以降でも同じ ID・配置・辺を再利用するため分離。 */
export const bfsGraph: GraphCanvasState["data"] = {
  kind: "graph",
  nodes: [
    { id: "A", label: "A", x: 70, y: 150 },
    { id: "B", label: "B", x: 220, y: 80 },
    { id: "C", label: "C", x: 220, y: 230 },
    { id: "D", label: "D", x: 380, y: 230 },
    { id: "E", label: "E", x: 380, y: 80 },
    { id: "F", label: "F", x: 530, y: 80 },
  ],
  edges: [
    { id: "ab", from: "A", to: "B" }, { id: "ac", from: "A", to: "C" },
    { id: "bd", from: "B", to: "D" }, { id: "cd", from: "C", to: "D" },
    { id: "be", from: "B", to: "E" }, { id: "ef", from: "E", to: "F" },
  ],
  layers: [],
};
