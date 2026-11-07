import { disposePyodideRunner, preparePyodide, tracePythonFunction } from "../../../../lib/pyodideRunner";
import { mazeDiggingImplementationContent } from "../implementation/implementation.content";

/** 参照コードでもD1で662件のイベントが発生する（掘削ごとに候補収集ループを回すため）。BFS・棒倒し法の500では正準の再生自体が打ち切られるので、この単元では1000を上限にする。 */
export const mazeDiggingTraceEventLimit = 1000;
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
