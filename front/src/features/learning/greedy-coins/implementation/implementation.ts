import { runCourseMissionTests } from "../../../../lib/pyodideRunner";
import { analyzeExecutionError } from "../../../../lib/executionError";
import type { ImplementationInputLevel } from "../../implementation/inputLevel";
import type { GreedyCoinsCanvasState } from "../figure/greedyCoins.types";
import { greedyCoinsImplementationContent as content, type ImplementationTest } from "./implementation.content";

export type HintLevel = 1 | 2 | 3 | 4;
export type HintUsage = readonly [number, number, number, number];
export type TestOutcome = { readonly id: string; readonly passed: boolean; readonly actual?: unknown; readonly error?: "syntax" | "runtime" | "timeout"; readonly errorLine?: number };

/** 単元フロー接続時（後続Issue）に渡す要約。集計はテスト実行とヒント利用から導く。 */
export type GreedyCoinsImplementationSummary = {
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
export { classifyExecutionError } from "../../../../lib/executionError";
export function resultKinds(outcomes: readonly TestOutcome[]) {
  return (["syntax", "runtime", "timeout", "mismatch"] as const).filter(kind =>
    outcomes.some(outcome => kind === "mismatch" ? !outcome.passed && !outcome.error : outcome.error === kind));
}
export function runningMessage(completed: number, total: number) {
  return content.status.running.replace("{current}", String(Math.min(completed + 1, total))).replace("{total}", String(total));
}

/** 戻り値が硬貨（正の整数）のリストかどうか。空リストも「リストではある」として扱い、長さ違いとして示す。 */
export const isCoinListValue = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every(item => typeof item === "number" && Number.isInteger(item) && item > 0);

/** 同じ長さのリスト同士で、期待と違う場所の位置を列挙する。リストでない・長さが違う場合は null（長さ違いとして扱う）。 */
export function coinListDifferences(expected: unknown, actual: unknown): readonly number[] | null {
  if (!isCoinListValue(expected) || !isCoinListValue(actual) || expected.length !== actual.length) return null;
  const differences: number[] = [];
  expected.forEach((value, index) => {
    if (actual[index] !== value) differences.push(index);
  });
  return differences;
}

/**
 * 選んだ硬貨のリストを硬貨図（トレイ）の Canvas へ変換する。トレイとして
 * 描けるのは、額面に含まれ・選択順（単調非増加）で・合計が金額以下の場合だけ。
 * それ以外は null を返し、呼び出し側が文字列の並びで示す。
 * 額面の状態は、最後に選んだ硬貨の額面までを通過済みとする。
 */
export function coinTrayCanvas(amount: number, coins: readonly number[], tray: readonly number[]): GreedyCoinsCanvasState | null {
  if (!isCoinListValue(tray) && tray.length !== 0) return null;
  if (tray.some((coin, index) => !coins.includes(coin) || (index > 0 && coin > tray[index - 1]))) return null;
  const paid = tray.reduce((sum, coin) => sum + coin, 0);
  if (paid > amount) return null;
  const lastIndex = tray.length === 0 ? -1 : coins.indexOf(tray[tray.length - 1]);
  return {
    data: { kind: "greedy-coins" },
    state: {
      coins: [...coins], amount, remaining: amount - paid, tray: [...tray],
      coinStatuses: coins.map((_, index) => (index <= lastIndex ? "passed" as const : "upcoming" as const)),
    },
    highlights: [],
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
