import { runProgramTests } from "../../../../lib/pyodideRunner";
import { analyzeExecutionError } from "../../../../lib/executionError";
import type { ImplementationInputLevel } from "../../implementation/inputLevel";
import type { ImplementationClearRecord } from "../../implementation/answerReveal";
import { binarySearchAutoTests, binarySearchImplementationContent as content, type ProgramTest } from "./implementation.content";

export type HintLevel = 1 | 2 | 3 | 4;
export type HintUsage = readonly [number, number, number, number];
export type FormatIssue = "empty" | "nonNumeric" | "length";
export type TestOutcome = { readonly id: string; readonly passed: boolean; readonly actual?: unknown; readonly error?: "syntax" | "runtime" | "timeout"; readonly errorLine?: number; readonly errorException?: string; readonly errorName?: string; readonly autoPassed?: number; readonly autoTotal?: number; readonly formatIssue?: FormatIssue };

/** 単元フロー接続時に渡す要約。集計はテスト実行とヒント利用から導く。 */
export type BinarySearchImplementationSummary = {
  readonly code?: string;
  readonly testRuns: number;
  readonly hintUsage: HintUsage;
  /** 完了時点の書き方（自由／橋渡しの型）。テストと完了条件は書き方によらず同一。 */
  readonly inputLevel: ImplementationInputLevel;
  /** フェーズ7の完了ごとの試行フラグ（ステージ2）。この完了分は1件だけ入れ、既存分への追記は保存側（LearningScreen）が担う。 */
  readonly clears?: readonly ImplementationClearRecord[];
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

/** 名前つきテストだけを見る全通過判定（自動チェック等の追加 outcome が混ざってもよい）。 */
export function allNamedTestsPassed(tests: readonly ProgramTest[], outcomes: readonly TestOutcome[]): boolean {
  return tests.length > 0 && tests.every(test => outcomes.some(outcome => outcome.id === test.id && outcome.passed));
}

/**
 * プログラムの標準出力を、位置を表す数値1つとして読む。
 * 空・数値でないもの混入・複数出力は、実行エラーとは別の
 * 「出力の形」の問題として返す。
 */
export function parseProgramOutput(stdout: string): { value: number } | { issue: FormatIssue } {
  const tokens = stdout.split(/\s+/u).filter(token => token.length > 0);
  if (tokens.length === 0) return { issue: "empty" };
  if (tokens.length !== 1) return { issue: "length" };
  const token = tokens[0];
  if (!/^[+-]?\d+$/u.test(token)) return { issue: "nonNumeric" };
  return { value: Number.parseInt(token, 10) };
}

function outcomeFromResult(test: ProgramTest, stdout: string, error: string | null): TestOutcome {
  if (error !== null) {
    const analysis = analyzeExecutionError(new Error(error));
    return { id: test.id, passed: false, error: analysis.kind, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}), ...(analysis.exception !== undefined ? { errorException: analysis.exception } : {}), ...(analysis.name !== undefined ? { errorName: analysis.name } : {}) };
  }
  const parsed = parseProgramOutput(stdout);
  if ("issue" in parsed) return { id: test.id, passed: false, formatIssue: parsed.issue };
  return { id: test.id, passed: parsed.value === test.expected, ...(test.visibility === "display" ? { actual: parsed.value } : {}) };
}

/** 例外でも他のケースを試すため、テストは1件ずつ実行する。判定用の生の標準出力はUI状態に渡さない。 */
export async function runImplementationTests(code: string, tests: readonly ProgramTest[], progress: (outcomes: readonly TestOutcome[]) => void, isCurrent = () => true) {
  const outcomes: TestOutcome[] = [];
  for (const test of tests) {
    if (!isCurrent()) break;
    try {
      const response = await runProgramTests(code, [{ id: test.id, input: test.inputText }]);
      const result = response.results.find(item => item.id === test.id);
      if (!result) throw new Error("Missing test result");
      outcomes.push(outcomeFromResult(test, result.stdout, result.error));
    } catch (error) {
      const analysis = analyzeExecutionError(error);
      outcomes.push({ id: test.id, passed: false, error: analysis.kind, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}), ...(analysis.exception !== undefined ? { errorException: analysis.exception } : {}), ...(analysis.name !== undefined ? { errorName: analysis.name } : {}) });
    }
    progress([...outcomes]);
  }
  return outcomes;
}

/** 自動チェックを1回の実行でまとめて判定する。 */
export async function runAutoTests(code: string): Promise<TestOutcome> {
  try {
    const response = await runProgramTests(code, binarySearchAutoTests.map(test => ({ id: test.id, input: test.inputText })));
    let passedCount = 0;
    let firstError: string | null = null;
    for (const test of binarySearchAutoTests) {
      const result = response.results.find(item => item.id === test.id);
      if (!result) continue;
      if (result.error !== null) { if (firstError === null) firstError = result.error; continue; }
      const parsed = parseProgramOutput(result.stdout);
      if (!("issue" in parsed) && parsed.value === test.expected) passedCount++;
    }
    if (firstError !== null && passedCount === 0) {
      const analysis = analyzeExecutionError(new Error(firstError));
      return { id: "AUTO", passed: false, error: analysis.kind, autoPassed: 0, autoTotal: binarySearchAutoTests.length, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}), ...(analysis.exception !== undefined ? { errorException: analysis.exception } : {}), ...(analysis.name !== undefined ? { errorName: analysis.name } : {}) };
    }
    return { id: "AUTO", passed: passedCount === binarySearchAutoTests.length, autoPassed: passedCount, autoTotal: binarySearchAutoTests.length };
  } catch (error) {
    const analysis = analyzeExecutionError(error);
    return { id: "AUTO", passed: false, error: analysis.kind, autoPassed: 0, autoTotal: binarySearchAutoTests.length, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}), ...(analysis.exception !== undefined ? { errorException: analysis.exception } : {}), ...(analysis.name !== undefined ? { errorName: analysis.name } : {}) };
  }
}
