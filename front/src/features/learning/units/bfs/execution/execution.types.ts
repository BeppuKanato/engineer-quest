import type { LearningContent } from "../../../player/content.types";
import type { PlayerStatus } from "../../../player/player.tokens";

export type BfsExecutionGraph = {
  readonly nodes: readonly { id: string; x: number; y: number }[];
  readonly edges: readonly { id: string; from: string; to: string }[];
  readonly layers: readonly { distance: number; nodeIds: readonly string[]; x: number; width: number }[];
};

/** 行番号ではなく意味で識別し、フェーズ4でコード側の対応表を追加できる。 */
export type BfsOperation =
  | { readonly kind: "initialize" | "dequeue" | "complete"; readonly nodeId: string }
  | { readonly kind: "discover" | "skip-discovered"; readonly nodeId: string; readonly from: string; readonly edgeId: string };

/**
 * 正本: 教材指針 §1・フェーズ2〜4。1文と同じ時点の完全な実行状態を保存する。
 * queue は先頭→末尾順、distance=null は未発見、parent は最初に発見した隣接点。
 * 図・キュー・層・強調を差分にせず、逆送り／任意シーク／復習でも単独復元できる。
 * フェーズ3は step.id と canvas を直接参照し、フェーズ4は operation と安定IDへ
 * コード対応を付加する。表示順や画面の状態からアルゴリズムを逆算しない。
 */
export type BfsExecutionCanvasState = {
  readonly data: { readonly kind: "bfs-execution"; readonly graph: BfsExecutionGraph; readonly start: string };
  readonly state: {
    readonly operation: BfsOperation;
    readonly current: string | null;
    readonly queue: readonly { nodeId: string; distance: number }[];
    readonly nodes: readonly { id: string; status: PlayerStatus; distance: number | null; parent: string | null }[];
    readonly activeDistance: number | null;
    readonly queueLabel: "待ち行列（キュー）" | "キュー";
  };
  readonly highlights: readonly (
    | { kind: "node" | "queue-item"; id: string }
    | { kind: "edge"; id: string; style: "solid" | "dashed" }
  )[];
};

export type BfsExecutionContent = LearningContent<BfsExecutionCanvasState>;

export function validateBfsExecutionCanvas(canvas: BfsExecutionCanvasState): void {
  const { graph, start } = canvas.data;
  const { nodes, queue, current, activeDistance, operation } = canvas.state;
  const ids = new Set(graph.nodes.map(node => node.id));
  const requireNode = (id: string) => {
    if (!ids.has(id)) throw new Error(`Unknown BFS node: ${id}`);
  };
  const validDistance = (distance: number) => Number.isInteger(distance) && distance >= 0;
  requireNode(start);
  if (ids.size !== graph.nodes.length || nodes.length !== ids.size || new Set(nodes.map(node => node.id)).size !== ids.size ||
    new Set(graph.edges.map(edge => edge.id)).size !== graph.edges.length ||
    new Set(graph.layers.map(layer => layer.distance)).size !== graph.layers.length) throw new Error("Duplicate BFS ID");
  graph.nodes.forEach(node => {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) throw new Error("Invalid BFS position");
  });
  graph.edges.forEach(edge => { requireNode(edge.from); requireNode(edge.to); });
  const layeredIds = graph.layers.flatMap(layer => {
    if (!validDistance(layer.distance) || !Number.isFinite(layer.x) || !Number.isFinite(layer.width) || layer.width <= 0) throw new Error("Invalid BFS layer");
    layer.nodeIds.forEach(requireNode);
    return layer.nodeIds;
  });
  if (layeredIds.length !== ids.size || new Set(layeredIds).size !== ids.size) throw new Error("Incomplete BFS layers");
  for (const node of nodes) {
    requireNode(node.id);
    if (node.parent !== null) requireNode(node.parent);
    if (!["idle", "processing", "queued", "completed"].includes(node.status) ||
      (node.distance !== null && !validDistance(node.distance)) ||
      ((node.status === "idle") !== (node.distance === null))) throw new Error("Invalid BFS node state");
    if (node.distance !== null && !graph.layers.some(layer => layer.distance === node.distance && layer.nodeIds.includes(node.id))) throw new Error("Distance / layer mismatch");
    if (node.distance === null ? node.parent !== null : node.id === start ? node.distance !== 0 || node.parent !== null :
      node.parent === null || !graph.edges.some(edge => (edge.from === node.parent && edge.to === node.id) || (edge.to === node.parent && edge.from === node.id))) throw new Error("Invalid BFS parent");
  }
  if (new Set(queue.map(item => item.nodeId)).size !== queue.length) throw new Error("Repeated queue item");
  for (const item of queue) {
    requireNode(item.nodeId);
    const node = nodes.find(node => node.id === item.nodeId)!;
    if (node.status !== "queued" || item.distance !== node.distance) throw new Error("Queue / graph mismatch");
  }
  if (nodes.filter(node => node.status === "queued").length !== queue.length) throw new Error("Missing queue item");
  if (current !== null) requireNode(current);
  if (nodes.filter(node => node.status === "processing").length !== (current === null ? 0 : 1) ||
    (current !== null && nodes.find(node => node.id === current)!.status !== "processing")) throw new Error("Current / graph mismatch");
  if (activeDistance !== null && !graph.layers.some(layer => layer.distance === activeDistance)) throw new Error("Unknown active layer");
  requireNode(operation.nodeId);
  if (operation.kind === "discover" || operation.kind === "skip-discovered") {
    requireNode(operation.from);
    if (!graph.edges.some(edge => edge.id === operation.edgeId &&
      ((edge.from === operation.from && edge.to === operation.nodeId) || (edge.to === operation.from && edge.from === operation.nodeId)))) throw new Error("Operation / edge mismatch");
  }
  for (const highlight of canvas.highlights) {
    if (highlight.kind === "edge") {
      if (!graph.edges.some(edge => edge.id === highlight.id)) throw new Error("Unknown highlighted edge");
    } else {
      requireNode(highlight.id);
      if (highlight.kind === "queue-item" && !queue.some(item => item.nodeId === highlight.id)) throw new Error("Unknown highlighted queue item");
    }
  }
}
