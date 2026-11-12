import { disposePyodideRunner, preparePyodide, tracePythonFunction } from "../../../../../lib/pyodideRunner";
import { greedyCoinsImplementationContent } from "../implementation/implementation.content";

export const greedyCoinsTraceEventLimit = 500;
/** 前の採点用入力を持ち込まず、毎回新しいWorkerへD1の引数だけを送る。 */
export async function traceGreedyCoinsCode(code: string, isCurrent = () => true) {
  const displayCase = greedyCoinsImplementationContent.tests.find(test => test.id === "D1");
  if (!displayCase || displayCase.visibility !== "display") throw new Error("D1 must be a display case");
  disposePyodideRunner();
  try {
    await preparePyodide();
    if (!isCurrent()) throw new Error("Trace cancelled");
    const response = await tracePythonFunction({ code, functionName: displayCase.functionName, args: displayCase.args, maxEvents: greedyCoinsTraceEventLimit });
    return response.trace;
  } catch (error) {
    if (isCurrent()) disposePyodideRunner();
    throw error;
  }
}
