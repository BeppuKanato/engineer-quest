import { defineLearningContent, type LearningContent } from "../../../player/content.types";
import { bfsExecutionContent } from "../execution/execution.content";
import type { BfsExecutionCanvasState } from "../execution/execution.types";
import { bfsCode, type BfsCodeLineId } from "./bfsCode";

export type CodeLocals = {
  readonly node: string | null;
  readonly neighbor: string | null;
  readonly distancesReady: boolean;
  readonly queueReady: boolean;
  /** 代入済み・キュー追加前の1行分だけ、図のチェックポイントより先行する。 */
  readonly pendingDistance: number | null;
};
export type CodeVariables = {
  readonly start: string;
  readonly node: string | null;
  readonly nodeDistance: number | null;
  readonly neighbor: string | null;
  readonly neighborDistance: number | null;
  readonly queue: readonly string[] | null;
  readonly distances: Readonly<Record<string, number>> | null;
};
export type CodeMappingCanvasState = {
  readonly data: { readonly kind: "bfs-code-mapping"; readonly code: typeof bfsCode };
  readonly state: {
    readonly executionStepId: string;
    readonly execution: BfsExecutionCanvasState;
    readonly frameKind: "code" | "execution";
    readonly captionKind: "structure" | "evaluation" | "assignment";
    readonly locals: CodeLocals;
    readonly variables: CodeVariables;
  };
  readonly highlights: readonly [{ readonly kind: "code-line"; readonly id: BfsCodeLineId }];
};
export type CodeMappingContent = LearningContent<CodeMappingCanvasState>;

/** 図は複製せず、既存の完全状態へ直接参照する。 */
export function executionStep(id: string) {
  const step = bfsExecutionContent.steps.find(step => step.id === id);
  if (!step) throw new Error(`Unknown execution step: ${id}`);
  return step;
}

/** スカラー表示は参照図の距離・キューから導出し、Pythonの未代入も区別する。 */
export function codeVariables(execution: BfsExecutionCanvasState, locals: CodeLocals): CodeVariables {
  const distances: Record<string, number> = {};
  if (locals.distancesReady) {
    for (const node of execution.state.nodes) if (node.distance !== null) distances[node.id] = node.distance;
    if (locals.neighbor !== null && locals.pendingDistance !== null) distances[locals.neighbor] = locals.pendingDistance;
  }
  return {
    start: execution.data.start, node: locals.node, neighbor: locals.neighbor,
    nodeDistance: locals.node === null ? null : distances[locals.node] ?? null,
    neighborDistance: locals.neighbor === null ? null : distances[locals.neighbor] ?? null,
    queue: locals.queueReady ? execution.state.queue.map(item => item.nodeId) : null,
    distances: locals.distancesReady ? distances : null,
  };
}

export function validateCodeMappingCanvas(canvas: CodeMappingCanvasState): void {
  const { execution, executionStepId, locals, variables } = canvas.state;
  if (canvas.data.code !== bfsCode || execution !== executionStep(executionStepId).canvas) {
    throw new Error("Code frames must reference the canonical code and execution snapshot");
  }
  const lineId = canvas.highlights[0]?.id;
  if (canvas.highlights.length !== 1 || !bfsCode.lines.some(line => line.id === lineId)) throw new Error("Unknown code line");
  for (const id of [locals.node, locals.neighbor]) {
    if (id !== null && !execution.data.graph.nodes.some(node => node.id === id)) throw new Error("Unknown scalar node");
  }
  if (locals.pendingDistance !== null && (lineId !== "assign-distance" || locals.node === null || locals.neighbor === null ||
    locals.pendingDistance !== execution.state.nodes.find(node => node.id === locals.node)!.distance! + 1 ||
    execution.state.nodes.find(node => node.id === locals.neighbor)!.distance !== null)) {
    throw new Error("Invalid pending distance assignment");
  }
  if (JSON.stringify(variables) !== JSON.stringify(codeVariables(execution, locals))) throw new Error("Code variables / execution mismatch");
}

export function defineCodeMappingContent(content: CodeMappingContent): CodeMappingContent {
  const checked = defineLearningContent(content, validateCodeMappingCanvas);
  const checkpoints = checked.steps.filter(step => step.canvas.state.frameKind === "execution");
  if (checkpoints.map(step => step.canvas.state.executionStepId).join() !== bfsExecutionContent.steps.map(step => step.id).join()) {
    throw new Error("Keep all 19 execution checkpoints in order");
  }
  if (bfsCode.lines.some(line => !checked.steps.some(step => step.canvas.highlights[0].id === line.id))) throw new Error("Unvisited code line");
  return checked;
}
