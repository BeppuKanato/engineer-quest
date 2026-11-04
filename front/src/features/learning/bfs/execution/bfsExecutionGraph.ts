import type { BfsExecutionGraph } from "./execution.types";

/** Issue #70 のレビュー済みサンプル。#69 の bfsGraph は変更せず、統一方針は PR で確認する。 */
export const bfsExecutionGraph: BfsExecutionGraph = {
  nodes: [
    { id: "A", x: 70, y: 150 }, { id: "B", x: 220, y: 80 }, { id: "C", x: 220, y: 230 },
    { id: "D", x: 380, y: 80 }, { id: "E", x: 380, y: 230 }, { id: "F", x: 530, y: 150 },
  ],
  // 無向辺。この順で隣接点を確認すると B→C、D→E の順に初発見する。
  edges: [
    { id: "ab", from: "A", to: "B" }, { id: "ac", from: "A", to: "C" },
    { id: "bd", from: "B", to: "D" }, { id: "be", from: "B", to: "E" },
    { id: "ce", from: "C", to: "E" }, { id: "df", from: "D", to: "F" }, { id: "ef", from: "E", to: "F" },
  ],
  layers: [
    { distance: 0, nodeIds: ["A"], x: 0, width: 145 },
    { distance: 1, nodeIds: ["B", "C"], x: 145, width: 155 },
    { distance: 2, nodeIds: ["D", "E"], x: 300, width: 155 },
    { distance: 3, nodeIds: ["F"], x: 455, width: 145 },
  ],
};
