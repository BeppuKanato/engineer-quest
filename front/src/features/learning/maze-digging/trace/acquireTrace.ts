import { disposePyodideRunner, preparePyodide, tracePythonFunction } from "../../../../lib/pyodideRunner";
import { mazeDiggingImplementationContent } from "../implementation/implementation.content";

export const mazeDiggingTraceEventLimit = 500;
/** 前の採点用入力を持ち込まず、毎回新しいWorkerへ表示用D1の引数だけを送る（BFS・棒倒し法トレースと同じ経路）。 */
export async function traceMazeDiggingCode(code: string, isCurrent = () => true) {
  const displayCase = mazeDiggingImplementationContent.tests.find(test => test.id === "D1");
  if (!displayCase || displayCase.visibility !== "display") throw new Error("D1 must be a display case");
  disposePyodideRunner();
  try {
    await preparePyodide();
    if (!isCurrent()) throw new Error("Trace cancelled");
    const response = await tracePythonFunction({ code, functionName: displayCase.functionName, args: displayCase.args, maxEvents: mazeDiggingTraceEventLimit });
    return response.trace;
  } catch (error) {
    if (isCurrent()) disposePyodideRunner();
    throw error;
  }
}
