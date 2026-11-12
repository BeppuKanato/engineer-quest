import { runCourseMissionTests } from "../../../../../lib/pyodideRunner";
import { analyzeExecutionError } from "../../../../../lib/executionError";
import type { ImplementationInputLevel } from "../../../implementation/inputLevel";
import type { ArrayBarsCanvasState } from "../../../player/arrayBars.types";
import { binarySearchImplementationContent as content, type ImplementationTest } from "./implementation.content";

export type HintLevel = 1 | 2 | 3 | 4;
export type HintUsage = readonly [number, number, number, number];
export type TestOutcome = { readonly id: string; readonly passed: boolean; readonly actual?: unknown; readonly error?: "syntax" | "runtime" | "timeout"; readonly errorLine?: number };

/** 単元フロー接続時（後続Issue）に渡す要約。集計はテスト実行とヒント利用から導く。 */
export type BinarySearchImplementationSummary = {
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

/** 戻り値が位置を表す整数かどうか（-1 は「無い」を表すため範囲に含める）。 */
export const isIndexValue = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

/**
 * リストと位置を配列描画用の Canvas へ変換する。位置が範囲内なら、そのセルを
 * 処理中の青＋強調リングで示す（盤面型の found の写像と同じ）。-1 や範囲外は
 * どのセルも指さない。結果表示では確定範囲を持たない。
 */
export function indexCanvas(values: readonly number[], index: number): ArrayBarsCanvasState {
  const inRange = index >= 0 && index < values.length;
  return {
    data: { kind: "array-bars" },
    state: {
      values: [...values], comparing: null, fixedFrom: values.length,
      cellStatuses: values.map((_, position) => (position === index ? "processing" as const : "idle" as const)),
    },
    highlights: inRange ? [{ kind: "cell" as const, id: index }] : [],
  };
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
