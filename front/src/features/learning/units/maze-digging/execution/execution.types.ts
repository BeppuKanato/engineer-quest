import type { LearningContent } from "../../../player/content.types";
import type { MazeGridCanvasState } from "../../../player/mazeGrid.types";
import { validateMazeDiggingCanvas } from "../mazeDiggingCanvas";

/**
 * フェーズ2の Canvas は共通グリッド基盤の型をそのまま使うが、状態の意味と検証は
 * 穴掘り法側（mazeDiggingCanvas）に従う。各ステップは操作直後の完全なスナップショットで、
 * 掘削ステップでは processing に掘った部屋、highlights に今回掘れた2マス（間の壁＋部屋）、
 * path にスタックの経路を置く。target は使わない（掘る前の予告はフェーズ1の役割で、
 * ここでは掘った後の状態だけを見せる）。フェーズ3は step.id と canvas を直接参照し、
 * フェーズ4は同じスナップショットへコード対応を付加する。
 */
export type MazeDiggingExecutionCanvasState = MazeGridCanvasState;

export type MazeDiggingExecutionContent = LearningContent<MazeDiggingExecutionCanvasState> & {
  readonly stageName: "動きの説明";
};

export function validateMazeDiggingExecutionCanvas(canvas: MazeDiggingExecutionCanvasState): void {
  validateMazeDiggingCanvas(canvas);
  const walls = new Set<string>(canvas.state.walls);
  for (const highlight of canvas.highlights) {
    if (walls.has(highlight.id)) throw new Error("Execution highlight must mark a cell that was just dug");
  }
  if (canvas.state.target !== null) throw new Error("Execution steps show settled states only (target must be null)");
}
