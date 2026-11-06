import type { PythonTraceEvent, PythonTraceResult } from "../../../../lib/pythonTrace.types";
import { validateArrayBarsCanvas } from "../../player/arrayBars.types";
import { defineLearningContent, type LearningStep } from "../../player/content.types";
import { bubbleSortMainValues } from "../bubbleSort";
import { bubbleSortTraceText as text } from "./trace.content";
import type { BubbleSortTraceCanvas, BubbleSortTracePlayback } from "./trace.types";

type Frame = {
  readonly values: readonly number[];
  readonly comparing: readonly [number, number] | null;
  readonly fixedFrom: number;
  readonly highlights: readonly { kind: "cell"; id: number }[];
};
/** 比較は「次の比較・周の終わり・return」のイベントで初めて結果が確定するので、開始時点の並びを持って保留する。 */
type Pending = { readonly i: number; readonly j: number; readonly before: readonly number[] };

/** 棒で描ける並びだけをスナップショットとして採用する（負数や有限でない値は描画基盤が受け付けない）。 */
const safeValues = (value: readonly number[] | null | undefined): readonly number[] | null =>
  Array.isArray(value) && value.length >= 1 && value.length <= 64 &&
  value.every(item => typeof item === "number" && Number.isFinite(item) && item >= 0) ? value : null;
const intOrNull = (value: number | null | undefined): number | null =>
  typeof value === "number" && Number.isInteger(value) ? value : null;
const sameValues = (left: readonly number[], right: readonly number[]) =>
  left.length === right.length && left.every((item, index) => right[index] === item);
const sameFrame = (left: Frame, right: Frame) =>
  left.fixedFrom === right.fixedFrom && sameValues(left.values, right.values) &&
  (left.comparing === right.comparing || (left.comparing !== null && right.comparing !== null &&
    left.comparing[0] === right.comparing[0] && left.comparing[1] === right.comparing[1]));
const kindName = (kind: string) => /^[A-Za-z_][A-Za-z_0-9]{0,79}$/u.test(kind) ? kind : "PythonError";
const stoppedCaption = (trace: PythonTraceResult) => trace.error?.line ? text.stopped.replace("{line}", String(trace.error.line)).replace("{kind}", kindName(trace.error.kind)) :
  text.stoppedUnknown.replace("{kind}", kindName(trace.error?.kind ?? "PythonError"));

function validateTraceCanvas(canvas: BubbleSortTraceCanvas) {
  validateArrayBarsCanvas(canvas);
}

