import type { PythonTraceEvent, PythonTraceResult } from "../../../../lib/pythonTrace.types";
import { defineLearningContent, type LearningStep } from "../../player/content.types";
import { mazeCellKey, parseMazeCellKey, type MazeCellKey } from "../../player/mazeGrid.types";
import { validateMazeDiggingExecutionCanvas } from "../execution/execution.types";
import { mazeDiggingMainSize, solveMazeDiggingPath } from "../mazeDiggingMaze";
import { mazeDiggingTraceDirectionNames as directionNames, mazeDiggingTraceText as text } from "./trace.content";
import type { MazeDiggingTraceCanvas, MazeDiggingTracePlayback } from "./trace.types";

type Grid = readonly (readonly number[])[];
const directionByDelta: Readonly<Record<string, keyof typeof directionNames>> = {
  "0,-1": "up", "0,1": "down", "-1,0": "left", "1,0": "right",
};
const kindName = (kind: string) => /^[A-Za-z_][A-Za-z_0-9]{0,79}$/u.test(kind) ? kind : "PythonError";
const stoppedCaption = (trace: PythonTraceResult) => trace.error?.line ? text.stopped.replace("{line}", String(trace.error.line)).replace("{kind}", kindName(trace.error.kind)) :
  text.stoppedUnknown.replace("{kind}", kindName(trace.error?.kind ?? "PythonError"));
const coordinate = (key: MazeCellKey) => { const { x, y } = parseMazeCellKey(key); return `(${x}, ${y})`; };

/** 描画できる盤面かどうかだけを確認する。正しい迷路かどうかはここでは判定しない（学習者の誤りもそのまま見せる）。 */
function drawableGridSize(grid: Grid | null | undefined): number | null {
  if (!Array.isArray(grid)) return null;
  const size = grid.length;
  if (!Number.isInteger(size) || size < 3 || size > 25 || size % 2 === 0) return null;
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== size) return null;
    if (!row.every(cell => typeof cell === "number" && Number.isInteger(cell))) return null;
  }
  return size;
}

function wallsOf(grid: Grid): MazeCellKey[] {
  const walls: MazeCellKey[] = [];
  grid.forEach((row, y) => row.forEach((cell, x) => { if (cell !== 0) walls.push(mazeCellKey(x, y)); }));
  return walls;
}

/** 部屋は両座標が奇数で外周を除いたマス（基準データ §1）。 */
function isRoom(key: MazeCellKey, size: number): boolean {
  const { x, y } = parseMazeCellKey(key);
  return x % 2 === 1 && y % 2 === 1 && x >= 1 && y >= 1 && x < size - 1 && y < size - 1;
}

/**
 * 通路マス同士をつなぐ経路を返す。掘削の途中では開いたマスが木をなすため、
 * 開始マスから現在マスへの経路はスタックの経路と一致する（経路が一意）。
 * つながっていない場合は推測せず null を返す。
 */
function routePath(size: number, wallSet: ReadonlySet<string>, from: MazeCellKey, to: MazeCellKey): readonly MazeCellKey[] | null {
  if (wallSet.has(from) || wallSet.has(to)) return null;
  const grid = Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) => wallSet.has(mazeCellKey(x, y)) ? 1 : 0));
  try { return solveMazeDiggingPath(grid, from, to); } catch { return null; }
}

