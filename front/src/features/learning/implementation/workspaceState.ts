import type { PythonTestCase } from "../../../lib/pyodideRunner";
import type { ImplementationInputLevel } from "./inputLevel";

export type ImplementationTest = PythonTestCase & { readonly visibility: "display" | "judgement" };
export type HintLevel = 1 | 2 | 3 | 4;
export type HintUsage = readonly [number, number, number, number];
export type TestOutcome = { readonly id: string; readonly passed: boolean; readonly actual?: unknown; readonly error?: "syntax" | "runtime" | "timeout"; readonly errorLine?: number };
export type ImplementationSummary = { testRuns: number; hintUsage: HintUsage; inputLevel: ImplementationInputLevel };
export const recordHintUsage = (usage: HintUsage, level: HintLevel): HintUsage => {
  if (level > 1 && usage[level - 2] === 0) return usage;
  return [usage[0] + (level === 1 ? 1 : 0), usage[1] + (level === 2 ? 1 : 0), usage[2] + (level === 3 ? 1 : 0), usage[3] + (level === 4 ? 1 : 0)];
};
export function allTestsPassed(tests: readonly {id: string}[], outcomes: readonly TestOutcome[]): boolean {
  return tests.length > 0 && tests.length === outcomes.length && tests.every(test => outcomes.some(outcome => outcome.id === test.id && outcome.passed));
}
export function runningMessage(template: string, completed: number, total: number) {
  return template.replace("{current}", String(Math.min(completed + 1, total))).replace("{total}", String(total));
}
