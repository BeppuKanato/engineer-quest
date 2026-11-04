import { defineLearningContent } from "../../player/content.types";
import { bfsExecutionGraph } from "./bfsExecutionGraph";
import { validateBfsExecutionCanvas, type BfsExecutionCanvasState, type BfsExecutionContent, type BfsOperation } from "./execution.types";

const discoveries: Readonly<Record<string, { distance: number; parent: string | null }>> = {
  A: { distance: 0, parent: null }, B: { distance: 1, parent: "A" }, C: { distance: 1, parent: "A" },
  D: { distance: 2, parent: "B" }, E: { distance: 2, parent: "B" }, F: { distance: 3, parent: "D" },
};

/** 明示した各コマの完全状態を組み立てるだけで、前コマの処理や再生順には依存しない。 */
function snapshot(operation: BfsOperation, current: string | null, queue: readonly string[], completed: readonly string[], activeDistance: number | null): BfsExecutionCanvasState {
  const highlights: BfsExecutionCanvasState["highlights"][number][] = [{ kind: "node", id: operation.nodeId }];
  if (operation.kind === "initialize" || operation.kind === "discover") highlights.push({ kind: "queue-item", id: operation.nodeId });
  if (operation.kind === "discover" || operation.kind === "skip-discovered") highlights.push({ kind: "edge", id: operation.edgeId, style: operation.kind === "discover" ? "solid" : "dashed" });
  return {
    data: { kind: "bfs-execution", graph: bfsExecutionGraph, start: "A" },
    state: {
      operation, current, activeDistance, queueLabel: operation.kind === "initialize" ? "待ち行列（キュー）" : "キュー",
      queue: queue.map(nodeId => ({ nodeId, distance: discoveries[nodeId].distance })),
      nodes: bfsExecutionGraph.nodes.map(({ id }) => {
        const status = current === id ? "processing" : completed.includes(id) ? "completed" : queue.includes(id) ? "queued" : "idle";
        return { id, status, distance: status === "idle" ? null : discoveries[id].distance, parent: status === "idle" ? null : discoveries[id].parent };
      }),
    }, highlights,
  };
}

export const bfsExecutionContent: BfsExecutionContent = defineLearningContent<BfsExecutionCanvasState>({
  version: 1, kind: "step-sequence", id: "bfs-execution", phase: 2, intervalMs: 3500,
  steps: [
    { id: "enqueue-start", caption: "出発点Aを、待ち行列の先頭に入れます。", canvas: snapshot({ kind: "initialize", nodeId: "A" }, null, ["A"], [], 0) },
    { id: "dequeue-a", caption: "待ち行列の先頭から、Aを取り出します。", canvas: snapshot({ kind: "dequeue", nodeId: "A" }, "A", [], [], 0) },
    { id: "discover-b", caption: "Aの隣のBを、1歩先の場所として行列の末尾に追加します。", canvas: snapshot({ kind: "discover", from: "A", nodeId: "B", edgeId: "ab" }, "A", ["B"], [], 0) },
    { id: "discover-c", caption: "もう一つの隣Cも、1歩先の場所として末尾に追加します。", canvas: snapshot({ kind: "discover", from: "A", nodeId: "C", edgeId: "ac" }, "A", ["B", "C"], [], 0) },
    { id: "complete-a", caption: "Aの隣を調べ終えました。", canvas: snapshot({ kind: "complete", nodeId: "A" }, null, ["B", "C"], ["A"], 0) },
    { id: "dequeue-b", caption: "先に並んだBを、行列の先頭から取り出します。", canvas: snapshot({ kind: "dequeue", nodeId: "B" }, "B", ["C"], ["A"], 1) },
    { id: "discover-d", caption: "Bの隣のDを、Aから2歩先の場所として末尾に追加します。", canvas: snapshot({ kind: "discover", from: "B", nodeId: "D", edgeId: "bd" }, "B", ["C", "D"], ["A"], 1) },
    { id: "discover-e", caption: "Bのもう一つの隣Eも、2歩先の場所として末尾に追加します。", canvas: snapshot({ kind: "discover", from: "B", nodeId: "E", edgeId: "be" }, "B", ["C", "D", "E"], ["A"], 1) },
    { id: "complete-b", caption: "Bの隣を調べ終えました。", canvas: snapshot({ kind: "complete", nodeId: "B" }, null, ["C", "D", "E"], ["A", "B"], 1) },
    { id: "dequeue-c", caption: "2歩先のDより先に、まだ残っている1歩先のCを取り出します。", canvas: snapshot({ kind: "dequeue", nodeId: "C" }, "C", ["D", "E"], ["A", "B"], 1) },
    { id: "skip-e", caption: "Cの隣のEはすでに行列にあるので、重ねて追加しません。", canvas: snapshot({ kind: "skip-discovered", from: "C", nodeId: "E", edgeId: "ce" }, "C", ["D", "E"], ["A", "B"], 1) },
    { id: "complete-c", caption: "Cの隣を調べ終えました。", canvas: snapshot({ kind: "complete", nodeId: "C" }, null, ["D", "E"], ["A", "B", "C"], 1) },
    { id: "dequeue-d", caption: "次は、2歩先のDを行列の先頭から取り出します。", canvas: snapshot({ kind: "dequeue", nodeId: "D" }, "D", ["E"], ["A", "B", "C"], 2) },
    { id: "discover-f", caption: "Dの隣のFを、Aから3歩先の場所として末尾に追加します。", canvas: snapshot({ kind: "discover", from: "D", nodeId: "F", edgeId: "df" }, "D", ["E", "F"], ["A", "B", "C"], 2) },
    { id: "complete-d", caption: "Dの隣を調べ終えました。", canvas: snapshot({ kind: "complete", nodeId: "D" }, null, ["E", "F"], ["A", "B", "C", "D"], 2) },
    { id: "dequeue-e", caption: "3歩先のFより先に、まだ残っている2歩先のEを取り出します。", canvas: snapshot({ kind: "dequeue", nodeId: "E" }, "E", ["F"], ["A", "B", "C", "D"], 2) },
    { id: "complete-e", caption: "Eの隣を調べ終えました。", canvas: snapshot({ kind: "complete", nodeId: "E" }, null, ["F"], ["A", "B", "C", "D", "E"], 2) },
    { id: "dequeue-f", caption: "最後に、3歩先のFを行列の先頭から取り出します。", canvas: snapshot({ kind: "dequeue", nodeId: "F" }, "F", [], ["A", "B", "C", "D", "E"], 3) },
    { id: "complete-all", caption: "Aから近い順に、すべての場所を調べ終えました。", canvas: snapshot({ kind: "complete", nodeId: "F" }, null, [], ["A", "B", "C", "D", "E", "F"], null) },
  ],
}, validateBfsExecutionCanvas);
