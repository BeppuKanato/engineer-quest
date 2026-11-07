import type { PythonTraceLocals } from "../../../../lib/pythonTrace.types";
import type { LearningContent } from "../../player/content.types";
import type { MazeDiggingExecutionCanvasState } from "../execution/execution.types";

export type MazeDiggingTraceCanvas = MazeDiggingExecutionCanvasState & {
  readonly trace: { readonly line: number | null; readonly variables: PythonTraceLocals; readonly terminal: boolean };
};
export type MazeDiggingTracePlayback = {
  readonly mode: "replay" | "final";
  readonly notice: string | null;
  readonly content: LearningContent<MazeDiggingTraceCanvas>;
};