export function convertMazeDiggingTrace(trace: PythonTraceResult): MazeDiggingTracePlayback {
  const steps: LearningStep<MazeDiggingTraceCanvas>[] = [];
  /** 直近に処理した描画可能な盤面（差分の基準）。 */
  let prev: { walls: ReadonlySet<string>; size: number } | null = null;
  /** 最後にコマとして確定した状態。バックトラックのコマはこの盤面で作る。 */
  let settled: { walls: ReadonlySet<string>; processing: MazeCellKey | null; path: readonly MazeCellKey[] } | null = null;
  /** 確定したコマ以降に掘れたマス（間の壁だけ先に掘れるため、部屋が掘れるまで保留する）。 */
  let pending: MazeCellKey[] = [];
  /** 最初に掘った部屋。経路の起点にする。 */
  let startRoom: MazeCellKey | null = null;
  let lastEvent: PythonTraceEvent | null = null;
  let invalidTail = false;

  function makeCanvas(size: number, walls: readonly MazeCellKey[], processing: MazeCellKey | null,
    highlights: readonly MazeCellKey[], path: readonly MazeCellKey[], start: MazeCellKey | null, goal: MazeCellKey | null,
    event: PythonTraceEvent, terminal = false): MazeDiggingTraceCanvas {
    return {
      data: { kind: "maze-grid", size },
      state: { walls, processing, target: null, path, start, goal },
      highlights: highlights.map(id => ({ kind: "cell" as const, id })),
      trace: { line: event.line || null, variables: event.locals, terminal },
    };
  }

  function emit(size: number, walls: readonly MazeCellKey[], processing: MazeCellKey | null,
    highlights: readonly MazeCellKey[], path: readonly MazeCellKey[], caption: string, event: PythonTraceEvent) {
    const wallSet = new Set<string>(walls);
    const safeHighlights = highlights.filter(key => !wallSet.has(key));
    steps.push({ id: `trace-${steps.length}`, caption, canvas: makeCanvas(size, walls, processing, safeHighlights, path, null, null, event) });
    settled = { walls: wallSet, processing, path };
  }

  for (const event of trace.events) {
    lastEvent = event;
    // grid キーが無いイベントは「まだ盤面が作られていない」だけなので読み飛ばす。
    // キーがあり値が null の場合は「盤面はあるが描ける形ではない」ため、末尾の部分表示の判定に使う。
    if (!("grid" in event.locals)) continue;
    const grid = event.locals.grid;
    if (grid === null || grid === undefined) { invalidTail = true; continue; }
    const size = drawableGridSize(grid);
    if (size === null) { invalidTail = true; continue; }
    invalidTail = false;
    const walls = wallsOf(grid);
    const wallSet = new Set<string>(walls);
    if (prev !== null && prev.size === size && wallSet.size === prev.walls.size && walls.every(key => prev.walls.has(key))) {
      prev = { walls: wallSet, size };
      continue;
    }
    if (prev === null || prev.size !== size) {
      // 最初の盤面。全部が壁なら用意のコマ、それ以外は変化として見せる。
      pending = [];
      settled = null;
      startRoom = null;
      emit(size, walls, null, [], [], walls.length === size * size ? text.setup : text.changed, event);
      prev = { walls: wallSet, size };
      continue;
    }
    const opened = [...prev.walls].filter(key => !wallSet.has(key));
    const closed = walls.filter(key => !prev.walls.has(key));
    pending.push(...opened);
    const newRooms = opened.filter(key => isRoom(key, size));
    if (closed.length === 0 && newRooms.length > 0) {
      const room = newRooms[0];
      const betweenCells = pending.filter(key => key !== room);
      let fromRoom: MazeCellKey | null = null;
      for (const cell of betweenCells) {
        const r = parseMazeCellKey(room), b = parseMazeCellKey(cell);
        const candidate = mazeCellKey(2 * b.x - r.x, 2 * b.y - r.y);
        if (isRoom(candidate, size)) { fromRoom = candidate; break; }
      }
      if (startRoom === null) startRoom = fromRoom ?? room;
      if (fromRoom !== null && settled !== null && settled.processing !== null && fromRoom !== settled.processing) {
        // 次の掘削の開始マスが前回の掘削先と違う場合、その間にバックトラックが起きている。
        // 盤面は変わらないため、確定済みの盤面のまま現在位置とスタック経路だけを移す。
        const route = routePath(size, settled.walls, startRoom, fromRoom);
        const path = route !== null && route.length > 1 ? route : [];
        emit(size, [...settled.walls], fromRoom, [], path,
          text.backtrack.replace("{room}", coordinate(fromRoom)), event);
      }
      const route = routePath(size, wallSet, startRoom, room);
      const path = route !== null && route.length > 1 ? route : [];
      let caption = text.firstRoom.replace("{room}", coordinate(room));
      if (fromRoom !== null) {
        const from = parseMazeCellKey(fromRoom), to = parseMazeCellKey(room);
        const direction = directionByDelta[`${(to.x - from.x) / 2},${(to.y - from.y) / 2}`];
        if (direction) caption = text.dig.replace("{from}", coordinate(fromRoom)).replace("{direction}", directionNames[direction]);
      }
      emit(size, walls, room, [...betweenCells, room], path, caption, event);
      pending = [];
    } else if (closed.length > 0) {
      // 壁が増えるなど掘削以外の変化は、そのまま1コマにする（誤りも差し替えない）。
      const processing = settled !== null && settled.processing !== null && !wallSet.has(settled.processing) ? settled.processing : null;
      emit(size, walls, processing, pending, [], text.changed, event);
      pending = [];
    }
    // 間の壁だけが掘れた場合はコマにせず、部屋が掘れるまで pending に残す。
    prev = { walls: wallSet, size };
  }

  // 部屋まで掘り切らずに止まった場合は、掘れたところまでを最後のコマとして出す。
  if (pending.length > 0 && prev !== null && settled !== null && lastEvent !== null) {
    const processing = settled.processing !== null && !prev.walls.has(settled.processing) ? settled.processing : null;
    const path = settled.path.every(key => !prev.walls.has(key)) ? settled.path : [];
    emit(prev.size, [...prev.walls], processing, pending, path, text.changed, lastEvent);
    pending = [];
  }

  const ambiguous = trace.ambiguousKinds ? trace.ambiguousKinds.includes("grid") : trace.ambiguous;
  const mode = steps.length && !ambiguous ? "replay" : "final";
  const partial = mode === "replay" && invalidTail;
  const finalEvent: PythonTraceEvent = lastEvent ?? { line: trace.stoppedLine ?? 0, event: "return", boundary: "line", locals: {} };
  if (mode === "final") {
    steps.length = 0;
    const resultGrid = Array.isArray(trace.result) ? trace.result : null;
    const resultSize = drawableGridSize(resultGrid);
    const eventSize = drawableGridSize(finalEvent.locals.grid);
    const size = resultSize ?? eventSize ?? mazeDiggingMainSize;
    const walls = resultSize !== null ? wallsOf(resultGrid!) : eventSize !== null ? wallsOf(finalEvent.locals.grid!) : [];
    steps.push({ id: "trace-0", caption: text.final, canvas: makeCanvas(size, walls, null, [], [], null, null, finalEvent, true) });
  } else if (trace.status === "returned") {
    // 完成コマはフェーズ2の完成ステップと同じ形にする（旗と一本道）。
    const resultGrid = Array.isArray(trace.result) ? trace.result : null;
    const resultSize = drawableGridSize(resultGrid);
    if (resultSize !== null) {
      const walls = wallsOf(resultGrid!);
      const wallSet = new Set<string>(walls);
      const start = mazeCellKey(1, 1);
      const goal = mazeCellKey(resultSize - 2, resultSize - 2);
      const route = routePath(resultSize, wallSet, start, goal);
      steps.push({ id: `trace-${steps.length}`, caption: text.ended,
        canvas: makeCanvas(resultSize, walls, null, [], route ?? [], route !== null ? start : null, route !== null ? goal : null, finalEvent, true) });
    }
  }
  const last = steps[steps.length - 1];
  const caption = trace.status === "error" ? stoppedCaption(trace) : trace.status === "truncated" ? text.truncated : partial ? text.partial : mode === "final" ? text.final : text.ended;
  steps[steps.length - 1] = { ...last, caption, canvas: { ...last.canvas, highlights: mode === "final" ? [] : last.canvas.highlights, trace: { ...last.canvas.trace, line: trace.error?.line ?? (partial ? last.canvas.trace.line : trace.stoppedLine ?? last.canvas.trace.line), terminal: true } } };
  return {
    mode, notice: mode === "final" ? text.unsupported : trace.status === "truncated" ? text.truncated : partial ? text.partial : null,
    content: defineLearningContent({ version: 1, kind: "step-sequence", id: "maze-digging-own-trace", phase: 7, intervalMs: 3500,
      steps: steps as [LearningStep<MazeDiggingTraceCanvas>, ...LearningStep<MazeDiggingTraceCanvas>[]] },
      canvas => validateMazeDiggingExecutionCanvas(canvas)),
  };
}
