import type { PythonTraceEvent, PythonTraceResult } from "../../../../../lib/pythonTrace.types";
import { searchGraph } from "../../../graphs/searchGraph";
import { defineLearningContent, type LearningStep } from "../../../player/content.types";
import { dfsExecutionContent, dfsExecutionView } from "../execution/execution.content";
import type { DfsOperation } from "../execution/execution.types";

const ids = new Set(searchGraph.nodes.map(node => node.id));
const lessonOperations = dfsExecutionContent.steps.map(step => step.canvas.state.operation);
// 基本例と同じ粒度で、実行上の根拠がある省略・追加なしだけを取り上げる。
const skipPairs = new Set(lessonOperations.flatMap(op => op.kind === "skip-visited" ? [`${op.from}:${op.nodeId}`] : []));
const noAddNodes = new Set(lessonOperations.flatMap(op => op.kind === "no-add" ? [op.nodeId] : []));

const safeNodes = (value: readonly string[] | null | undefined): value is readonly string[] =>
  Array.isArray(value) && value.length <= ids.size && new Set(value).size === value.length && value.every(id => ids.has(id));
type Values = { stack: readonly string[]; visited: readonly string[]; order: readonly string[] };
type State = Values & { current: string | null };
type TraceCanvas = ReturnType<typeof dfsExecutionView> & {
  readonly operation: DfsOperation | null;
  readonly trace: { line: number | null; variables: PythonTraceEvent["locals"]; terminal: boolean; showGraph: boolean };
};

function readValues({ locals }: PythonTraceEvent): Values | null {
  const { stack, visited, order, node } = locals;
  return safeNodes(stack) && safeNodes(visited) && safeNodes(order) &&
    (node === undefined || (node !== null && ids.has(node))) ? { stack, visited, order } : null;
}

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id, index) => id === b[index]);
const sameValues = (a: Values, b: Values) => sameList(a.stack, b.stack) && sameList(a.visited, b.visited) && sameList(a.order, b.order);
const edgeBetween = (a: string, b: string) => searchGraph.edges.find(edge => (edge.from === a && edge.to === b) || (edge.from === b && edge.to === a));
const finalOnly = "実行の最終結果を表示しています。";
const partialNotice = "図にできない状態の手前まで表示します。";
const limitNotice = "ステップの上限に達したため、途中まで表示します。";

function validateTraceCanvas({ data, state }: TraceCanvas) {
  if (data.graph !== searchGraph || !safeNodes(state.stack) || !safeNodes(state.order) ||
    (state.current !== null && !ids.has(state.current))) throw new Error("Invalid DFS trace canvas");
}

function stepCaption(operation: DfsOperation | null) {
  switch (operation?.kind) {
    case "push-start": return `出発点${operation.nodeId}がスタックに入りました。`;
    case "pop": return `${operation.nodeId}をスタックから取り出しました。`;
    case "push": return `${operation.nodeId}をスタックの末尾に追加しました。`;
    case "skip-visited": return `発見済みの${operation.nodeId}は追加されませんでした。`;
    case "no-add": return `${operation.nodeId}を調べ終え、スタックへの追加はありませんでした。`;
    case "finish": return "実行が終わり、訪問順を返しました。";
    default: return "スタック・発見済み・訪問順の状態を表示しています。";
  }
}

