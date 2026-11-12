import { searchGraphEdges, searchGraphNodes } from "../../../graphs/searchGraph";
import type { BfsExecutionGraph } from "./execution.types";

/**
 * ノードと辺は共有モジュール（../../graphs/searchGraph）が正本。ここではフェーズ2固有の距離層だけを足す。
 * 層は A からの最短距離で、x / width は 600 幅キャンバス上の帯の位置。
 */
export const bfsExecutionGraph: BfsExecutionGraph = {
  nodes: searchGraphNodes,
  edges: searchGraphEdges,
  layers: [
    { distance: 0, nodeIds: ["A"], x: 0, width: 145 },
    { distance: 1, nodeIds: ["B", "C"], x: 145, width: 155 },
    { distance: 2, nodeIds: ["D", "E"], x: 300, width: 155 },
    { distance: 3, nodeIds: ["F"], x: 455, width: 145 },
  ],
};
