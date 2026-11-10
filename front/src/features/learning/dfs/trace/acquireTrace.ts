import { disposePyodideRunner, preparePyodide, tracePythonFunction } from "../../../../lib/pyodideRunner";
import { freeDisplayCase } from "../implementation/implementation.content";

export const dfsTraceEventLimit = 500;

/** 採点の Worker を破棄し、新しい Worker に表示用 D1 の引数だけを渡す。 */
export async function traceDfsCode(code: string, isCurrent = () => true) {
  disposePyodideRunner();
  try {
    await preparePyodide();
    if (!isCurrent()) throw new Error("Trace cancelled");
    const { functionName, args } = freeDisplayCase;
    const response = await tracePythonFunction({ code, functionName, args, maxEvents: dfsTraceEventLimit, traceKind: "dfs" });
    return response.trace;
  } catch (error) {
    if (isCurrent()) disposePyodideRunner();
    throw error;
  }
}
