import type { PythonTraceEvent, PythonTraceResult } from "../../../../lib/pythonTrace.types";
import { defineLearningContent, type LearningStep } from "../../player/content.types";
import { mazeCellKey, parseMazeCellKey, type MazeCellKey } from "../../player/mazeGrid.types";
import { validateWallExtensionExecutionCanvas } from "../execution/execution.types";
import { wallExtensionBorderWalls, wallExtensionMainSize, wallExtensionPillars } from "../wallExtensionMaze";
import { wallExtensionTraceDirectionNames as directionNames, wallExtensionTraceText as text } from "./trace.content";
import type { WallExtensionTraceCanvas, WallExtensionTracePlayback } from "./trace.types";

type Grid = readonly (readonly number[])[];
const directionByDelta: Readonly<Record<string, keyof typeof directionNames>> = {
  "0,-1": "up", "0,1": "down", "-1,0": "left", "1,0": "right",
};
const kindName = (kind: string) => /^[A-Za-z_][A-Za-z_0-9]{0,79}$/u.test(kind) ? kind : "PythonError";
const stoppedCaption = (trace: PythonTraceResult) => trace.error?.line ? text.stopped.replace("{line}", String(trace.error.line)).replace("{kind}", kindName(trace.error.kind)) :
  text.stoppedUnknown.replace("{kind}", kindName(trace.error?.kind ?? "PythonError"));

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

const setCache = new Map<string, ReadonlySet<string>>();
function canonicalSet(kind: "border" | "pillars", size: number): ReadonlySet<string> {
  const key = `${kind}:${size}`;
  const cached = setCache.get(key);
  if (cached) return cached;
  const created = new Set<string>(kind === "border" ? wallExtensionBorderWalls(size) : wallExtensionPillars(size));
  setCache.set(key, created);
  return created;
}

export function convertWallExtensionTrace(trace: PythonTraceResult): WallExtensionTracePlayback {
  const steps: LearningStep<WallExtensionTraceCanvas>[] = [];
  const extendedPillars = new Set<string>();
  let lastCategory: string | null = null;
  const checkpoint: { walls: ReadonlySet<string> | null; size: number | null } = { walls: null, size: null };
  let lastEvent: PythonTraceEvent | null = null;
  let invalidTail = false;

  function makeCanvas(size: number, walls: readonly MazeCellKey[], processing: MazeCellKey | null,
    highlights: readonly MazeCellKey[], event: PythonTraceEvent, terminal = false): WallExtensionTraceCanvas {
    return {
      data: { kind: "maze-grid", size },
      state: { walls, processing, target: null, path: [], start: null, goal: null },
      highlights: highlights.map(id => ({ kind: "cell" as const, id })),
      trace: { line: event.line || null, variables: event.locals, terminal },
    };
  }

  function emit(grid: Grid, size: number, event: PythonTraceEvent) {
    const walls = wallsOf(grid);
    const wallSet = new Set<string>(walls);
    const added = walls.filter(key => !checkpoint.walls?.has(key));
    const removed = checkpoint.walls ? [...checkpoint.walls].filter(key => !wallSet.has(key)) : [];
    const border = canonicalSet("border", size);
    const pillars = canonicalSet("pillars", size);
    let caption: string = text.changed;
    let category: "setup" | "border" | "pillars" | "extend" | "changed" = "changed";
    let processing: MazeCellKey | null = null;
    let highlights: readonly MazeCellKey[] = added;
    if (checkpoint.walls === null) {
      caption = walls.length === 0 ? text.setup : text.changed;
      category = walls.length === 0 ? "setup" : "changed";
      highlights = [];
    } else if (removed.length === 0 && added.length > 0 && added.every(key => border.has(key))) {
      caption = text.border; category = "border"; highlights = [];
    } else if (removed.length === 0 && added.length > 0 && added.every(key => pillars.has(key))) {
      caption = text.pillars; category = "pillars"; highlights = [];
    } else if (removed.length === 0 && added.length === 1) {
      category = "extend";
      const target = added[0];
      const { x, y } = parseMazeCellKey(target);
      const adjacentPillars = ([[0, -1], [0, 1], [-1, 0], [1, 0]] as const)
        .map(([dx, dy]) => mazeCellKey(x + dx, y + dy))
        .filter(key => pillars.has(key) && wallSet.has(key));
      const chosen = adjacentPillars.find(key => !extendedPillars.has(key)) ?? adjacentPillars[0];
      if (chosen) {
        const pillar = parseMazeCellKey(chosen);
        const direction = directionByDelta[`${x - pillar.x},${y - pillar.y}`];
        processing = chosen;
        extendedPillars.add(chosen);
        caption = direction ? text.extend.replace("{direction}", directionNames[direction]) : text.changed;
        highlights = [target];
      }
    }
    // 外周と柱は1マスずつ書かれるため、同じ種類の追加が続く間は1コマにまとめる
    // （フェーズ2の「外周」「柱」のコマに対応させる。BFSが距離代入とキュー追加を1コマにまとめるのと同じ扱い）。
    if ((category === "border" || category === "pillars") && category === lastCategory && steps.length > 0) {
      steps[steps.length - 1] = { ...steps[steps.length - 1], canvas: makeCanvas(size, walls, null, [], event) };
    } else {
      steps.push({ id: `trace-${steps.length}`, caption, canvas: makeCanvas(size, walls, processing, highlights, event) });
    }
    lastCategory = category;
    checkpoint.walls = wallSet;
    checkpoint.size = size;
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
    const previous = checkpoint.walls;
    if (checkpoint.size === size && previous !== null && walls.length === previous.size && walls.every(key => previous.has(key))) continue;
    emit(grid, size, event);
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
    const size = resultSize ?? eventSize ?? wallExtensionMainSize;
    const walls = resultSize !== null ? wallsOf(resultGrid!) : eventSize !== null ? wallsOf(finalEvent.locals.grid!) : [];
    steps.push({ id: "trace-0", caption: text.final, canvas: makeCanvas(size, walls, null, [], finalEvent, true) });
  }
  const last = steps[steps.length - 1];
  const caption = trace.status === "error" ? stoppedCaption(trace) : trace.status === "truncated" ? text.truncated : partial ? text.partial : mode === "final" ? text.final : text.ended;
  steps[steps.length - 1] = { ...last, caption, canvas: { ...last.canvas, highlights: mode === "final" ? [] : last.canvas.highlights, trace: { ...last.canvas.trace, line: trace.error?.line ?? (partial ? last.canvas.trace.line : trace.stoppedLine ?? last.canvas.trace.line), terminal: true } } };
  return {
    mode, notice: mode === "final" ? text.unsupported : trace.status === "truncated" ? text.truncated : partial ? text.partial : null,
    content: defineLearningContent({ version: 1, kind: "step-sequence", id: "wall-extension-own-trace", phase: 7, intervalMs: 3500,
      steps: steps as [LearningStep<WallExtensionTraceCanvas>, ...LearningStep<WallExtensionTraceCanvas>[]] },
      canvas => validateWallExtensionExecutionCanvas(canvas)),
  };
}
