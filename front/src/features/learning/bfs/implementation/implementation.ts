import { diffLines } from "diff";

import { runCourseMissionTests } from "../../../../lib/pyodideRunner";
import { bfsImplementationContent as content, type ImplementationTest } from "./implementation.content";

export type HintLevel = 1 | 2 | 3;
export type HintUsage = readonly [number, number, number];
export type TestOutcome = { readonly id: string; readonly passed: boolean; readonly actual?: unknown; readonly error?: "syntax" | "runtime" };
export const recordHintUsage = (usage: HintUsage, level: HintLevel): HintUsage => {
  if (level > 1 && usage[level - 2] === 0) return usage;
  return [usage[0] + (level === 1 ? 1 : 0), usage[1] + (level === 2 ? 1 : 0), usage[2] + (level === 3 ? 1 : 0)];
};
export function hintMessage(outcomes: readonly TestOutcome[]) {
  const kind = outcomes.length === 0 ? "unexecuted" : outcomes.some(outcome => outcome.error === "syntax") ? "syntax" :
    outcomes.some(outcome => outcome.error === "runtime") ? "runtime" : "mismatch";
  return content.hints.messages[kind];
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
      const message = error instanceof Error ? error.message : String(error);
      outcomes.push({ id: test.id, passed: false, error: /(?:SyntaxError|IndentationError|TabError):/u.test(message) ? "syntax" : "runtime" });
    }
    progress([...outcomes]);
  }
  return outcomes;
}
export type DiffRow = { readonly current?: string; readonly reference?: string; readonly changed: boolean };
/** 変更ブロック内の削除／追加を同じ行に対応させる。本文は補正しない。 */
export function codeDiff(current: string, reference = content.hints.referenceCode): DiffRow[] {
  const rows: DiffRow[] = [];
  const parts = diffLines(current, reference);
  const lines = (text: string) => text.replace(/\n$/u, "").split("\n");
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part.added && !part.removed) {
      rows.push(...lines(part.value).map(line => ({ current: line, reference: line, changed: false })));
      continue;
    }
    const left = part.removed ? lines(part.value) : [];
    let right = part.added ? lines(part.value) : [];
    if (part.removed && parts[i + 1]?.added) right = lines(parts[++i].value);
    for (let j = 0; j < Math.max(left.length, right.length); j++) rows.push({ current: left[j], reference: right[j], changed: true });
  }
  return rows;
}
