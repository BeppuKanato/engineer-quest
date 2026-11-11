import type { PythonTraceEvent, PythonTraceResult } from "../../../../lib/pythonTrace.types";
import {
  validateGreedyCoinsExecutionCanvas,
} from "../execution/execution.types";
import { defineLearningContent, type LearningStep } from "../../player/content.types";
import { greedyCoinsDenominations, greedyCoinsMainAmount } from "../greedyCoins";
import type { GreedyCoinStatus } from "../figure/greedyCoins.types";
import { greedyCoinsTraceText as text } from "./trace.content";
import type { GreedyCoinsTraceCanvas, GreedyCoinsTracePlayback } from "./trace.types";

type Frame = {
  readonly coins: readonly number[];
  readonly coinStatuses: readonly GreedyCoinStatus[];
  readonly amount: number;
  readonly remaining: number;
  readonly tray: readonly number[];
  readonly selectedCoin: number | null;
  readonly highlights: readonly { kind: "coin"; id: number }[];
};

/**
 * トレイとして描ける並びだけをスナップショットとして採用する。額面に無い値を含む、
 * 選択順（単調非増加）でない、合計が金額を超える並びは、この単元では描けない状態とする。
 */
const safeTray = (value: readonly number[] | null | undefined, coins: readonly number[], amount: number): readonly number[] | null =>
  Array.isArray(value) && value.length <= 64 &&
  value.every((item, index) => typeof item === "number" && Number.isInteger(item) && coins.includes(item) &&
    (index === 0 || item <= value[index - 1])) &&
  value.reduce((sum, item) => sum + item, 0) <= amount ? value : null;
const intOrNull = (value: number | null | undefined): number | null =>
  typeof value === "number" && Number.isInteger(value) ? value : null;
const sameFrame = (left: Frame, right: Frame) =>
  left.remaining === right.remaining && left.selectedCoin === right.selectedCoin &&
  left.tray.length === right.tray.length && left.tray.every((item, index) => right.tray[index] === item) &&
  left.coinStatuses.length === right.coinStatuses.length &&
  left.coinStatuses.every((item, index) => right.coinStatuses[index] === item);
const kindName = (kind: string) => /^[A-Za-z_][A-Za-z_0-9]{0,79}$/u.test(kind) ? kind : "PythonError";
const stoppedCaption = (trace: PythonTraceResult) => trace.error?.line ? text.stopped.replace("{line}", String(trace.error.line)).replace("{kind}", kindName(trace.error.kind)) :
  text.stoppedUnknown.replace("{kind}", kindName(trace.error?.kind ?? "PythonError"));

/** 選んだ額面より大きい額面は passed、その額面は current、小さい額面は upcoming（フェーズ2の statusesFor と同じ導出）。 */
function statusesFor(coins: readonly number[], coin: number): GreedyCoinStatus[] {
  const selectedIndex = coins.indexOf(coin);
  return coins.map((_, index) =>
    index < selectedIndex ? "passed" as const : index === selectedIndex ? "current" as const : "upcoming" as const);
}

