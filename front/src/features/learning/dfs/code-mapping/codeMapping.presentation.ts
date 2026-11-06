import type { DfsExecutionView } from "../execution/DfsExecutionCanvas";
import type { DfsCodeMappingCanvasState, DfsCodeVariables } from "./codeMapping.types";

const scalar = (value: string | null) => value === null ? "—" : `'${value}'`;
const list = (value: readonly string[] | null) => value === null ? "—" : `[${value.map(scalar).join(", ")}]`;

/** visitedは順序のない集合。表示順のみ基準ノード順に固定し、訪問順orderと区別する。 */
export function codeVariableRows(variables: DfsCodeVariables, previous?: DfsCodeVariables) {
  const values = (entry: DfsCodeVariables) => [
    { name: "start", value: scalar(entry.start) },
    { name: "node", value: scalar(entry.node) },
    { name: "neighbor", value: scalar(entry.neighbor) },
    { name: "stack", value: list(entry.stack) },
    { name: "visited", value: entry.visited === null ? "—" : entry.visited.length ? `{${entry.visited.map(scalar).join(", ")}}` : "set()" },
    { name: "order", value: list(entry.order) },
  ];
  const before = previous && values(previous);
  return values(variables).map((row, index) => ({ ...row, changed: row.value !== (before?.[index].value ?? "—") }));
}

/** 取り出しとorderへの記録の間も、図を未来の値にせず実変数から投影する。正本は変更しない。 */
export function codeExecutionView(canvas: DfsCodeMappingCanvasState): DfsExecutionView {
  const { execution, variables, neighborActive } = canvas.state;
  const line = canvas.highlights[0].id;
  const stack = variables.stack ?? [], order = variables.order ?? [];
  const current = execution.state.current;
  const completed = execution.state.completed.filter(id => order.includes(id));
  const nodes = execution.data.graph.nodes.map(({ id }) => ({ id,
    status: current === id ? "processing" as const : stack.includes(id) ? "queued" as const : completed.includes(id) ? "completed" as const : "idle" as const,
  }));
  const highlights: DfsExecutionView["highlights"][number][] = [];
  const nodeId = neighborActive ? variables.neighbor : line === "initialize-visited" || line === "initialize-stack" ? variables.start : current;
  if (nodeId !== null) highlights.push({ kind: "node", id: nodeId });
  if (line === "initialize-stack" || line === "append-stack") {
    if (nodeId !== null && stack.includes(nodeId)) highlights.push({ kind: "stack-item", id: nodeId });
  }
  if (neighborActive && variables.node !== null && variables.neighbor !== null) {
    const edge = execution.data.graph.edges.find(edge => (edge.from === variables.node && edge.to === variables.neighbor) || (edge.to === variables.node && edge.from === variables.neighbor));
    if (edge) highlights.push({ kind: "edge", id: edge.id, style: line === "if-unvisited" && variables.visited?.includes(variables.neighbor) ? "dashed" : "solid" });
  } else if (canvas.state.frameKind === "execution" && execution.state.operation.kind === "no-add") {
    highlights.push(...execution.highlights.filter(item => item.kind === "edge" || item.kind === "stack-item"));
  }
  return { state: { current, stack, order, nodes }, highlights };
}
