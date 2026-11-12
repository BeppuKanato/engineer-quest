import type { LearningContent } from "../../../player/content.types";
import { validateMazeGridCanvas, type MazeGridCanvasState } from "../../../player/mazeGrid.types";

/**
 * フェーズ2の Canvas は共通グリッド基盤の型をそのまま使う（基準データ §4 の共通化）。
 * 各ステップは操作直後の完全なスナップショットで、伸長ステップでは processing に
 * 処理した柱、highlights に今回壁になったマスだけを置く。target は使わない
 * （壁になる前の予告はフェーズ1の役割で、ここでは伸ばした後の状態だけを見せる）。
 * フェーズ3は step.id と canvas を直接参照し、フェーズ4は同じスナップショットへ
 * コード対応を付加する。表示や再生順から生成過程を逆算しない。
 */
export type WallExtensionExecutionCanvasState = MazeGridCanvasState;

export type WallExtensionExecutionContent = LearningContent<WallExtensionExecutionCanvasState> & {
  readonly stageName: "動きの説明";
};

export function validateWallExtensionExecutionCanvas(canvas: WallExtensionExecutionCanvasState): void {
  validateMazeGridCanvas(canvas);
  const walls = new Set<string>(canvas.state.walls);
  for (const highlight of canvas.highlights) {
    if (!walls.has(highlight.id)) throw new Error("Execution highlight must mark a cell that just became a wall");
  }
  if (canvas.state.target !== null) throw new Error("Execution steps show settled states only (target must be null)");
}
