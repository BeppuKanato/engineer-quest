import { searchGraph } from "../../graphs/searchGraph";
import { defineLearningContent } from "../../player/content.types";
import { validateDfsExecutionCanvas, type DfsExecutionCanvasState, type DfsExecutionContent, type DfsOperation } from "./execution.types";

/** 前コマへ依存せず、明示した状態だけから図・構造・強調を組み立てる。 */
function snapshot(operation: DfsOperation, current: string | null, stack: readonly string[], order: readonly string[]): DfsExecutionCanvasState {
  const completed = current === null ? order : order.slice(0, -1);
  const highlights: DfsExecutionCanvasState["highlights"][number][] = [];
  if (operation.kind !== "finish") highlights.push({ kind: "node", id: operation.nodeId });
  if (operation.kind === "push-start" || operation.kind === "push") highlights.push({ kind: "stack-item", id: operation.nodeId });
  if (operation.kind === "push" || operation.kind === "skip-visited") highlights.push({ kind: "edge", id: operation.edgeId, style: operation.kind === "push" ? "solid" : "dashed" });
  if (operation.kind === "no-add") {
    for (const edge of searchGraph.edges.filter(edge => edge.from === current || edge.to === current)) {
      highlights.push({ kind: "edge", id: edge.id, style: "dashed" });
      const neighbor = edge.from === current ? edge.to : edge.from;
      if (stack.includes(neighbor)) highlights.push({ kind: "stack-item", id: neighbor });
    }
  }
  return {
    data: { kind: "dfs-execution", graph: searchGraph, start: "A" },
    state: { operation, current, stack, order, completed, nodes: searchGraph.nodes.map(({ id }) => ({ id,
      status: current === id ? "processing" : stack.includes(id) ? "queued" : completed.includes(id) ? "completed" : "idle",
    })) }, highlights,
  };
}

export const dfsExecutionContent: DfsExecutionContent = {
  ...defineLearningContent<DfsExecutionCanvasState>({
    version: 1, kind: "step-sequence", id: "dfs-execution", phase: 2, intervalMs: 3500,
    steps: [
      { id: "push-start-a", caption: "出発点Aを、スタックの末尾に入れます。", canvas: snapshot({ kind: "push-start", nodeId: "A" }, null, ["A"], []) },
      { id: "pop-a", caption: "スタックの末尾から、Aを取り出します。", canvas: snapshot({ kind: "pop", nodeId: "A" }, "A", [], ["A"]) },
      { id: "push-c-from-a", caption: "Aの隣のCを、後で調べるためにスタックの末尾に追加します。", canvas: snapshot({ kind: "push", from: "A", nodeId: "C", edgeId: "ac" }, "A", ["C"], ["A"]) },
      { id: "push-b-from-a", caption: "もう一つの隣Bも、末尾に追加します。", canvas: snapshot({ kind: "push", from: "A", nodeId: "B", edgeId: "ab" }, "A", ["C", "B"], ["A"]) },
      { id: "pop-b", caption: "末尾のBを取り出します。", canvas: snapshot({ kind: "pop", nodeId: "B" }, "B", ["C"], ["A", "B"]) },
      { id: "push-e-from-b", caption: "Bの隣のEを、後で調べるために末尾に追加します。", canvas: snapshot({ kind: "push", from: "B", nodeId: "E", edgeId: "be" }, "B", ["C", "E"], ["A", "B"]) },
      { id: "push-d-from-b", caption: "もう一つの隣Dも、末尾に追加します。", canvas: snapshot({ kind: "push", from: "B", nodeId: "D", edgeId: "bd" }, "B", ["C", "E", "D"], ["A", "B"]) },
      { id: "skip-a-from-b", caption: "Bの隣のAは、すでに調べ終えているので追加しません。", canvas: snapshot({ kind: "skip-visited", from: "B", nodeId: "A", edgeId: "ab" }, "B", ["C", "E", "D"], ["A", "B"]) },
      { id: "pop-d", caption: "末尾のDを取り出します。", canvas: snapshot({ kind: "pop", nodeId: "D" }, "D", ["C", "E"], ["A", "B", "D"]) },
      { id: "push-f-from-d", caption: "Dの隣のFを、末尾に追加します。", canvas: snapshot({ kind: "push", from: "D", nodeId: "F", edgeId: "df" }, "D", ["C", "E", "F"], ["A", "B", "D"]) },
      { id: "skip-b-from-d", caption: "Dの隣のBは、すでに調べ終えているので追加しません。", canvas: snapshot({ kind: "skip-visited", from: "D", nodeId: "B", edgeId: "bd" }, "D", ["C", "E", "F"], ["A", "B", "D"]) },
      { id: "pop-f", caption: "末尾のFを取り出します。", canvas: snapshot({ kind: "pop", nodeId: "F" }, "F", ["C", "E"], ["A", "B", "D", "F"]) },
      { id: "dead-end-f", caption: "Fの隣のDは調べ終えていて、Eはすでにスタックにあるので、新しく追加するものはありません。", canvas: snapshot({ kind: "no-add", nodeId: "F" }, "F", ["C", "E"], ["A", "B", "D", "F"]) },
      { id: "pop-e", caption: "次は、スタックに残っていたEを取り出します。", canvas: snapshot({ kind: "pop", nodeId: "E" }, "E", ["C"], ["A", "B", "D", "F", "E"]) },
      { id: "no-add-from-e", caption: "Eの隣は、どれもすでに調べ終えているかスタックにあるので、新しく追加しません。", canvas: snapshot({ kind: "no-add", nodeId: "E" }, "E", ["C"], ["A", "B", "D", "F", "E"]) },
      { id: "pop-c", caption: "最後に残ったCを取り出します。", canvas: snapshot({ kind: "pop", nodeId: "C" }, "C", [], ["A", "B", "D", "F", "E", "C"]) },
      { id: "finish-all", caption: "すべての場所を、1本の道を奥まで進みながら調べ終えました。", canvas: snapshot({ kind: "finish" }, null, [], ["A", "B", "D", "F", "E", "C"]) },
    ],
  }, validateDfsExecutionCanvas),
  stageName: "動きの説明",
};
