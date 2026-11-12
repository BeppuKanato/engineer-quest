import { defineLearningContent, type LearningContent } from "../../../player/content.types";
import { bubbleSortComparisons, bubbleSortMainValues } from "../bubbleSort";
import { bubbleSortExecutionContent } from "../execution/execution.content";
import type { BubbleSortExecutionCanvasState } from "../execution/execution.types";
import { bubbleSortCode, type BubbleSortCodeLineId } from "./bubbleSortCode";

/**
 * 表示する変数は、参照コード bubble_sort の実際のローカル変数の射影。
 * result は盤面そのものが表示を担うが、到達し得る配列かどうかを検証するため型には含める
 * （表示行は presentation が i / j / n と現在のペアへ射影する）。未代入は null で区別する。
 * i・j は Python の実セマンティクスどおり、ループを抜けた後も最後の値を保持する
 * （検証は CPython のトレースと突き合わせる）。
 */
export type BubbleSortCodeVariables = {
  readonly result: readonly number[] | null;
  readonly n: number | null;
  readonly i: number | null;
  readonly j: number | null;
};

export type BubbleSortCodeMappingCanvasState = {
  readonly data: { readonly kind: "bubble-sort-code-mapping"; readonly code: typeof bubbleSortCode };
  readonly state: {
    readonly executionStepId: string;
    readonly execution: BubbleSortExecutionCanvasState;
    readonly frameKind: "code" | "execution";
    readonly captionKind: "structure" | "evaluation" | "assignment";
    readonly variables: BubbleSortCodeVariables;
  };
  readonly highlights: readonly [{ readonly kind: "code-line"; readonly id: BubbleSortCodeLineId }];
};

export type BubbleSortCodeMappingContent = LearningContent<BubbleSortCodeMappingCanvasState> & {
  readonly stageName: "動きとコードの対応";
};

/** 盤面は複製せず、フェーズ2の完全状態へ直接参照する。 */
export function executionStep(id: string) {
  const step = bubbleSortExecutionContent.steps.find(step => step.id === id);
  if (!step) throw new Error(`Unknown bubble-sort execution step: ${id}`);
  return step;
}

/** 参照コードの実行で result が取り得る配列は、初期値と比較ごとの比較後の配列に限られる。 */
const reachableResults: ReadonlySet<string> = new Set(
  [bubbleSortMainValues, ...bubbleSortComparisons(bubbleSortMainValues).map(comparison => comparison.after)]
    .map(values => JSON.stringify(values)),
);

export function validateBubbleSortCodeMappingCanvas(canvas: BubbleSortCodeMappingCanvasState): void {
  const { execution, executionStepId, variables } = canvas.state;
  if (canvas.data.code !== bubbleSortCode || execution !== executionStep(executionStepId).canvas) {
    throw new Error("Code frames must reference the canonical code and execution snapshot");
  }
  const lineId = canvas.highlights[0]?.id;
  if (canvas.highlights.length !== 1 || !bubbleSortCode.lines.some(line => line.id === lineId)) {
    throw new Error("Unknown bubble-sort code line");
  }
  const length = bubbleSortMainValues.length;
  if (variables.n !== null && variables.n !== length) throw new Error("Code variables must use the main teaching values");
  const inRange = (value: number | null) =>
    value === null || (Number.isInteger(value) && value >= 0 && value < length - 1);
  if (!inRange(variables.i) || !inRange(variables.j)) {
    throw new Error("Invalid bubble-sort scalar variable");
  }
  if (variables.result !== null && !reachableResults.has(JSON.stringify(variables.result))) {
    throw new Error("result must be a state the reference code can reach");
  }
}

export function defineBubbleSortCodeMappingContent(
  content: BubbleSortCodeMappingContent,
): BubbleSortCodeMappingContent {
  defineLearningContent(content, validateBubbleSortCodeMappingCanvas);
  const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
  if (checkpoints.map(step => step.canvas.state.executionStepId).join() !==
    bubbleSortExecutionContent.steps.map(step => step.id).join()) {
    throw new Error("Keep all 16 execution checkpoints in order");
  }
  if (bubbleSortCode.lines.some(line => !content.steps.some(step => step.canvas.highlights[0].id === line.id))) {
    throw new Error("Unvisited code line");
  }
  return content;
}
