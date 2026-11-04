import { defineLearningContent } from "../content.types";
import { validateGraphCanvas, type GraphCanvasState } from "../graphCanvas.types";
import type { PlayerStatus } from "../player.tokens";

const graph: GraphCanvasState["data"] = {
  kind: "graph",
  nodes: [
    { id: "A", label: "A", x: 300, y: 70 },
    { id: "B", label: "B", x: 210, y: 220 },
    { id: "C", label: "C", x: 390, y: 220 },
  ],
  edges: [{ id: "ab", from: "A", to: "B" }, { id: "ac", from: "A", to: "C" }],
  layers: [
    { id: "near", label: "0 歩", y: 15, height: 100, tone: "layer0" },
    { id: "next", label: "1 歩", y: 165, height: 100, tone: "layer1" },
  ],
};

function canvas(
  statuses: readonly [PlayerStatus, PlayerStatus, PlayerStatus],
  queue: readonly string[],
  current: string | null,
  highlights: GraphCanvasState["highlights"] = [],
  queueLabel = "キュー",
): GraphCanvasState {
  return {
    data: graph,
    state: {
      nodes: graph.nodes.map((node, i) => ({
        id: node.id, status: statuses[i], layerId: i === 0 ? "near" : "next",
      })),
      structures: [{
        id: "queue", kind: "queue", label: queueLabel,
        items: queue.map((id) => ({ id: `queue-${id}`, value: id, nodeId: id, status: "queued" })),
      }],
      variables: [{ name: "現在", value: current }],
    },
    highlights,
  };
}

// 形式・同期の確認用。実際の BFS 教材は #70 で制作する。
export const stepPreviewContent = defineLearningContent<GraphCanvasState>({
  version: 1, kind: "step-sequence", id: "step-demo", phase: 2, intervalMs: 1600,
  steps: [
    {
      id: "enqueue-a", caption: "A を待ち行列に追加します。",
      canvas: canvas(["queued", "idle", "idle"], ["A"], null, [
        { kind: "node", id: "A", tone: "queued" }, { kind: "item", id: "queue-A", tone: "queued" },
      ], "待ち行列（キュー）"),
    },
    {
      id: "take-a", caption: "キューから A を取り出します。",
      canvas: canvas(["processing", "idle", "idle"], [], "A", [{ kind: "node", id: "A", tone: "processing" }]),
    },
    {
      id: "enqueue-b", caption: "A とつながる B をキューに追加します。",
      canvas: canvas(["processing", "queued", "idle"], ["B"], "A", [
        { kind: "node", id: "B", tone: "queued" }, { kind: "edge", id: "ab", tone: "queued" },
        { kind: "item", id: "queue-B", tone: "queued" },
      ]),
    },
    {
      id: "enqueue-c", caption: "A とつながる C をキューの末尾に追加します。",
      canvas: canvas(["processing", "queued", "queued"], ["B", "C"], "A", [
        { kind: "node", id: "C", tone: "queued" }, { kind: "edge", id: "ac", tone: "queued" },
        { kind: "item", id: "queue-C", tone: "queued" },
      ]),
    },
    {
      id: "finish-a", caption: "A の処理を完了します。",
      canvas: canvas(["completed", "queued", "queued"], ["B", "C"], null),
    },
    {
      id: "take-b", caption: "キューの先頭から B を取り出します。",
      canvas: canvas(["completed", "processing", "queued"], ["C"], "B", [{ kind: "node", id: "B", tone: "processing" }]),
    },
    {
      id: "finish-b", caption: "B の処理を完了します。",
      canvas: canvas(["completed", "completed", "queued"], ["C"], null),
    },
    {
      id: "take-c", caption: "キューの先頭から C を取り出します。",
      canvas: canvas(["completed", "completed", "processing"], [], "C", [{ kind: "node", id: "C", tone: "processing" }]),
    },
    {
      id: "finish-c", caption: "C の処理を完了します。",
      canvas: canvas(["completed", "completed", "completed"], [], null),
    },
  ],
}, validateGraphCanvas);

// フェーズ1の「場面列」も同じ形式。教材の完成版やフェーズ遷移は含まない。
export const scenePreviewContent = defineLearningContent<GraphCanvasState>({
  version: 1, kind: "step-sequence", id: "scene-demo", phase: 1, intervalMs: 2200,
  steps: [
    {
      id: "question", caption: "A から C へは、どのつながりをたどれば着くでしょう？",
      canvas: {
        data: { ...graph, layers: [] },
        state: { nodes: graph.nodes.map(({ id }) => ({ id, status: "idle" })), structures: [], variables: [] },
        highlights: [],
      },
    },
    {
      id: "entrance", caption: "まずは A から直接つながる場所を調べます。",
      canvas: {
        data: { ...graph, layers: [] },
        state: { nodes: graph.nodes.map(({ id }) => ({ id, status: "idle" })), structures: [], variables: [] },
        highlights: [
          { kind: "node", id: "B", tone: "processing" }, { kind: "node", id: "C", tone: "processing" },
          { kind: "edge", id: "ab", tone: "processing" }, { kind: "edge", id: "ac", tone: "processing" },
        ],
      },
    },
  ],
}, validateGraphCanvas);
