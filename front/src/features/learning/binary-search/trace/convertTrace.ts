import type { PythonTraceEvent, PythonTraceResult } from "../../../../lib/pythonTrace.types";
import {
  validateBinarySearchExecutionCanvas, type BinarySearchCellStatus,
} from "../execution/execution.types";
import { defineLearningContent, type LearningStep } from "../../player/content.types";
import { binarySearchMainTarget, binarySearchMainValues } from "../binarySearch";
import { binarySearchTraceText as text } from "./trace.content";
import type { BinarySearchTraceCanvas, BinarySearchTracePlayback } from "./trace.types";

type Frame = {
  readonly values: readonly number[];
  readonly lo: number | null;
  readonly hi: number | null;
  readonly mid: number | null;
  readonly cells: readonly BinarySearchCellStatus[];
  readonly highlights: readonly { kind: "cell"; id: number }[];
};
/** 比較は「範囲の更新・発見・return」のイベントで初めて結果が確定するので、開始時点の範囲を持って保留する。 */
type Pending = { readonly lo: number; readonly hi: number; readonly mid: number };

/**
 * 盤面として描ける並びだけをスナップショットとして採用する。盤面型の前提
 * （小さい順・非負・有限）に合わない並びは、この単元では描けない状態とする。
 */
const safeValues = (value: readonly number[] | null | undefined): readonly number[] | null =>
  Array.isArray(value) && value.length >= 1 && value.length <= 64 &&
  value.every((item, index) => typeof item === "number" && Number.isFinite(item) && item >= 0 &&
    (index === 0 || item > value[index - 1])) ? value : null;
const intOrNull = (value: number | null | undefined): number | null =>
  typeof value === "number" && Number.isInteger(value) ? value : null;
const sameCells = (left: readonly BinarySearchCellStatus[], right: readonly BinarySearchCellStatus[]) =>
  left.length === right.length && left.every((item, index) => right[index] === item);
const sameFrame = (left: Frame, right: Frame) =>
  left.lo === right.lo && left.hi === right.hi && left.mid === right.mid &&
  left.values.length === right.values.length && left.values.every((item, index) => right.values[index] === item) &&
  sameCells(left.cells, right.cells) &&
  left.highlights.length === right.highlights.length &&
  left.highlights.every((item, index) => right.highlights[index].id === item.id);
const kindName = (kind: string) => /^[A-Za-z_][A-Za-z_0-9]{0,79}$/u.test(kind) ? kind : "PythonError";
const stoppedCaption = (trace: PythonTraceResult) => trace.error?.line ? text.stopped.replace("{line}", String(trace.error.line)).replace("{kind}", kindName(trace.error.kind)) :
  text.stoppedUnknown.replace("{kind}", kindName(trace.error?.kind ?? "PythonError"));

/** フェーズ2と同じ盤面の規則（execution.content の probeCells / rangeCells と同じ導出をトレース側で持つ）。 */
function rangeCells(values: readonly number[], lo: number, hi: number): BinarySearchCellStatus[] {
  return values.map((_, index) => (index < lo || index > hi ? "discarded" : "in-range"));
}
function probeCells(values: readonly number[], probe: Pending, droppedSide: "left" | "right" | null, found = false): BinarySearchCellStatus[] {
  return values.map((_, index) => {
    if (index < probe.lo || index > probe.hi) return "discarded";
    if (index === probe.mid) return found ? "found" : "center";
    if (droppedSide === "left" && index < probe.mid) return "discarded";
    if (droppedSide === "right" && index > probe.mid) return "discarded";
    return "in-range";
  });
}