export function convertGreedyCoinsTrace(trace: PythonTraceResult): GreedyCoinsTracePlayback {
  const coins = greedyCoinsDenominations;
  const amount = greedyCoinsMainAmount;
  const steps: LearningStep<GreedyCoinsTraceCanvas>[] = [];
  const lastFrame: { current: Frame | null } = { current: null };
  let selections = 0;
  let returnedNormally = false;
  let finalRemaining: number | null = null;
  let invalidTail = false;
  let lastEvent: PythonTraceEvent | null = null;
  let lastDrawable: { tray: readonly number[]; remaining: number; event: PythonTraceEvent } | null = null;

  function emit(frame: Frame, event: PythonTraceEvent, caption: string, terminal = false) {
    const canvas: GreedyCoinsTraceCanvas = {
      data: { kind: "greedy-coins-execution" },
      state: {
        coins: frame.coins, coinStatuses: frame.coinStatuses, amount: frame.amount,
        remaining: frame.remaining, tray: frame.tray, selectedCoin: frame.selectedCoin,
      },
      highlights: frame.highlights,
      trace: { line: event.line || null, variables: event.locals, terminal },
    };
    validateGreedyCoinsExecutionCanvas(canvas);
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

  for (const event of trace.events) {
    lastEvent = event;
    // result がまだ無い局面では、引数 coins のリストが array 候補に挙がることがある。
    // remaining / coin が揃わないイベントは盤面として使わない（初期盤面は導入フレームで出す）。
    const remaining = intOrNull(event.locals.remaining);
    const coin = intOrNull(event.locals.coin);
    if (event.locals.array !== undefined && event.locals.array !== null) {
      const candidate = safeTray(event.locals.array, coins, amount);
      if (candidate === null && remaining !== null && coin !== null) { invalidTail = true; break; }
    }
    if (remaining === null || coin === null || !coins.includes(coin)) continue;
    const tray = safeTray(event.locals.array, coins, amount);
    if (!tray) { invalidTail = true; break; }
    invalidTail = false;
    const paid = tray.reduce((sum, item) => sum + item, 0);
    // result.append と remaining の更新は別行のため、その間のイベントでは
    // トレイ合計と残額が一致しない。これは通常の途中状態なので読み飛ばす。
    if (paid + remaining !== amount) continue;
    lastDrawable = { tray, remaining, event };
    if (!lastFrame.current) {
      emit({ coins, coinStatuses: coins.map(() => "upcoming" as const), amount, remaining: amount, tray: [], selectedCoin: null, highlights: [] },
        event, text.initial);
    }
    // 硬貨1枚の選択が確定するのは、その硬貨の記録と残額の更新がそろい、
    // while の再チェック（または後続行）で「最後のトレイの硬貨＝今見ている額面」に
    // なったイベントである。額面が次へ進んだだけのイベントは選択ではない。
    if (tray.length === 0 || tray[tray.length - 1] !== coin) continue;
    emit({ coins, coinStatuses: statusesFor(coins, coin), amount, remaining, tray, selectedCoin: coin, highlights: [] },
      event, text.select.replace("{coin}", String(coin)).replace("{remaining}", String(remaining)));
    // 選択ステップのトレイの長さが、その時点までの選択回数そのものになる。
    selections = Math.max(selections, tray.length);
  }
  // return イベント自体が選択確定の条件を満たさない形（最終行の観測が無い等）でも、
  // 正常終了はループ外で拾う。
  if (trace.status === "returned" && lastDrawable) {
    returnedNormally = true;
    finalRemaining = lastDrawable.remaining;
    const tray = lastDrawable.tray;
    if (tray.length > 0 && lastFrame.current && tray[tray.length - 1] !== undefined) {
      // 最終トレイが未放出なら、最後の選択として出す。
      const coin = tray[tray.length - 1];
      if (!lastFrame.current || lastFrame.current.tray.length !== tray.length) {
        emit({ coins, coinStatuses: statusesFor(coins, coin), amount, remaining: lastDrawable.remaining, tray, selectedCoin: coin, highlights: [] },
          lastDrawable.event, text.select.replace("{coin}", String(coin)).replace("{remaining}", String(lastDrawable.remaining)));
        selections = tray.length;
      }
    }
    if (returnedNormally && finalRemaining === 0 && tray.length > 0) {
      emit({ coins, coinStatuses: coins.map(() => "passed" as const), amount, remaining: 0, tray, selectedCoin: null, highlights: [] },
        lastDrawable.event, text.summary.replace("{count}", String(tray.length)), true);
    }
  }

  const ambiguous = trace.ambiguousKinds ? trace.ambiguousKinds.includes("array") : trace.ambiguous;
  const mode = steps.length > 1 && selections > 0 && !ambiguous ? "replay" : "final";
  const partial = mode === "replay" && invalidTail;
  const finalEvent: PythonTraceEvent = lastEvent ?? { line: trace.stoppedLine ?? 0, event: "return", boundary: "line", locals: {} };
  if (mode === "final") {
    steps.length = 0;
    lastFrame.current = null;
    const tray = safeTray(Array.isArray(trace.result) ? trace.result : null, coins, amount) ?? lastDrawable?.tray ?? [];
    const remaining = amount - tray.reduce((sum, item) => sum + item, 0);
    if (tray.length === 0) {
      emit({ coins, coinStatuses: coins.map(() => "upcoming" as const), amount, remaining: amount, tray: [], selectedCoin: null, highlights: [] }, finalEvent, text.final, true);
    } else {
      const coin = tray[tray.length - 1];
      emit({ coins, coinStatuses: statusesFor(coins, coin), amount, remaining, tray, selectedCoin: coin, highlights: [] }, finalEvent, text.final, true);
    }
  }
  const last = steps[steps.length - 1];
  const completed = returnedNormally && finalRemaining === 0;
  const caption = trace.status === "error" ? stoppedCaption(trace) : trace.status === "truncated" ? text.truncated :
    partial ? text.partial : mode === "final" ? text.final :
    completed ? text.summary.replace("{count}", String(last.canvas.state.tray.length)) :
    returnedNormally ? text.incomplete : text.ended;
  steps[steps.length - 1] = { ...last, caption, canvas: { ...last.canvas, highlights: mode === "final" ? [] : last.canvas.highlights, trace: { ...last.canvas.trace, line: trace.error?.line ?? (partial ? last.canvas.trace.line : trace.stoppedLine ?? last.canvas.trace.line), terminal: true } } };
  return {
    mode, notice: mode === "final" ? text.unsupported : trace.status === "truncated" ? text.truncated : partial ? text.partial : null,
    content: defineLearningContent({ version: 1, kind: "step-sequence", id: "greedy-coins-own-trace", phase: 7, intervalMs: 3500,
      steps: steps as [LearningStep<GreedyCoinsTraceCanvas>, ...LearningStep<GreedyCoinsTraceCanvas>[]] },
      canvas => { validateGreedyCoinsExecutionCanvas(canvas); }),
  };
}
