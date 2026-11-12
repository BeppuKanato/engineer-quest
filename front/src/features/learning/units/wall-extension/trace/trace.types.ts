import type { PythonTraceLocals } from "../../../../../lib/pythonTrace.types";
import type { LearningContent } from "../../../player/content.types";
import type { WallExtensionExecutionCanvasState } from "../execution/execution.types";

export type WallExtensionTraceCanvas = WallExtensionExecutionCanvasState & {
  readonly trace: { readonly line: number | null; readonly variables: PythonTraceLocals; readonly terminal: boolean };
};
export type WallExtensionTracePlayback = {
  readonly mode: "replay" | "final";
  readonly notice: string | null;
  readonly content: LearningContent<WallExtensionTraceCanvas>;
};
