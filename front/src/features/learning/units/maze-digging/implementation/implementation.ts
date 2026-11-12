import { runCourseMissionTests } from "../../../../../lib/pyodideRunner";
import { analyzeExecutionError } from "../../../../../lib/executionError";
import type { ImplementationInputLevel } from "../../../implementation/inputLevel";
import { mazeCellKey, type MazeGridCanvasState } from "../../../player/mazeGrid.types";
import { mazeDiggingImplementationContent as content, type ImplementationTest } from "./implementation.content";

export type HintLevel = 1 | 2 | 3 | 4;
export type HintUsage = readonly [number, number, number, number];
export type TestOutcome = { readonly id: string; readonly passed: boolean; readonly actual?: unknown; readonly error?: "syntax" | "runtime" | "timeout"; readonly errorLine?: number };

/** 単元フロー接続時（後続Issue）に渡す要約。集計はテスト実行とヒント利用から導く。 */
export type MazeDiggingImplementationSummary = {
  readonly testRuns: number;
  readonly hintUsage: HintUsage;
  /** 完了時点の入力量レベル（Issue #328）。テストと完了条件はレベルによらず同一。 */
  readonly inputLevel: ImplementationInputLevel;
};

export const recordHintUsage = (usage: HintUsage, level: HintLevel): HintUsage => {
  if (level > 1 && usage[level - 2] === 0) return usage;
  return [usage[0] + (level === 1 ? 1 : 0), usage[1] + (level === 2 ? 1 : 0), usage[2] + (level === 3 ? 1 : 0), usage[3] + (level === 4 ? 1 : 0)];
};
/** エラーの分類・行番号の解析は共通モジュール（lib/executionError）が正。 */
export { classifyExecutionError } from "../../../../../lib/executionError";
export function resultKinds(outcomes: readonly TestOutcome[]) {
  return (["syntax", "runtime", "timeout", "mismatch"] as const).filter(kind =>
    outcomes.some(outcome => kind === "mismatch" ? !outcome.passed && !outcome.error : outcome.error === kind));
}
export function runningMessage(completed: number, total: number) {
  return content.status.running.replace("{current}", String(Math.min(completed + 1, total))).replace("{total}", String(total));
}

/** 戻り値が迷路の盤面（0と1だけの正方の2次元リスト）かどうか。大きさの一致は呼び出し側で見る。 */
export const isMazeGridValue = (value: unknown): value is number[][] =>
  Array.isArray(value) && value.length > 0 &&
  value.every(row => Array.isArray(row) && row.length === value.length && row.every(cell => cell === 0 || cell === 1));

/** 盤面の値をグリッド描画用の Canvas へ変換する。期待と違うマスは highlight で示せる。 */
export function mazeGridCanvas(grid: number[][], differentCells: readonly { x: number; y: number }[] = []): MazeGridCanvasState {
  const walls: string[] = [];
  grid.forEach((row, y) => row.forEach((cell, x) => { if (cell === 1) walls.push(mazeCellKey(x, y)); }));
  return {
    data: { kind: "maze-grid", size: grid.length },
    state: { walls, processing: null, target: null, path: [], start: null, goal: null },
    highlights: differentCells.map(cell => ({ kind: "cell" as const, id: mazeCellKey(cell.x, cell.y) })),
  };
}

export type GridDifference = { readonly x: number; readonly y: number; readonly expected: number; readonly actual: number };
/** 同じ大きさの盤面同士で、期待と違うマスを列挙する。大きさが違う場合は null（大きさ違いとして扱う）。 */
export function gridDifferences(expected: unknown, actual: unknown): GridDifference[] | null {
  if (!isMazeGridValue(expected) || !isMazeGridValue(actual) || expected.length !== actual.length) return null;
  const differences: GridDifference[] = [];
  expected.forEach((row, y) => row.forEach((cell, x) => {
    if (actual[y][x] !== cell) differences.push({ x, y, expected: cell, actual: actual[y][x] });
  }));
  return differences;
}

export function allTestsPassed(tests: readonly ImplementationTest[], outcomes: readonly TestOutcome[]): boolean {
  return tests.length > 0 && tests.length === outcomes.length && tests.every(test => outcomes.some(outcome => outcome.id === test.id && outcome.passed));
}
/** 例外でも他のケースを試す。判定用の値・標準出力・生の例外はUI状態に渡さない。 */
export async function runImplementationTests(code: string, tests: readonly ImplementationTest[], progress: (outcomes: readonly TestOutcome[]) => void, isCurrent = () => true) {
  const outcomes: TestOutcome[] = [];
  for (const test of tests) {
    if (!isCurrent()) break;
    try {
      const response = await runCourseMissionTests(code, [test]);
      const result = response.results.find(result => result.id === test.id);
      if (!result) throw new Error("Missing test result");
      outcomes.push({ id: test.id, passed: result.passed, ...(test.visibility === "display" ? { actual: result.actual } : {}) });
    } catch (error) {
      const analysis = analyzeExecutionError(error);
      outcomes.push({ id: test.id, passed: false, error: analysis.kind, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}) });
    }
    progress([...outcomes]);
  }
  return outcomes;
}
