import { disposePyodideRunner, preparePyodide, tracePythonFunction } from "../../../../../lib/pyodideRunner";
import { wallExtensionImplementationContent } from "../implementation/implementation.content";

export const wallExtensionTraceEventLimit = 500;
/** 前の採点用入力を持ち込まず、毎回新しいWorkerへ表示用D1の引数だけを送る（BFSトレースと同じ経路）。 */
export async function traceWallExtensionCode(code: string, isCurrent = () => true) {
  const displayCase = wallExtensionImplementationContent.tests.find(test => test.id === "D1");
  if (!displayCase || displayCase.visibility !== "display") throw new Error("D1 must be a display case");
  disposePyodideRunner();
  try {
    await preparePyodide();
    if (!isCurrent()) throw new Error("Trace cancelled");
    const response = await tracePythonFunction({ code, functionName: displayCase.functionName, args: displayCase.args, maxEvents: wallExtensionTraceEventLimit });
    return response.trace;
  } catch (error) {
    if (isCurrent()) disposePyodideRunner();
    throw error;
  }
}
