import { defineLearningContent, type LearningContent } from "../../player/content.types";
import { binarySearchMainValues } from "../binarySearch";
import { binarySearchExecutionContent } from "../execution/execution.content";
import type { BinarySearchExecutionCanvasState } from "../execution/execution.types";
import { binarySearchCode, type BinarySearchCodeLineId } from "./binarySearchCode";

/**
 * 表示する変数は、参照コード binary_search の実際のローカル変数の射影。
 * values[mid] は盤面そのもの（values）と mid から presentation が射影するため型には含めない。
 * 未代入は null で区別する。mid は Python の実セマンティクスどおり、範囲が狭まった後も
 * 次に代入されるまで最後の値を保持する（検証は CPython のトレースと突き合わせる）。
 * フェーズ4は主教材の発見ケースだけを扱うため、範囲は常に lo <= hi を保つ。
 */
export type BinarySearchCodeVariables = {
  readonly lo: number | null;
  readonly hi: number | null;
  readonly mid: number | null;
};

export type BinarySearchCodeMappingCanvasState = {
  readonly data: { readonly kind: "binary-search-code-mapping"; readonly code: typeof binarySearchCode };
  readonly state: {
    readonly executionStepId: string;
    readonly execution: BinarySearchExecutionCanvasState;
    readonly frameKind: "code" | "execution";
    readonly captionKind: "structure" | "evaluation" | "assignment";
    readonly variables: BinarySearchCodeVariables;
  };
  readonly highlights: readonly [{ readonly kind: "code-line"; readonly id: BinarySearchCodeLineId }];
};

export type BinarySearchCodeMappingContent = LearningContent<BinarySearchCodeMappingCanvasState> & {
  readonly stageName: "動きとコードの対応";
};

/** 盤面は複製せず、フェーズ2の完全状態へ直接参照する。 */
export function executionStep(id: string) {
  const step = binarySearchExecutionContent.steps.find(step => step.id === id);
  if (!step) throw new Error(`Unknown binary-search execution step: ${id}`);
  return step;
}

/**
 * チェックポイントが担うフェーズ2ステップ。導入（introduce）は範囲も変数も無い開始盤面として
 * コード側フレームがそのまま示し、まとめ（summary）は実行が return で終わった後の振り返りで
 * 対応するコード状態が存在しないため、チェックポイントには含めない。
 */
export const checkpointStepIds: readonly string[] =
  binarySearchExecutionContent.steps.map(step => step.id).filter(id => id !== "introduce" && id !== "summary");

export function validateBinarySearchCodeMappingCanvas(canvas: BinarySearchCodeMappingCanvasState): void {
  const { execution, executionStepId, variables } = canvas.state;
  if (canvas.data.code !== binarySearchCode || execution !== executionStep(executionStepId).canvas) {
    throw new Error("Code frames must reference the canonical code and execution snapshot");
  }
  const lineId = canvas.highlights[0]?.id;
  if (canvas.highlights.length !== 1 || !binarySearchCode.lines.some(line => line.id === lineId)) {
    throw new Error("Unknown binary-search code line");
  }
  const length = binarySearchMainValues.length;
  const inRange = (value: number | null) =>
    value === null || (Number.isInteger(value) && value >= 0 && value < length);
  if (!inRange(variables.lo) || !inRange(variables.hi) || !inRange(variables.mid)) {
    throw new Error("Invalid binary-search scalar variable");
  }
  if (variables.lo !== null && variables.hi !== null && variables.lo > variables.hi) {
    throw new Error("Range must stay non-empty in the found case");
  }
}

export function defineBinarySearchCodeMappingContent(
  content: BinarySearchCodeMappingContent,
): BinarySearchCodeMappingContent {
  defineLearningContent(content, validateBinarySearchCodeMappingCanvas);
  const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
  if (checkpoints.map(step => step.canvas.state.executionStepId).join() !== checkpointStepIds.join()) {
    throw new Error(`Keep all ${checkpointStepIds.length} execution checkpoints in order`);
  }
  // return-missing は主教材の発見ケースでは到達しない（不在ケースはフェーズ6で扱う）。
  // それ以外の行はすべて、実行どおりに少なくとも1回はハイライトされる。
  const visited = new Set(content.steps.map(step => step.canvas.highlights[0].id));
  for (const line of binarySearchCode.lines) {
    if (line.id === "return-missing") {
      if (visited.has(line.id)) throw new Error("return-missing must stay unvisited in the found case");
    } else if (!visited.has(line.id)) {
      throw new Error("Unvisited code line");
    }
  }
  return content;
}
