import { codeMappedSteps, defineLearningContent, type LearningContent } from "../../player/content.types";
import { mazeDiggingMainChoices, mazeDiggingMainSize } from "../mazeDiggingMaze";
import { mazeDiggingExecutionContent } from "../execution/execution.content";
import type { MazeDiggingExecutionCanvasState } from "../execution/execution.types";
import { mazeDiggingCode, type MazeDiggingCodeLineId } from "./mazeDiggingCode";

/**
 * 表示する変数は、参照コード dig_maze の実際のローカル変数の射影。
 * grid は盤面そのものが表示を担うため含めず、directions は定数なので含めない。
 * 未代入は null で区別する。x・y・dx・dy・nx・ny・candidates・stack は Python の
 * 実セマンティクスどおり、ループを抜けた後も最後の値を保持する
 * （検証は CPython のトレースと突き合わせる）。
 */
export type MazeDiggingCodeVariables = {
  readonly size: number;
  readonly step: number | null;
  readonly x: number | null;
  readonly y: number | null;
  readonly dx: number | null;
  readonly dy: number | null;
  readonly nx: number | null;
  readonly ny: number | null;
  readonly candidates: readonly (readonly [number, number])[] | null;
  readonly stack: readonly (readonly [number, number])[] | null;
};

export type MazeDiggingCodeMappingCanvasState = {
  readonly data: { readonly kind: "maze-digging-code-mapping"; readonly code: typeof mazeDiggingCode };
  readonly state: {
    readonly executionStepId: string;
    readonly execution: MazeDiggingExecutionCanvasState;
    readonly frameKind: "code" | "execution";
    readonly captionKind: "structure" | "evaluation" | "assignment";
    readonly variables: MazeDiggingCodeVariables;
  };
  readonly highlights: readonly [{ readonly kind: "code-line"; readonly id: MazeDiggingCodeLineId }];
};

export type MazeDiggingCodeMappingContent = LearningContent<MazeDiggingCodeMappingCanvasState> & {
  readonly stageName: "動きとコードの対応";
};

/** 盤面は複製せず、フェーズ2の完全状態へ直接参照する。 */
export function executionStep(id: string) {
  const step = mazeDiggingExecutionContent.steps.find(step => step.id === id);
  if (!step) throw new Error(`Unknown maze-digging execution step: ${id}`);
  return step;
}

const directionDeltas: readonly (readonly [number, number])[] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export function validateMazeDiggingCodeMappingCanvas(canvas: MazeDiggingCodeMappingCanvasState): void {
  const { execution, executionStepId, variables } = canvas.state;
  if (canvas.data.code !== mazeDiggingCode || execution !== executionStep(executionStepId).canvas) {
    throw new Error("Code frames must reference the canonical code and execution snapshot");
  }
  const lineId = canvas.highlights[0]?.id;
  if (canvas.highlights.length !== 1 || !mazeDiggingCode.lines.some(line => line.id === lineId)) {
    throw new Error("Unknown maze-digging code line");
  }
  if (variables.size !== mazeDiggingMainSize) throw new Error("Code variables must use the main teaching size");
  const cell = (value: number | null) =>
    value === null || (Number.isInteger(value) && value >= 0 && value < variables.size);
  if (!cell(variables.x) || !cell(variables.y)) throw new Error("Invalid current room variables");
  // nx・ny は盤の外を指すことがある（候補にならない方向の計算結果）。
  const target = (value: number | null) =>
    value === null || (Number.isInteger(value) && value >= -2 && value < variables.size + 2);
  if (!target(variables.nx) || !target(variables.ny)) throw new Error("Invalid next room variables");
  if (variables.step !== null &&
    (!Number.isInteger(variables.step) || variables.step < 0 || variables.step > mazeDiggingMainChoices.length)) {
    throw new Error("Invalid step counter variable");
  }
  const deltaUnset = variables.dx === null && variables.dy === null;
  const deltaKnown = directionDeltas.some(([dx, dy]) => dx === variables.dx && dy === variables.dy);
  if (!deltaUnset && !deltaKnown) throw new Error("Invalid direction delta variables");
  const isRoom = (pair: readonly [number, number]) =>
    pair.length === 2 && pair.every(value => Number.isInteger(value) && value % 2 === 1 && value >= 1 && value < variables.size - 1);
  if (variables.candidates !== null &&
    (variables.candidates.length > directionDeltas.length || !variables.candidates.every(isRoom))) {
    throw new Error("Candidates must be up to four in-board rooms");
  }
  if (variables.stack !== null) {
    if (!variables.stack.every(isRoom)) throw new Error("Stack entries must be in-board rooms");
    for (let index = 1; index < variables.stack.length; index += 1) {
      const [px, py] = variables.stack[index - 1];
      const [cx, cy] = variables.stack[index];
      const apart = (Math.abs(cx - px) === 2 && cy === py) || (Math.abs(cy - py) === 2 && cx === px);
      if (!apart) throw new Error("Stack rooms must form a dug path (two cells apart)");
    }
  }
}

export function defineMazeDiggingCodeMappingContent(
  content: MazeDiggingCodeMappingContent,
): MazeDiggingCodeMappingContent {
  defineLearningContent(content, validateMazeDiggingCodeMappingCanvas);
  // チェックポイントは、フェーズ2のコード対応ステップ（説明専用を除く）を
  // 順序どおりすべて含むことが契約。説明専用ステップはフェーズ4に出さない。
  const expectedCheckpoints = codeMappedSteps(mazeDiggingExecutionContent);
  const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
  if (checkpoints.map(step => step.canvas.state.executionStepId).join() !==
    expectedCheckpoints.map(step => step.id).join()) {
    throw new Error(`Keep all ${expectedCheckpoints.length} execution checkpoints in order`);
  }
  if (mazeDiggingCode.lines.some(line => !content.steps.some(step => step.canvas.highlights[0].id === line.id))) {
    throw new Error("Unvisited code line");
  }
  return content;
}
