import type { PythonTraceLocals } from "../../../../../lib/pythonTrace.types";
import type { LearningContent } from "../../../player/content.types";
import type { BfsExecutionCanvasState } from "../execution/execution.types";

export type BfsTraceCanvas = BfsExecutionCanvasState & {
  readonly trace: { readonly line: number | null; readonly variables: PythonTraceLocals; readonly terminal: boolean };
};
export type BfsTracePlayback = {
  readonly mode: "replay" | "final";
  readonly notice: string | null;
  readonly content: LearningContent<BfsTraceCanvas>;
};
