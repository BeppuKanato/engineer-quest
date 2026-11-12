import { codeMappedSteps, defineLearningContent, type LearningContent } from "../../../player/content.types";
import {
  wallExtensionAllowedDirections, wallExtensionDirections, wallExtensionMainSize, wallExtensionPillars,
  type WallExtensionDirection,
} from "../wallExtensionMaze";
import { wallExtensionExecutionContent } from "../execution/execution.content";
import type { WallExtensionExecutionCanvasState } from "../execution/execution.types";
import { wallExtensionCode, type WallExtensionCodeLineId } from "./wallExtensionCode";

/**
 * 表示する変数は、参照コード generate_maze の実際のローカル変数の射影。
 * grid は盤面そのものが表示を担うため含めない。未代入は null で区別する。
 * i・choice・allowed・dx・dy は Python の実セマンティクスどおり、ループを
 * 抜けた後も最後の値を保持する（検証は CPython のトレースと突き合わせる）。
 */
export type WallExtensionCodeVariables = {
  readonly size: number;
  readonly i: number | null;
  readonly y: number | null;
  readonly x: number | null;
  readonly pillars: readonly (readonly [number, number])[] | null;
  readonly choice: number | null;
  readonly allowed: readonly WallExtensionDirection[] | null;
  readonly dx: number | null;
  readonly dy: number | null;
};

export type WallExtensionCodeMappingCanvasState = {
  readonly data: { readonly kind: "wall-extension-code-mapping"; readonly code: typeof wallExtensionCode };
  readonly state: {
    readonly executionStepId: string;
    readonly execution: WallExtensionExecutionCanvasState;
    readonly frameKind: "code" | "execution";
    readonly captionKind: "structure" | "evaluation" | "assignment";
    readonly variables: WallExtensionCodeVariables;
  };
  readonly highlights: readonly [{ readonly kind: "code-line"; readonly id: WallExtensionCodeLineId }];
};

export type WallExtensionCodeMappingContent = LearningContent<WallExtensionCodeMappingCanvasState> & {
  readonly stageName: "動きとコードの対応";
};

/** 盤面は複製せず、フェーズ2の完全状態へ直接参照する。 */
export function executionStep(id: string) {
  const step = wallExtensionExecutionContent.steps.find(step => step.id === id);
  if (!step) throw new Error(`Unknown wall-extension execution step: ${id}`);
  return step;
}

const pillarPairs: readonly (readonly [number, number])[] =
  wallExtensionPillars(wallExtensionMainSize).map(key => key.split(",").map(Number) as unknown as readonly [number, number]);
const allowedOptions: readonly (readonly WallExtensionDirection[])[] =
  [...new Set(wallExtensionPillars(wallExtensionMainSize).map(pillar => wallExtensionAllowedDirections(pillar).join(",")))]
    .map(joined => joined.split(",") as WallExtensionDirection[]);
const deltaPairs: readonly (readonly [number, number])[] =
  Object.values(wallExtensionDirections).map(delta => [delta.x, delta.y] as const);

export function validateWallExtensionCodeMappingCanvas(canvas: WallExtensionCodeMappingCanvasState): void {
  const { execution, executionStepId, variables } = canvas.state;
  if (canvas.data.code !== wallExtensionCode || execution !== executionStep(executionStepId).canvas) {
    throw new Error("Code frames must reference the canonical code and execution snapshot");
  }
  const lineId = canvas.highlights[0]?.id;
  if (canvas.highlights.length !== 1 || !wallExtensionCode.lines.some(line => line.id === lineId)) {
    throw new Error("Unknown wall-extension code line");
  }
  if (variables.size !== wallExtensionMainSize) throw new Error("Code variables must use the main teaching size");
  const inRange = (value: number | null, max: number) =>
    value === null || (Number.isInteger(value) && value >= 0 && value < max);
  if (!inRange(variables.i, wallExtensionMainSize) || !inRange(variables.x, wallExtensionMainSize) ||
    !inRange(variables.y, wallExtensionMainSize) || !inRange(variables.choice, 4)) {
    throw new Error("Invalid wall-extension scalar variable");
  }
  if (variables.pillars !== null) {
    const isPrefix = variables.pillars.length <= pillarPairs.length &&
      variables.pillars.every((pair, index) => pair[0] === pillarPairs[index][0] && pair[1] === pillarPairs[index][1]);
    if (!isPrefix) throw new Error("pillars must be a prefix of the canonical pillar order");
  }
  if (variables.allowed !== null &&
    !allowedOptions.some(option => option.join() === variables.allowed!.join())) {
    throw new Error("allowed must be one of the canonical direction lists");
  }
  const deltaUnset = variables.dx === null && variables.dy === null;
  const deltaKnown = deltaPairs.some(([dx, dy]) => dx === variables.dx && dy === variables.dy);
  if (!deltaUnset && !deltaKnown) throw new Error("Invalid direction delta variables");
}

export function defineWallExtensionCodeMappingContent(
  content: WallExtensionCodeMappingContent,
): WallExtensionCodeMappingContent {
  defineLearningContent(content, validateWallExtensionCodeMappingCanvas);
  // チェックポイントは、フェーズ2のコード対応ステップ（説明専用を除く）を
  // 順序どおりすべて含むことが契約。説明専用ステップはフェーズ4に出さない。
  const expectedCheckpoints = codeMappedSteps(wallExtensionExecutionContent);
  const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
  if (checkpoints.map(step => step.canvas.state.executionStepId).join() !==
    expectedCheckpoints.map(step => step.id).join()) {
    throw new Error(`Keep all ${expectedCheckpoints.length} execution checkpoints in order`);
  }
  if (wallExtensionCode.lines.some(line => !content.steps.some(step => step.canvas.highlights[0].id === line.id))) {
    throw new Error("Unvisited code line");
  }
  return content;
}
