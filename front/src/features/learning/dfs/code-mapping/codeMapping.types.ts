import { defineLearningContent, type LearningContent } from "../../player/content.types";
import { getLearningStep } from "../../review/reviewContent";
import { dfsExecutionContent } from "../execution/execution.content";
import type { DfsExecutionCanvasState } from "../execution/execution.types";
import { dfsCode, type DfsCodeLineId } from "./dfsCode";

export type DfsCodeVariables = {
  readonly start: string;
  readonly node: string | null;
  readonly neighbor: string | null;
  readonly visited: readonly string[] | null;
  readonly stack: readonly string[] | null;
  readonly order: readonly string[] | null;
};
export type DfsCodeMappingCanvasState = {
  readonly data: { readonly kind: "dfs-code-mapping"; readonly code: typeof dfsCode };
  readonly state: {
    readonly executionStepId: string;
    readonly execution: DfsExecutionCanvasState;
    readonly frameKind: "code" | "execution";
    readonly captionKind: "structure" | "evaluation" | "assignment";
    readonly variables: DfsCodeVariables;
    /** forの終了判定では前のneighborが残るが、その辺を新しい候補として強調しない。 */
    readonly neighborActive: boolean;
  };
  readonly highlights: readonly [{ readonly kind: "code-line"; readonly id: DfsCodeLineId }];
};
export type DfsCodeMappingContent = LearningContent<DfsCodeMappingCanvasState> & { readonly stageName: "動きとコードの対応" };
export const executionStep = (id: string) => getLearningStep(dfsExecutionContent, id);

export function validateDfsCodeMappingCanvas(canvas: DfsCodeMappingCanvasState): void {
  const { execution, executionStepId, variables, frameKind } = canvas.state;
  if (canvas.data.code !== dfsCode || execution !== executionStep(executionStepId).canvas) throw new Error("Use canonical DFS code and execution references");
  const lineId = canvas.highlights[0]?.id;
  if (canvas.highlights.length !== 1 || !dfsCode.lines.some(line => line.id === lineId)) throw new Error("Unknown DFS code line");
  const ids = execution.data.graph.nodes.map(node => node.id);
  const checkIds = (values: readonly string[]) => {
    if (new Set(values).size !== values.length || values.some(id => !ids.includes(id))) throw new Error("Invalid DFS variable IDs");
  };
  for (const values of [variables.visited, variables.stack, variables.order]) if (values !== null) checkIds(values);
  for (const id of [variables.node, variables.neighbor]) if (id !== null && !ids.includes(id)) throw new Error("Unknown DFS scalar");
  if (variables.start !== execution.data.start || variables.stack?.some(id => variables.order?.includes(id)) ||
    [...variables.stack ?? [], ...variables.order ?? []].some(id => !variables.visited?.includes(id))) throw new Error("Inconsistent DFS variables");
  if (variables.visited !== null && variables.visited.join() !== ids.filter(id => variables.visited!.includes(id)).join()) throw new Error("Display the visited set in canonical node order");
  const pending = variables.visited?.filter(id => !variables.stack?.includes(id) && !variables.order?.includes(id)) ?? [];
  const allowedPending = lineId === "initialize-visited" || lineId === "initialize-order" ? variables.start
    : lineId === "mark-visited" ? variables.neighbor : lineId === "pop-node" ? variables.node : null;
  if (pending.some(id => id !== allowedPending)) throw new Error("Invalid pending discovery");
  if (frameKind === "execution" && (variables.stack?.join() !== execution.state.stack.join() || variables.order?.join() !== execution.state.order.join())) throw new Error("DFS checkpoint / variables mismatch");
}

export function defineDfsCodeMappingContent(content: DfsCodeMappingContent): DfsCodeMappingContent {
  defineLearningContent(content, validateDfsCodeMappingCanvas);
  const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
  if (checkpoints.map(step => step.canvas.state.executionStepId).join() !== dfsExecutionContent.steps.map(step => step.id).join()) throw new Error("Keep all 17 DFS checkpoints in order");
  if (dfsCode.lines.some(line => !content.steps.some(step => step.canvas.highlights[0].id === line.id))) throw new Error("Unvisited DFS code line");
  return content;
}