export function convertBinarySearchTrace(trace: PythonTraceResult): BinarySearchTracePlayback {
  const target = binarySearchMainTarget;
  const steps: LearningStep<BinarySearchTraceCanvas>[] = [];
  const lastFrame: { current: Frame | null } = { current: null };
  let pending: Pending | null = null;
  let lastProbe: Pending | null = null;
  let probeCount = 0;
  let foundAt: number | null = null;
  let returnedNormally = false;
  let invalidTail = false;
  let lastEvent: PythonTraceEvent | null = null;
  let lastDrawable: { values: readonly number[]; event: PythonTraceEvent } | null = null;

  function emit(frame: Frame, event: PythonTraceEvent, caption: string, terminal = false) {
    const canvas: BinarySearchTraceCanvas = {
      data: { kind: "binary-search-execution" },
      state: { values: frame.values, target, lo: frame.lo, hi: frame.hi, mid: frame.mid, cells: frame.cells },
      highlights: frame.highlights,
      trace: { line: event.line || null, variables: event.locals, terminal },
    };
    validateBinarySearchExecutionCanvas(canvas);
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

  /** 保留中の比較を、範囲の更新から確定した「捨てた側」の盤面と、確定した範囲の盤面で確定する（フェーズ2と同じ1ステップ1変化）。 */
  function settleDrop(probe: Pending, side: "left" | "right", lo: number, hi: number, values: readonly number[], event: PythonTraceEvent) {
    emit({ values, lo: probe.lo, hi: probe.hi, mid: probe.mid, cells: probeCells(values, probe, side), highlights: [] },
      event, (side === "left" ? text.dropLeft : text.dropRight)
        .replace("{value}", String(values[probe.mid])).replaceAll("{target}", String(target)));
    if (lo <= hi) {
      const size = hi - lo + 1;
      emit({ values, lo, hi, mid: null, cells: rangeCells(values, lo, hi), highlights: [] }, event,
        size === 1 ? text.rangeSingle : lo === 0 && hi === values.length - 1 ? text.rangeAll : text.rangeRest);
    }
  }

  for (const event of trace.events) {
    lastEvent = event;
    const values = safeValues(event.locals.array);
    if (!values || !values.includes(target)) { invalidTail = true; break; }
    invalidTail = false;
    lastDrawable = { values, event };
    const lo = intOrNull(event.locals.lo);
    const hi = intOrNull(event.locals.hi);
    const mid = intOrNull(event.locals.mid);
    if (!lastFrame.current) {
      emit({ values, lo: null, hi: null, mid: null, cells: values.map(() => "in-range" as const), highlights: [{ kind: "cell", id: values.indexOf(target) }] },
        event, text.initial.replace("{target}", String(target)));
    }
    if (lo !== null && hi !== null) {
      // 範囲が保留中の中央の片側を超えたら、その比較で捨てた側が確定する。
      if (pending && (lo > pending.mid || hi < pending.mid)) {
        const probe = pending;
        pending = null;
        settleDrop(probe, lo > probe.mid ? "left" : "right", lo, hi, values, event);
      } else if (pending && mid !== null && lo <= mid && mid <= hi &&
        (pending.lo !== lo || pending.hi !== hi || pending.mid !== mid)) {
        // 範囲が中央を含んだまま狭まるなど、捨てる形にならずに別の比較へ移った
        // （例: lo = mid の誤り）。保留は捨て側を確定させずに解消し、新しい比較として扱う。
        pending = null;
      }
      const inBoard = lo >= 0 && hi < values.length && lo <= hi;
      if (!pending && mid !== null && inBoard && lo <= mid && mid <= hi) {
        // 同じ比較の観測が複数イベントに現れるため、前回の比較と異なる組だけを新しい比較とする。
        if (!lastProbe || lastProbe.lo !== lo || lastProbe.hi !== hi || lastProbe.mid !== mid) {
          const probe: Pending = { lo, hi, mid };
          probeCount++;
          emit({ values, lo, hi, mid, cells: probeCells(values, probe, null), highlights: [] }, event,
            hi - lo + 1 === 1 ? text.midSingle.replace("{value}", String(values[mid])) :
            probeCount === 1 ? text.midFirst.replace("{value}", String(values[mid])) :
            text.midNext.replace("{value}", String(values[mid])));
          pending = probe;
          lastProbe = probe;
        }
      } else if (!pending && mid === null && inBoard) {
        // 範囲だけが決まった局面（比較の前）。重複は emit 側で抑える。
        emit({ values, lo, hi, mid: null, cells: rangeCells(values, lo, hi), highlights: [] }, event,
          lo === 0 && hi === values.length - 1 ? text.rangeAll : text.rangeRest);
      }
    }
    // 例外や打ち切りで抜けたフレームにも return イベントが届くため、成功した場合だけ終端として扱う。
    if (event.event === "return" && trace.status === "returned") {
      returnedNormally = true;
      if (pending && values[pending.mid] === target) {
        const probe = pending;
        foundAt = probe.mid;
        emit({ values, lo: probe.lo, hi: probe.hi, mid: probe.mid, cells: probeCells(values, probe, null, true), highlights: [{ kind: "cell", id: probe.mid }] },
          event, text.found.replaceAll("{target}", String(target)).replace("{position}", String(probe.mid + 1)).replace("{index}", String(probe.mid)));
        // 終端はフェーズ2のまとめと同じ形（発見セルだけを残し、中央の指定と強調を外す）。
        emit({ values, lo: probe.lo, hi: probe.hi, mid: null, cells: probeCells(values, probe, null, true), highlights: [] },
          event, text.summary.replace("{count}", String(probeCount)), true);
      }
      pending = null;
    }
  }

  const ambiguous = trace.ambiguousKinds ? trace.ambiguousKinds.includes("array") : trace.ambiguous;
  const mode = steps.length && probeCount > 0 && !ambiguous ? "replay" : "final";
  const partial = mode === "replay" && invalidTail;
  const finalEvent: PythonTraceEvent = lastEvent ?? { line: trace.stoppedLine ?? 0, event: "return", boundary: "line", locals: {} };
  if (mode === "final") {
    steps.length = 0;
    lastFrame.current = null;
    const values = lastDrawable?.values ?? binarySearchMainValues;
    emit({ values, lo: null, hi: null, mid: null, cells: values.map(() => "in-range" as const), highlights: [] }, finalEvent, text.final, true);
  }
  const last = steps[steps.length - 1];
  const caption = trace.status === "error" ? stoppedCaption(trace) : trace.status === "truncated" ? text.truncated :
    partial ? text.partial : mode === "final" ? text.final :
    foundAt !== null ? text.summary.replace("{count}", String(probeCount)) :
    returnedNormally ? text.notFound.replace("{target}", String(target)) : text.ended;
  steps[steps.length - 1] = { ...last, caption, canvas: { ...last.canvas, highlights: mode === "final" ? [] : last.canvas.highlights, trace: { ...last.canvas.trace, line: trace.error?.line ?? (partial ? last.canvas.trace.line : trace.stoppedLine ?? last.canvas.trace.line), terminal: true } } };
  return {
    mode, notice: mode === "final" ? text.unsupported : trace.status === "truncated" ? text.truncated : partial ? text.partial : null,
    content: defineLearningContent({ version: 1, kind: "step-sequence", id: "binary-search-own-trace", phase: 7, intervalMs: 3500,
      steps: steps as [LearningStep<BinarySearchTraceCanvas>, ...LearningStep<BinarySearchTraceCanvas>[]] },
      canvas => { validateBinarySearchExecutionCanvas(canvas); }),
  };
}
