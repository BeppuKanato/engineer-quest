import type { LearningStep } from "../../player/content.types";
import { bfsExecutionContent } from "../execution/execution.content";
import { bfsCode, bfsCodeLineNumber, type BfsCodeLineId } from "./bfsCode";
import { codeVariables, defineCodeMappingContent, executionStep, type CodeLocals, type CodeMappingCanvasState } from "./codeMapping.types";

/** コード側フレームだけを構成する。BFSの図の状態・キュー・距離を再実装しない。 */
function frames(): [LearningStep<CodeMappingCanvasState>, ...LearningStep<CodeMappingCanvasState>[]] {
  const result: LearningStep<CodeMappingCanvasState>[] = [];
  const graph = bfsExecutionContent.steps[0].canvas.data.graph;
  let reference = "enqueue-start";
  let locals: CodeLocals = { node: null, neighbor: null, distancesReady: false, queueReady: false, pendingDistance: null };
  const add = (id: string, lineId: BfsCodeLineId, caption: string,
    captionKind: CodeMappingCanvasState["state"]["captionKind"], frameKind: "code" | "execution" = "code") => {
    const execution = executionStep(reference).canvas;
    result.push({ id, caption: `${bfsCodeLineNumber(lineId)}行目：${caption}`, canvas: {
      data: { kind: "bfs-code-mapping", code: bfsCode },
      state: { executionStepId: reference, execution, frameKind, captionKind, locals, variables: codeVariables(execution, locals) },
      highlights: [{ kind: "code-line", id: lineId }],
    } });
  };
  const checkpoint = (id: string, lineId: BfsCodeLineId, kind: CodeMappingCanvasState["state"]["captionKind"]) => {
    reference = id;
    add(`execution-${id}`, lineId, executionStep(id).caption, kind, "execution");
  };
  add("import-deque", "import-deque", "先頭から取り出せるdequeを使う準備をします。", "assignment");
  add("define-function", "define-function", "Aを出発点として距離を求めるbfs_distancesを用意します。", "assignment");
  locals = { ...locals, distancesReady: true };
  add("initialize-distances", "initialize-distances", "出発点Aの距離を0としてdistancesに記録します。", "assignment");
  locals = { ...locals, queueReady: true };
  checkpoint("enqueue-start", "initialize-queue", "structure");

  // 処理する順序はフェーズ2のdequeueを参照し、別の探索順は生成しない。
  for (const step of bfsExecutionContent.steps) {
    const operation = step.canvas.state.operation;
    if (operation.kind !== "dequeue") continue;
    const node = operation.nodeId;
    const waiting = executionStep(reference).canvas.state.queue.map(item => item.nodeId);
    add(`while-${node.toLowerCase()}`, "while-queue", `キューに${waiting.join("、")}が残っているので処理を続けます。`, "evaluation");
    locals = { ...locals, node };
    checkpoint(step.id, "dequeue-node", "structure");
    const neighbors = graph.edges.flatMap(edge => edge.from === node ? [edge.to] : edge.to === node ? [edge.from] : []);
    for (const neighbor of neighbors) {
      const pair = `${node.toLowerCase()}-${neighbor.toLowerCase()}`;
      locals = { ...locals, neighbor };
      add(`for-${pair}`, "for-neighbor", `${node}の隣の${neighbor}をneighborに取り出して確認します。`, "structure");
      const current = executionStep(reference).canvas;
      const distance = current.state.nodes.find(value => value.id === neighbor)!.distance;
      if (distance !== null) {
        // フェーズ2が独立表示するC→Eは、同じif行でそのsnapshotへ進む。
        const skip = bfsExecutionContent.steps.find(candidate => {
          const op = candidate.canvas.state.operation;
          return op.kind === "skip-discovered" && op.from === node && op.nodeId === neighbor;
        });
        if (skip) checkpoint(skip.id, "if-undiscovered", "evaluation");
        else add(`if-${pair}`, "if-undiscovered", `${neighbor}の距離は${distance}歩と記録済みなので、追加の処理を飛ばします。`, "evaluation");
      } else {
        add(`if-${pair}`, "if-undiscovered", `${neighbor}の距離はまだ記録されていないので、新しく距離を求めます。`, "evaluation");
        const sourceDistance = current.state.nodes.find(value => value.id === node)!.distance!;
        locals = { ...locals, pendingDistance: sourceDistance + 1 };
        add(`assign-${pair}`, "assign-distance", `${neighbor}の距離に${node}の${sourceDistance}歩へ1を足した${sourceDistance + 1}を書き込みます。`, "assignment");
        locals = { ...locals, pendingDistance: null };
        const discovery = bfsExecutionContent.steps.find(candidate => {
          const op = candidate.canvas.state.operation;
          return op.kind === "discover" && op.from === node && op.nodeId === neighbor;
        });
        if (!discovery) throw new Error(`Missing discovery: ${pair}`);
        checkpoint(discovery.id, "enqueue-neighbor", "structure");
      }
    }
    const completion = bfsExecutionContent.steps.find(candidate => candidate.canvas.state.operation.kind === "complete" && candidate.canvas.state.operation.nodeId === node);
    if (!completion) throw new Error(`Missing completion: ${node}`);
    checkpoint(completion.id, "for-neighbor", "evaluation");
  }
  add("while-empty", "while-queue", "キューが空になったので、繰り返しを終えます。", "evaluation");
  const finalDistances = executionStep(reference).canvas.state.nodes.map(node => `${node.id}=${node.distance}`).join("、");
  add("return-distances", "return-distances", `Aから各場所までの最短距離${finalDistances}を返します。`, "structure");
  const [first, ...rest] = result;
  if (!first) throw new Error("Code mapping needs a frame");
  return [first, ...rest];
}

export const bfsCodeMappingContent = defineCodeMappingContent({
  version: 1, kind: "step-sequence", id: "bfs-code-mapping", phase: 4, intervalMs: 3500,
  steps: frames(),
});