export function convertDfsTrace(trace: PythonTraceResult) {
  const steps: LearningStep<TraceCanvas>[] = [];
  const readings = trace.events.map(event => ({ event, values: readValues(event) }));
  const checkpoint: { value: State | null } = { value: null };
  let round: { node: string; pushed: boolean } | null = null;
  let partial = false;
  const ambiguous = trace.ambiguousKinds?.some(kind => ["stack", "visited", "order"].includes(kind)) ?? trace.ambiguous;

  function emit(state: State, operation: DfsOperation | null, event: PythonTraceEvent | undefined, caption = stepCaption(operation), showGraph = true) {
    steps.push({ id: `dfs-trace-${steps.length}`, caption, canvas: {
      ...dfsExecutionView(operation, state.current, state.stack, state.order),
      operation, trace: { line: event?.line ?? null, variables: event?.locals ?? {}, terminal: false, showGraph },
    } });
    checkpoint.value = state;
  }

  if (!ambiguous) for (const [index, { event, values }] of readings.entries()) {
    if (!values) {
      if (checkpoint.value) { partial = true; break; }
      continue;
    }
    const before = checkpoint.value;
    const removed = before?.stack.filter(id => !values.stack.includes(id)) ?? [];
    const popped = before && removed.length === 1 && before.stack.length === values.stack.length + 1 ? removed[0] : null;
    const current = popped ?? event.locals.node ?? before?.current ?? null;
    const state = { ...values, current };
    const next = readings[index + 1]?.values;
    // pop の直後に訪問順へ記録する場合は一コマにまとめる。
    if (popped && before && next && sameList(before.order, values.order) && sameList(values.stack, next.stack) &&
      sameList([...values.order, popped], next.order)) continue;
    // スタック追加の直前に行われる発見済み記録も、追加のコマにまとめる。
    if (before && next && sameList(before.stack, values.stack) && sameList(before.order, values.order) &&
      !sameList(before.visited, values.visited) && sameList(values.visited, next.visited) &&
      sameList(values.order, next.order) && next.stack.length === values.stack.length + 1) continue;

    if (event.boundary === "while" && round) {
      if (!round.pushed && current === round.node && noAddNodes.has(round.node)) emit(state, { kind: "no-add", nodeId: round.node }, event);
      round = null;
    }

    const last = readings[index - 1];
    const neighbor = last?.event.locals.neighbor;
    if (event.boundary === "for" && last?.event.boundary === "if" && last.values && sameValues(last.values, values) &&
      current && neighbor && values.visited.includes(neighbor) && skipPairs.has(`${current}:${neighbor}`)) {
      const edge = edgeBetween(current, neighbor);
      if (edge) {
        emit(state, { kind: "skip-visited", from: current, nodeId: neighbor, edgeId: edge.id }, last.event);
        continue;
      }
    }

    if (popped) {
      round = { node: popped, pushed: false };
      emit(state, { kind: "pop", nodeId: popped }, event);
    } else if (!before) {
      const starting = current === null && sameList(values.stack, ["A"]) && values.order.length === 0;
      emit(state, starting ? { kind: "push-start", nodeId: "A" } : null, event);
    } else if (!sameValues(before, values) || before.current !== current) {
      const tail = values.stack.at(-1);
      const pushed = tail && sameList(values.stack.slice(0, -1), before.stack);
      if (round && values.stack.some(id => !before.stack.includes(id))) round.pushed = true;
      const edge = pushed && current ? edgeBetween(current, tail) : undefined;
      emit(state, edge && current && tail ? { kind: "push", from: current, nodeId: tail, edgeId: edge.id } : null, event);
    }
  }

  const lastEvent = trace.events.at(-1);
  const order = trace.visitOrder ?? null;
  const mode = steps.length ? "replay" : "final";
  if (mode === "final") {
    const showGraph = safeNodes(order);
    emit({ stack: [], visited: [], order: showGraph ? order : [], current: null }, null,
      ambiguous ? undefined : lastEvent, finalOnly, showGraph);
  } else if (trace.status === "returned" && !partial && safeNodes(order)) {
    const state = checkpoint.value;
    if (state) emit({ ...state, current: null, order }, state.stack.length === 0 ? { kind: "finish" } : null, lastEvent,
      "実行が終わり、訪問順を返しました。");
  }

  const notice = mode === "final" ? "動きを再生できなかったため、取得できた結果と停止位置を表示します。"
    : trace.status === "truncated" ? limitNotice : partial ? partialNotice : null;
  const lastStep = steps[steps.length - 1];
  const errorKind = trace.error?.kind;
  const kind = errorKind && /^[A-Za-z_][A-Za-z_0-9]{0,79}$/u.test(errorKind) ? errorKind : "PythonError";
  const line = trace.error?.line ?? trace.stoppedLine;
  const caption = trace.status === "error" ? `${line ? `${line}行目で` : ""}${kind}が起き、実行が止まりました。`
    : trace.status === "truncated" ? limitNotice
    : partial ? partialNotice
    : trace.status === "returned" && !safeNodes(order) ? "戻り値を基本グラフの訪問順として表示できませんでした。"
    : lastStep.caption;
  steps[steps.length - 1] = { ...lastStep, caption, canvas: { ...lastStep.canvas, trace: {
    ...lastStep.canvas.trace, line: line ?? lastStep.canvas.trace.line, terminal: true,
  } } };

  const content = defineLearningContent({ version: 1, kind: "step-sequence", id: "dfs-own-trace", phase: 7, intervalMs: 3500,
    steps: steps as [LearningStep<TraceCanvas>, ...LearningStep<TraceCanvas>[]] }, validateTraceCanvas);
  return { mode, notice, order, content } as const;
}

export type DfsTracePlayback = ReturnType<typeof convertDfsTrace>;
