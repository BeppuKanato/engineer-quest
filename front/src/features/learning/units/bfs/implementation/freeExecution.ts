import { bfsImplementationContent as content } from "./implementation.content";
import { runFreeDisplayCase, type FreeExecutionResult } from "../../../implementation/freeExecution";

export const freeDisplayCase = content.tests.find(test => test.id === "D1" && test.visibility === "display");
export function runBfsFreeCode(code: string, onPrepared?: () => void, isCurrent?: () => boolean): Promise<FreeExecutionResult> {
  return runFreeDisplayCase(freeDisplayCase, code, onPrepared, isCurrent);
}
