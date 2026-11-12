import type { LearningContent } from "../../../player/content.types";
import type { PlayerStatus } from "../../../player/player.tokens";
import type { searchGraph } from "../../../graphs/searchGraph";

export type DfsOperation =
  | { readonly kind: "push-start" | "pop" | "no-add"; readonly nodeId: string }
  | { readonly kind: "push" | "skip-visited"; readonly from: string; readonly nodeId: string; readonly edgeId: string }
  | { readonly kind: "finish" };

/** スタックは左（底）→右（末尾）。各コマだけで逆送り・任意シークを復元できる。 */
export type DfsExecutionCanvasState = {
  readonly data: { readonly kind: "dfs-execution"; readonly graph: typeof searchGraph; readonly start: string };
  readonly state: {
    readonly operation: DfsOperation;
    readonly current: string | null;
    readonly stack: readonly string[];
    readonly order: readonly string[];
    readonly completed: readonly string[];
    readonly nodes: readonly { id: string; status: PlayerStatus }[];
  };
  readonly highlights: readonly (
    | { readonly kind: "node" | "stack-item"; readonly id: string }
    | { readonly kind: "edge"; readonly id: string; readonly style: "solid" | "dashed" }
  )[];
};
export type DfsExecutionContent = LearningContent<DfsExecutionCanvasState> & { readonly stageName: "動きの説明" };

export function validateDfsExecutionCanvas(canvas: DfsExecutionCanvasState): void {
  const { graph, start } = canvas.data;
  const { current, stack, order, completed, nodes, operation } = canvas.state;
  const ids = new Set(graph.nodes.map(node => node.id));
  const requireNode = (id: string) => { if (!ids.has(id)) throw new Error(`Unknown DFS node: ${id}`); };
  const uniqueNodes = (values: readonly string[]) => {
    values.forEach(requireNode);
    if (new Set(values).size !== values.length) throw new Error("Repeated DFS node");
  };
  requireNode(start);
  uniqueNodes(stack); uniqueNodes(order); uniqueNodes(completed); uniqueNodes(nodes.map(node => node.id));
  if (nodes.length !== ids.size || ids.size !== graph.nodes.length ||
    stack.some(id => order.includes(id)) || (current !== null && current !== order.at(-1)) ||
    JSON.stringify(completed) !== JSON.stringify(current === null ? order : order.slice(0, -1))) throw new Error("Inconsistent DFS state");
  for (const node of nodes) {
    const expected = node.id === current ? "processing" : stack.includes(node.id) ? "queued" : completed.includes(node.id) ? "completed" : "idle";
    if (node.status !== expected) throw new Error("DFS graph / structure mismatch");
  }
  if (operation.kind === "finish") {
    if (current !== null || stack.length || order.length !== ids.size) throw new Error("Unfinished DFS");
  } else {
    requireNode(operation.nodeId);
    if (operation.kind === "push-start" ? current !== null || order.length !== 0 || stack.length !== 1 || stack[0] !== start || operation.nodeId !== start :
      operation.kind === "push" ? stack.at(-1) !== operation.nodeId || current !== operation.from :
      operation.kind === "skip-visited" ? current !== operation.from || (!stack.includes(operation.nodeId) && !order.includes(operation.nodeId)) :
      current !== operation.nodeId) throw new Error("DFS operation / state mismatch");
    if (operation.kind === "push" || operation.kind === "skip-visited") {
      requireNode(operation.from);
      if (!graph.edges.some(edge => edge.id === operation.edgeId &&
        ((edge.from === operation.from && edge.to === operation.nodeId) || (edge.to === operation.from && edge.from === operation.nodeId)))) throw new Error("DFS operation / edge mismatch");
    }
  }
  for (const item of canvas.highlights) {
    if (item.kind === "edge") {
      if (!graph.edges.some(edge => edge.id === item.id)) throw new Error("Unknown DFS highlighted edge");
    } else {
      requireNode(item.id);
      if (item.kind === "stack-item" && !stack.includes(item.id)) throw new Error("Unknown DFS stack item");
    }
  }
}
