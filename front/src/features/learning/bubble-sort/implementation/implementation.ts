import { runCourseMissionTests } from "../../../../lib/pyodideRunner";
import { analyzeExecutionError } from "../../../../lib/executionError";
import type { ArrayBarsCanvasState } from "../../player/arrayBars.types";
import { bubbleSortImplementationContent as content, type ImplementationTest } from "./implementation.content";

export type HintLevel = 1 | 2 | 3 | 4;
export type HintUsage = readonly [number, number, number, number];
export type TestOutcome = { readonly id: string; readonly passed: boolean; readonly actual?: unknown; readonly error?: "syntax" | "runtime" | "timeout"; readonly errorLine?: number };

/** 単元フロー接続時（後続Issue）に渡す要約。集計はテスト実行とヒント利用から導く。 */
export type BubbleSortImplementationSummary = {
  readonly testRuns: number;
  readonly hintUsage: HintUsage;
};

export const recordHintUsage = (usage: HintUsage, level: HintLevel): HintUsage => {
  if (level > 1 && usage[level - 2] === 0) return usage;
  return [usage[0] + (level === 1 ? 1 : 0), usage[1] + (level === 2 ? 1 : 0), usage[2] + (level === 3 ? 1 : 0), usage[3] + (level === 4 ? 1 : 0)];
};
/** エラーの分類・行番号の解析は共通モジュール（lib/executionError）が正。 */
export { classifyExecutionError } from "../../../../lib/executionError";
export function resultKinds(outcomes: readonly TestOutcome[]) {
  return (["syntax", "runtime", "timeout", "mismatch"] as const).filter(kind =>
    outcomes.some(outcome => kind === "mismatch" ? !outcome.passed && !outcome.error : outcome.error === kind));
}
export function runningMessage(completed: number, total: number) {
  return content.status.running.replace("{current}", String(Math.min(completed + 1, total))).replace("{total}", String(total));
}

/** 戻り値が数値のリストかどうか（長さ1以上、有限な数だけ）。 */
export const isNumberListValue = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length > 0 &&
  value.every(item => typeof item === "number" && Number.isFinite(item));

/** 棒グラフで描ける数値のリストかどうか（高さで表すため負の値は描けない）。 */
export const isDrawableArrayValue = (value: unknown): value is number[] =>
  isNumberListValue(value) && value.every(item => item >= 0);

/** リストの値を配列描画用の Canvas へ変換する。期待と違う場所は highlight で示せる。結果表示では確定範囲を持たない。 */
export function arrayBarsCanvas(values: readonly number[], differentIndices: readonly number[] = []): ArrayBarsCanvasState {
  return {
    data: { kind: "array-bars" },
    state: { values: [...values], comparing: null, fixedFrom: values.length },
    highlights: differentIndices.map(index => ({ kind: "cell" as const, id: index })),
  };
}

/** 同じ長さのリスト同士で、期待と違う場所の位置を列挙する。リストでない・長さが違う場合は null（長さ違いとして扱う）。 */
export function arrayDifferences(expected: unknown, actual: unknown): readonly number[] | null {
  if (!isNumberListValue(expected) || !isNumberListValue(actual) || expected.length !== actual.length) return null;
  const differences: number[] = [];
  expected.forEach((value, index) => {
    if (actual[index] !== value) differences.push(index);
  });
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
