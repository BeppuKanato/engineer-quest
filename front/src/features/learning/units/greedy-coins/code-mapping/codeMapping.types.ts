import { defineLearningContent, type LearningContent } from "../../../player/content.types";
import { greedyCoinsDenominations, greedyCoinsSelections, greedyCoinsMainAmount } from "../greedyCoins";
import { greedyCoinsExecutionContent } from "../execution/execution.content";
import type { GreedyCoinsExecutionCanvasState } from "../execution/execution.types";
import { greedyCoinsCode, type GreedyCoinsCodeLineId } from "./greedyCoinsCode";

/**
 * 表示する変数は、参照コード greedy_coins の実際のローカル変数の射影。
 * 未代入は null で区別する（result は関数に入る前だけ null、初期化後は空リスト）。
 * フェーズ4は主教材（786円）だけを扱い、result は参照コードの選択列の
 * 先頭からの部分列に限られる。
 */
export type GreedyCoinsCodeVariables = {
  readonly remaining: number | null;
  readonly coin: number | null;
  readonly result: readonly number[] | null;
};

export type GreedyCoinsCodeMappingCanvasState = {
  readonly data: { readonly kind: "greedy-coins-code-mapping"; readonly code: typeof greedyCoinsCode };
  readonly state: {
    readonly executionStepId: string;
    readonly execution: GreedyCoinsExecutionCanvasState;
    readonly frameKind: "code" | "execution";
    readonly captionKind: "structure" | "evaluation" | "assignment";
    readonly variables: GreedyCoinsCodeVariables;
  };
  readonly highlights: readonly [{ readonly kind: "code-line"; readonly id: GreedyCoinsCodeLineId }];
};

export type GreedyCoinsCodeMappingContent = LearningContent<GreedyCoinsCodeMappingCanvasState> & {
  readonly stageName: "動きとコードの対応";
};

/** 盤面は複製せず、フェーズ2の完全状態へ直接参照する。 */
export function executionStep(id: string) {
  const step = greedyCoinsExecutionContent.steps.find(step => step.id === id);
  if (!step) throw new Error(`Unknown greedy-coins execution step: ${id}`);
  return step;
}

/**
 * チェックポイントが担うフェーズ2ステップ。基準データ §3 フェーズ4の定めで、
 * チェックポイントは `result.append(coin)` の実行9回であり、フェーズ2の
 * 選択ステップ（select-1〜select-9）と順序どおり対応する。導入（introduce）と
 * まとめ（summary）は選択ではないためチェックポイントには含めない
 * （summary は return フレームの盤面としてだけ参照する）。
 */
export const checkpointStepIds: readonly string[] =
  greedyCoinsExecutionContent.steps.map(step => step.id).filter(id => id.startsWith("select-"));

export function validateGreedyCoinsCodeMappingCanvas(canvas: GreedyCoinsCodeMappingCanvasState): void {
  const { execution, executionStepId, variables } = canvas.state;
  if (canvas.data.code !== greedyCoinsCode || execution !== executionStep(executionStepId).canvas) {
    throw new Error("Code frames must reference the canonical code and execution snapshot");
  }
  const lineId = canvas.highlights[0]?.id;
  if (canvas.highlights.length !== 1 || !greedyCoinsCode.lines.some(line => line.id === lineId)) {
    throw new Error("Unknown greedy-coins code line");
  }
  if (variables.remaining !== null
    && (!Number.isInteger(variables.remaining) || variables.remaining < 0 || variables.remaining > greedyCoinsMainAmount)) {
    throw new Error("Invalid greedy-coins remaining variable");
  }
  if (variables.coin !== null && !greedyCoinsDenominations.includes(variables.coin)) {
    throw new Error("Invalid greedy-coins coin variable");
  }
  if (variables.result !== null) {
    const selections = greedyCoinsSelections(greedyCoinsMainAmount, greedyCoinsDenominations).map(s => s.coin);
    if (!Array.isArray(variables.result) || variables.result.length > selections.length
      || variables.result.some((coin, index) => coin !== selections[index])) {
      throw new Error("Result must be a prefix of the verified selection list");
    }
  }
}

export function defineGreedyCoinsCodeMappingContent(
  content: GreedyCoinsCodeMappingContent,
): GreedyCoinsCodeMappingContent {
  defineLearningContent(content, validateGreedyCoinsCodeMappingCanvas);
  const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
  if (checkpoints.map(step => step.canvas.state.executionStepId).join() !== checkpointStepIds.join()) {
    throw new Error(`Keep all ${checkpointStepIds.length} execution checkpoints in order`);
  }
  for (const step of checkpoints) {
    if (step.canvas.highlights[0].id !== "append-coin") {
      throw new Error("Checkpoints must sit on the result.append(coin) line");
    }
  }
  // 主教材では参照コードの全8行が実行される。
  const visited = new Set(content.steps.map(step => step.canvas.highlights[0].id));
  for (const line of greedyCoinsCode.lines) {
    if (!visited.has(line.id)) throw new Error("Unvisited code line");
  }
  return content;
}
