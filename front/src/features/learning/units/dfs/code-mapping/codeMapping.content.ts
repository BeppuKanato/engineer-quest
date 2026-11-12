import type { LearningStep } from "../../../player/content.types";
import { searchGraphAdjacency, searchGraphNodes } from "../../../graphs/searchGraph";
import { dfsExecutionContent } from "../execution/execution.content";
import { dfsCode, type DfsCodeLineId } from "./dfsCode";
import { defineDfsCodeMappingContent, executionStep, type DfsCodeMappingCanvasState, type DfsCodeVariables } from "./codeMapping.types";

function frames(): [LearningStep<DfsCodeMappingCanvasState>, ...LearningStep<DfsCodeMappingCanvasState>[]] {
  const result: LearningStep<DfsCodeMappingCanvasState>[] = [];
  let reference = "push-start-a";
  let variables: DfsCodeVariables = { start: "A", node: null, neighbor: null, visited: null, stack: null, order: null };
  let neighborActive = false;
  const add = (id: string, lineId: DfsCodeLineId, caption: string, captionKind: DfsCodeMappingCanvasState["state"]["captionKind"], frameKind: "code" | "execution" = "code") => {
    result.push({ id, caption, canvas: {
      data: { kind: "dfs-code-mapping", code: dfsCode },
      state: { executionStepId: reference, execution: executionStep(reference).canvas, variables, neighborActive, captionKind, frameKind },
      highlights: [{ kind: "code-line", id: lineId }],
    } });
  };
  const checkpoint = (id: string, lineId: DfsCodeLineId, kind: DfsCodeMappingCanvasState["state"]["captionKind"], caption = executionStep(id).caption) => {
    reference = id;
    add(`execution-${id}`, lineId, caption, kind, "execution");
  };
  add("define-function", "define-function", "Aを出発点として、訪れた順を返すdfs_orderを用意します。", "assignment");
  variables = { ...variables, visited: ["A"] };
  add("initialize-visited", "initialize-visited", "出発点Aを、先に発見済みのvisitedへ記録します。", "assignment");
  variables = { ...variables, order: [] };
  add("initialize-order", "initialize-order", "訪れた順を残すorderを空にします。", "assignment");
  variables = { ...variables, stack: ["A"] };
  checkpoint("push-start-a", "initialize-stack", "structure");

  // 訪問順・追加・チェックポイントは既存の実行教材から選ぶ。別グラフや別の探索順は作らない。
  for (const step of dfsExecutionContent.steps) {
    if (step.canvas.state.operation.kind !== "pop") continue;
    const node = step.canvas.state.operation.nodeId;
    const key = node.toLowerCase();
    neighborActive = false;
    add(`while-${key}`, "while-stack", `スタックに${variables.stack!.join("、")}が残っているので、取り出す処理を続けます。`, "evaluation");
    if (variables.stack!.at(-1) !== node) throw new Error("DFS pop order disagrees with the execution lesson");
    variables = { ...variables, node, stack: variables.stack!.slice(0, -1) };
    reference = step.id;
    add(`pop-node-${key}`, "pop-node", step.caption, "structure");
    variables = { ...variables, order: [...variables.order!, node] };
    checkpoint(step.id, "append-order", "assignment", `${node}を訪問順のorderの末尾へ記録します。`);
    for (const neighbor of [...searchGraphAdjacency[node]].reverse()) {
      const pair = `${key}-${neighbor.toLowerCase()}`;
      variables = { ...variables, neighbor };
      neighborActive = true;
      const reason = node === "A" ? "末尾からBを先に取り出せるよう、隣を逆順に見て" : `${node}の隣を逆順に見て`;
      add(`for-${pair}`, "for-neighbor-reversed", `${reason}${neighbor}をneighborへ取り出します。`, "structure");
      if (variables.visited!.includes(neighbor)) {
        const skip = dfsExecutionContent.steps.find(candidate => {
          const operation = candidate.canvas.state.operation;
          return operation.kind === "skip-visited" && operation.from === node && operation.nodeId === neighbor;
        });
        const caption = variables.stack!.includes(neighbor)
          ? `${neighbor}はスタックへ入れる前に発見済みへ記録したので、重ねて追加しません。`
          : `${neighbor}はすでに発見済みなので、追加する処理を飛ばします。`;
        if (skip) checkpoint(skip.id, "if-unvisited", "evaluation", caption);
        else add(`if-${pair}`, "if-unvisited", caption, "evaluation");
      } else {
        add(`if-${pair}`, "if-unvisited", `${neighbor}が発見済みのvisitedにないので、追加する処理へ進みます。`, "evaluation");
        variables = { ...variables, visited: searchGraphNodes.map(node => node.id).filter(id => variables.visited!.includes(id) || id === neighbor) };
        add(`mark-${pair}`, "mark-visited", `${neighbor}が重ねて入らないよう、スタックへ入れる前にvisitedへ記録します。`, "assignment");
        variables = { ...variables, stack: [...variables.stack!, neighbor] };
        const push = dfsExecutionContent.steps.find(candidate => {
          const operation = candidate.canvas.state.operation;
          return operation.kind === "push" && operation.from === node && operation.nodeId === neighbor;
        });
        if (!push) throw new Error(`Missing DFS push: ${pair}`);
        checkpoint(push.id, "append-stack", "structure");
      }
    }
    neighborActive = false;
    const noAdd = dfsExecutionContent.steps.find(candidate => candidate.canvas.state.operation.kind === "no-add" && candidate.canvas.state.operation.nodeId === node);
    if (noAdd) checkpoint(noAdd.id, "for-neighbor-reversed", "evaluation");
    else add(`for-end-${key}`, "for-neighbor-reversed", `${node}の隣をすべて確認したので、次の取り出しへ戻ります。`, "evaluation");
  }
  checkpoint("finish-all", "while-stack", "evaluation", "スタックが空になったので、すべての取り出しを終えます。");
  add("return-order", "return-order", `訪れた順の${variables.order!.join("、")}をorderとして返します。`, "structure");
  const [first, ...rest] = result;
  if (!first) throw new Error("DFS mapping needs frames");
  return [first, ...rest];
}

export const dfsCodeMappingContent = defineDfsCodeMappingContent({
  version: 1, kind: "step-sequence", id: "dfs-code-mapping", phase: 4, intervalMs: 3500,
  stageName: "動きとコードの対応", steps: frames(),
});
