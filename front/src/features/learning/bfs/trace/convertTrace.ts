import type { PythonTraceEvent, PythonTraceResult } from "../../../../lib/pythonTrace.types";
import { defineLearningContent, type LearningStep } from "../../player/content.types";
import { bfsExecutionGraph } from "../execution/bfsExecutionGraph";
import type { BfsOperation } from "../execution/execution.types";
import { bfsTraceText as text } from "./trace.content";
import type { BfsTraceCanvas, BfsTracePlayback } from "./trace.types";

type State = { queue: readonly string[]; distances: Readonly<Record<string, number>>; current: string | null };
const ids = new Set(bfsExecutionGraph.nodes.map(node => node.id));
const same = (left: State, right: State) => left.current === right.current && left.queue.join() === right.queue.join() &&
  Object.keys(left.distances).length === Object.keys(right.distances).length && Object.keys(left.distances).every(id => right.distances[id] === left.distances[id]);
const safeDistances = (value: Readonly<Record<string, number>> | null | undefined) => value !== null && typeof value === "object" &&
  !Array.isArray(value) && Object.entries(value).every(([id, distance]) => ids.has(id) && typeof distance === "number" && Number.isFinite(distance));
const safeQueue = (value: readonly string[] | null | undefined): value is readonly string[] => Array.isArray(value) && value.length <= ids.size &&
  new Set(value).size === value.length && value.every(id => ids.has(id));
const kindName = (kind: string) => /^[A-Za-z_][A-Za-z_0-9]{0,79}$/u.test(kind) ? kind : "PythonError";
const stoppedCaption = (trace: PythonTraceResult) => trace.error?.line ? text.stopped.replace("{line}", String(trace.error.line)).replace("{kind}", kindName(trace.error.kind)) :
  text.stoppedUnknown.replace("{kind}", kindName(trace.error?.kind ?? "PythonError"));

/** 正常解の検証器を適用すると誤った距離を隠すため、ここでは描画可能性だけを確認する。 */
function validateTraceCanvas(canvas: BfsTraceCanvas) {
  if (canvas.state.nodes.length !== ids.size || canvas.state.nodes.some(node => !ids.has(node.id) || (node.distance !== null && !Number.isFinite(node.distance)))) throw new Error("Invalid trace node");
  if (!safeQueue(canvas.state.queue.map(item => item.nodeId))) throw new Error("Invalid trace queue");
}

