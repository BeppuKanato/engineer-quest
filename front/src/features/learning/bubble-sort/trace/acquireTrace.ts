import { disposePyodideRunner, preparePyodide, tracePythonFunction } from "../../../../lib/pyodideRunner";
import { bubbleSortImplementationContent } from "../implementation/implementation.content";

export const bubbleSortTraceEventLimit = 500;
/** 前の採点用入力を持ち込まず、毎回新しいWorkerへD1の引数だけを送る。 */
export async function traceBubbleSortCode(code: string, isCurrent = () => true) {
  const displayCase = bubbleSortImplementationContent.tests.find(test => test.id === "D1");
  if (!displayCase || displayCase.visibility !== "display") throw new Error("D1 must be a display case");
  disposePyodideRunner();
  try {
    await preparePyodide();
    if (!isCurrent()) throw new Error("Trace cancelled");
    const response = await tracePythonFunction({ code, functionName: displayCase.functionName, args: displayCase.args, maxEvents: bubbleSortTraceEventLimit });
    return response.trace;
  } catch (error) {
    if (isCurrent()) disposePyodideRunner();
    throw error;
  }
}
