import type { PythonTraceLocals } from "../../../../lib/pythonTrace.types";
import type { BinarySearchExecutionCanvasState } from "../execution/execution.types";
import type { LearningContent } from "../../player/content.types";

/** フェーズ2と同じ盤面（BinarySearchExecutionCanvasState）に、観測行・変数・終端のメタデータを付けたもの。 */
export type BinarySearchTraceCanvas = BinarySearchExecutionCanvasState & {
  readonly trace: { readonly line: number | null; readonly variables: PythonTraceLocals; readonly terminal: boolean };
};
export type BinarySearchTracePlayback = {
  readonly mode: "replay" | "final";
  readonly notice: string | null;
  readonly content: LearningContent<BinarySearchTraceCanvas>;
};