export function convertBfsTrace(trace: PythonTraceResult): BfsTracePlayback {
  const steps: LearningStep<BfsTraceCanvas>[] = [];
  const parents: Record<string, string | null> = { A: null };
  const checkpoint: { value: State | null } = { value: null };
  let active: string | null = null, lastRawNode: string | null = null;
  let pending: { state: State; event: PythonTraceEvent } | null = null;
  let lastEvent: PythonTraceEvent | null = null;
  let invalidFinal = false;
  function emit(state: State, event: PythonTraceEvent, caption?: string, terminal = false) {
    const old = checkpoint.value;
    const added = state.queue.filter(id => !old?.queue.includes(id));
    const removed = old?.queue.filter(id => !state.queue.includes(id)) ?? [];
    const discovered = Object.keys(state.distances).filter(id => old?.distances[id] !== state.distances[id]);
    for (const id of discovered) if (!(id in parents)) parents[id] = state.current && bfsExecutionGraph.edges.some(edge =>
      (edge.from === state.current && edge.to === id) || (edge.to === state.current && edge.from === id)) ? state.current : null;
    let operation: BfsOperation = { kind: "complete", nodeId: old?.current ?? state.current ?? "A" };
    if (!old) operation = { kind: "initialize", nodeId: "A" };
    else if (state.current && state.current !== old.current) operation = { kind: "dequeue", nodeId: state.current };
    else if (added[0]) {
      const edge = bfsExecutionGraph.edges.find(edge => (edge.from === state.current && edge.to === added[0]) || (edge.to === state.current && edge.from === added[0]));
      operation = state.current && edge ? { kind: "discover", nodeId: added[0], from: state.current, edgeId: edge.id } : { kind: "initialize", nodeId: added[0] };
    }
    const changedId = state.current && state.current !== old?.current ? state.current : added[0] ?? discovered[0] ?? old?.current;
    const frameCaption = caption ?? (!old ? state.queue.includes("A") && state.distances.A !== undefined ? text.initial : text.setup : removed.length ? text.dequeue.replace("{node}", removed.join("・")) : state.current && state.current !== old.current ? text.processing.replace("{node}", state.current) :
      added.length ? text.enqueue.replace("{node}", added.join("・")) : discovered.length ? text.distance.replace("{node}", discovered.join("・")) :
        old.current && state.current === null ? text.complete.replace("{node}", old.current) : text.changed);
    const knownCorrectLayers = Object.entries(state.distances).every(([id, distance]) => bfsExecutionGraph.layers.some(layer => layer.nodeIds.includes(id) && layer.distance === distance));
    const highlights: BfsTraceCanvas["highlights"][number][] = changedId ? [{ kind: "node", id: changedId }] : [];
    if (changedId && added.includes(changedId)) highlights.push({ kind: "queue-item", id: changedId });
    if (operation.kind === "discover") highlights.push({ kind: "edge", id: operation.edgeId, style: "solid" });
    const canvas: BfsTraceCanvas = {
      data: { kind: "bfs-execution", graph: knownCorrectLayers ? bfsExecutionGraph : { ...bfsExecutionGraph, layers: [] }, start: "A" },
      state: {
        operation, current: state.current, queue: state.queue.map(nodeId => ({ nodeId, distance: state.distances[nodeId] })),
        nodes: bfsExecutionGraph.nodes.map(({ id }) => ({ id, distance: state.distances[id] ?? null, parent: parents[id] ?? null,
          status: state.current === id ? "processing" : state.distances[id] === undefined ? "idle" : state.queue.includes(id) ? "queued" : "completed" })),
        activeDistance: state.current ? state.distances[state.current] ?? null : state.queue.length ? old?.current ? state.distances[old.current] ?? null : 0 : null,
        queueLabel: old ? "キュー" : "待ち行列（キュー）",
      },
      highlights,
      trace: { line: event.line || null, variables: event.locals, terminal },
    };
    if (old && same(old, state)) {
      if (caption || terminal) steps[steps.length - 1] = { ...steps[steps.length - 1], caption: frameCaption, canvas };
      return;
    }
    steps.push({ id: `trace-${steps.length}`, caption: frameCaption, canvas }); checkpoint.value = state;
  }
  for (const event of trace.events) {
    lastEvent = event;
    const vars = event.locals;
    if (!safeQueue(vars.queue) || !safeDistances(vars.distances)) { invalidFinal = true; continue; }
    const distances = vars.distances!;
    if (vars.queue.some(id => distances[id] === undefined) || (vars.node !== undefined && vars.node !== null && !ids.has(vars.node))) { invalidFinal = true; continue; }
    invalidFinal = false;
    const rawNode = vars.node ?? null;
    const rawStateChanged = rawNode !== lastRawNode || (checkpoint.value !== null && vars.queue.length < checkpoint.value.queue.length);
    if (rawStateChanged && rawNode) active = rawNode;
    if (event.boundary === "while" && rawStateChanged && active) emit({ queue: vars.queue, distances, current: active }, event);
    if (event.boundary === "while" || (event.event === "return" && trace.status === "returned")) active = null;
    lastRawNode = rawNode;
    const state: State = { queue: vars.queue, distances, current: active };
    if (pending) {
      const pendingIds = Object.keys(pending.state.distances).filter(id => checkpoint.value?.distances[id] === undefined);
      if (!pendingIds.every(id => state.queue.includes(id)) && (event.boundary === "while" || event.event !== "line" || !same(pending.state, state))) emit(pending.state, pending.event);
      else if (same(pending.state, state) && event.boundary !== "while" && event.event === "line") continue;
      pending = null;
    }
    const newlyKnown = Object.keys(distances).filter(id => checkpoint.value?.distances[id] === undefined);
    if (checkpoint.value && state.current === checkpoint.value.current && state.queue.join() === checkpoint.value.queue.join() && newlyKnown.length &&
      newlyKnown.every(id => !state.queue.includes(id)) && event.boundary !== "while" && event.event === "line") {
      pending = { state, event }; continue;
    }
    emit(state, event);
  }
  if (pending) emit(pending.state, pending.event);
  const mode = steps.length && !trace.ambiguous ? "replay" : "final";
  const partial = mode === "replay" && invalidFinal;
  const finalEvent: PythonTraceEvent = lastEvent ?? { line: trace.stoppedLine ?? 0, event: "return", boundary: "line", locals: {} };
  if (mode === "final") {
    steps.length = 0; checkpoint.value = null;
    const value = trace.result ?? finalEvent.locals.distances;
    const distances = Object.fromEntries(Object.entries(value ?? {}).filter(([id, distance]) => ids.has(id) && typeof distance === "number" && Number.isFinite(distance)));
    emit({ queue: [], distances, current: null }, finalEvent, text.final);
  }
  const last = steps[steps.length - 1];
  const caption = trace.status === "error" ? stoppedCaption(trace) : trace.status === "truncated" ? text.truncated : partial ? text.partial : mode === "final" ? text.final : text.ended;
  steps[steps.length - 1] = { ...last, caption, canvas: { ...last.canvas, highlights: mode === "final" ? [] : last.canvas.highlights, trace: { ...last.canvas.trace, line: trace.error?.line ?? (partial ? last.canvas.trace.line : trace.stoppedLine ?? last.canvas.trace.line), terminal: true } } };
  return {
    mode, notice: mode === "final" ? text.unsupported : trace.status === "truncated" ? text.truncated : partial ? text.partial : null,
    content: defineLearningContent({ version: 1, kind: "step-sequence", id: "bfs-own-trace", phase: 7, intervalMs: 3500,
      steps: steps as [LearningStep<BfsTraceCanvas>, ...LearningStep<BfsTraceCanvas>[]] }, validateTraceCanvas),
  };
}
