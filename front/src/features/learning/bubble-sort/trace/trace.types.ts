import type { PythonTraceLocals } from "../../../../lib/pythonTrace.types";
import type { ArrayBarsCanvasState } from "../../player/arrayBars.types";
import type { LearningContent } from "../../player/content.types";

export type BubbleSortTraceCanvas = ArrayBarsCanvasState & {
  readonly trace: { readonly line: number | null; readonly variables: PythonTraceLocals; readonly terminal: boolean };
};
export type BubbleSortTracePlayback = {
  readonly mode: "replay" | "final";
  readonly notice: string | null;
  readonly content: LearningContent<BubbleSortTraceCanvas>;
};