export function convertBubbleSortTrace(trace: PythonTraceResult): BubbleSortTracePlayback {
  const steps: LearningStep<BubbleSortTraceCanvas>[] = [];
  const lastFrame: { current: Frame | null } = { current: null };
  let lastI: number | null = null;
  let pending: Pending | null = null;
  let comparisonsInPass = 0;
  let lastEvent: PythonTraceEvent | null = null;
  let lastSnapshot: { values: readonly number[]; event: PythonTraceEvent } | null = null;
  let invalidFinal = false;

  function emit(frame: Frame, event: PythonTraceEvent, caption: string, terminal = false) {
    const canvas: BubbleSortTraceCanvas = {
      data: { kind: "array-bars" },
      state: { values: frame.values, comparing: frame.comparing, fixedFrom: frame.fixedFrom },
      highlights: frame.highlights,
      trace: { line: event.line || null, variables: event.locals, terminal },
    };
    validateTraceCanvas(canvas);
    if (lastFrame.current && sameFrame(lastFrame.current, frame)) {
      if (terminal || caption) {
        steps[steps.length - 1] = { ...steps[steps.length - 1], caption, canvas };
        lastFrame.current = frame;
      }
      return;
    }
    steps.push({ id: `trace-${steps.length}`, caption, canvas });
    lastFrame.current = frame;
  }

  /** 保留中の比較を、その時点の並び（比較後の状態）で1コマとして確定する。フェーズ2と同じく、入れ替えた2マスだけを強調する。 */
  function flushComparison(values: readonly number[], event: PythonTraceEvent) {
    if (!pending) return;
    const { i, j, before } = pending;
    pending = null;
    const pair: readonly [number, number] = [j, j + 1];
    const swapped = values[j] !== before[j] || values[j + 1] !== before[j + 1];
    const caption = (swapped ? text.swap : text.compare)
      .replace("{left}", String(before[j])).replace("{right}", String(before[j + 1]));
    emit({ values, comparing: pair, fixedFrom: values.length - i, highlights: swapped ? pair.map(id => ({ kind: "cell" as const, id })) : [] }, event, caption);
  }

  function emitPassEnd(values: readonly number[], fixedFrom: number, event: PythonTraceEvent) {
    emit({ values, comparing: null, fixedFrom, highlights: [] }, event,
      text.passEnd.replace("{value}", String(values[fixedFrom])));
  }

  for (const event of trace.events) {
    lastEvent = event;
    const values = safeValues(event.locals.array);
    if (!values) { invalidFinal = true; continue; }
    invalidFinal = false;
    lastSnapshot = { values, event };
    const i = intOrNull(event.locals.i);
    const j = intOrNull(event.locals.j);
    if (!lastFrame.current) {
      emit({ values, comparing: null, fixedFrom: values.length, highlights: [] }, event, text.initial);
    }
    // 例外や打ち切りで抜けたフレームにも return イベントが届くため、成功した場合だけ終端として扱う。
    if (event.event === "return" && trace.status === "returned") {
      flushComparison(values, event);
      if (lastI !== null && comparisonsInPass > 0) emitPassEnd(values, values.length - (lastI + 1), event);
      // 終端の並びは作業リストのスナップショットではなく、実際に返されたリストを正とする（sorted(values) を返す実装など）。
      const returned = safeValues(Array.isArray(trace.result) ? trace.result : null);
      emit({ values: returned ?? values, comparing: null, fixedFrom: 0, highlights: [] }, event, text.ended, true);
      continue;
    }
    if (i !== null && lastI !== null && i !== lastI) {
      // 外側ループの行イベントでは j が前の周の値のまま残るため、このイベントからは比較を始めない。
      flushComparison(values, event);
      if (comparisonsInPass > 0) emitPassEnd(values, values.length - i, event);
      comparisonsInPass = 0;
      lastI = i;
      continue;
    }
    if (i !== null && lastI === null) lastI = i;
    if (i !== null && j !== null) {
      if (pending && (pending.i !== i || pending.j !== j)) flushComparison(values, event);
      if (!pending && j >= 0 && j + 1 < values.length) {
        pending = { i, j, before: values };
        comparisonsInPass++;
      }
    } else if (pending && j === null) {
      flushComparison(values, event);
    }
    if (i === null || j === null) {
      // i / j を使わない実装（while など）では、並びの変化だけを追う。
      if (lastFrame.current && !sameValues(lastFrame.current.values, values)) {
        emit({ values, comparing: null, fixedFrom: lastFrame.current.fixedFrom, highlights: [] }, event, text.changed);
      }
    }
  }
  if (pending && lastSnapshot) flushComparison(lastSnapshot.values, lastSnapshot.event);

  const mode = steps.length && !trace.ambiguous ? "replay" : "final";
  const partial = mode === "replay" && invalidFinal;
  const finalEvent: PythonTraceEvent = lastEvent ?? { line: trace.stoppedLine ?? 0, event: "return", boundary: "line", locals: {} };
  if (mode === "final") {
    steps.length = 0;
    lastFrame.current = null;
    const values = safeValues(Array.isArray(trace.result) ? trace.result : null) ?? lastSnapshot?.values ?? bubbleSortMainValues;
    emit({ values, comparing: null, fixedFrom: values.length, highlights: [] }, finalEvent, text.final, true);
  }
  const last = steps[steps.length - 1];
  const caption = trace.status === "error" ? stoppedCaption(trace) : trace.status === "truncated" ? text.truncated : partial ? text.partial : mode === "final" ? text.final : text.ended;
  steps[steps.length - 1] = { ...last, caption, canvas: { ...last.canvas, highlights: mode === "final" ? [] : last.canvas.highlights, trace: { ...last.canvas.trace, line: trace.error?.line ?? (partial ? last.canvas.trace.line : trace.stoppedLine ?? last.canvas.trace.line), terminal: true } } };
  return {
    mode, notice: mode === "final" ? text.unsupported : trace.status === "truncated" ? text.truncated : partial ? text.partial : null,
    content: defineLearningContent({ version: 1, kind: "step-sequence", id: "bubble-sort-own-trace", phase: 7, intervalMs: 3500,
      steps: steps as [LearningStep<BubbleSortTraceCanvas>, ...LearningStep<BubbleSortTraceCanvas>[]] }, validateTraceCanvas),
  };
}
