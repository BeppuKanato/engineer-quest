import { disposePyodideRunner, preparePyodide, runProgramFree } from "../../../../lib/pyodideRunner";
import { binarySearchImplementationContent as content } from "./implementation.content";
import { parseProgramOutput } from "./implementation";
import { analyzeExecutionError } from "../../../../lib/executionError";

export const freeOutputLimit = 16_000;
export type FreeExecutionResult = {
  stdout: string; outputTruncated: boolean;
} & ({ returned: true; actual: unknown; error: "mismatch" | null } | { returned: false; error: "syntax" | "runtime" | "timeout" | "unavailable"; errorLine?: number; errorException?: string; errorName?: string });
export const freeDisplayCase = content.tests.find(test => test.id === "D1" && test.visibility === "display");

/** 判定用の入力が残ったWorkerを再利用せず、基本テストの入力だけでプログラムを実行する。 */
export async function runBinarySearchFreeCode(code: string, onPrepared: () => void = () => {}, isCurrent = () => true): Promise<FreeExecutionResult> {
  if (!freeDisplayCase || freeDisplayCase.visibility !== "display") throw new Error("D1 must be a display case");
  disposePyodideRunner();
  try { await preparePyodide(); }
  catch { if (isCurrent()) disposePyodideRunner(); return { stdout: "", outputTruncated: false, returned: false, error: "unavailable" }; }
  if (!isCurrent()) throw new Error("Free execution cancelled");
  onPrepared();
  let stdout = "", outputTruncated = false, lines = 0;
  try {
    await runProgramFree(code, freeDisplayCase.inputText, {
      maxOutputChars: freeOutputLimit,
      onStdout: line => {
        const chunk = (lines++ ? "\n" : "") + line;
        if (stdout.length + chunk.length > freeOutputLimit) outputTruncated = true;
        stdout += chunk.slice(0, Math.max(0, freeOutputLimit - stdout.length));
      },
    });
    const parsed = parseProgramOutput(stdout);
    if ("issue" in parsed) return { stdout, outputTruncated, returned: true, actual: null, error: "mismatch" };
    return { stdout, outputTruncated, returned: true, actual: parsed.value, error: parsed.value === freeDisplayCase.expected ? null : "mismatch" };
  } catch (error) {
    if (isCurrent()) disposePyodideRunner();
    const analysis = analyzeExecutionError(error);
    return { stdout, outputTruncated, returned: false, error: analysis.kind, ...(analysis.line !== undefined ? { errorLine: analysis.line } : {}), ...(analysis.exception !== undefined ? { errorException: analysis.exception } : {}), ...(analysis.name !== undefined ? { errorName: analysis.name } : {}) };
  }
}
