import type { LearningContent } from "../../player/content.types";
import type { MazeGridCanvasState } from "../../player/mazeGrid.types";
import type { VocabularyEntry } from "../../bfs/motivation/motivation.types";
import { validateMazeDiggingCanvas } from "../mazeDiggingCanvas";

/**
 * フェーズ1の Canvas は共通グリッド基盤の具体型に、出口（次フェーズへの区切り）だけを足す。
 * 出口の形は BFS フェーズ1の仕組みに合わせる（{ label, nextPhase }）。
 * 状態の意味と検証は穴掘り法側（mazeDiggingCanvas）に従う。
 */
export type MazeDiggingMotivationCanvasState = {
  readonly data: MazeGridCanvasState["data"];
  readonly state: MazeGridCanvasState["state"] & {
    readonly exit: { label: string; nextPhase: 2 } | null;
  };
  readonly highlights: MazeGridCanvasState["highlights"];
};

export type MazeDiggingMotivationContent = LearningContent<MazeDiggingMotivationCanvasState> & {
  readonly stageName: "導入";
  readonly vocabulary: readonly VocabularyEntry[];
};

export function validateMazeDiggingMotivationCanvas(canvas: MazeDiggingMotivationCanvasState): void {
  validateMazeDiggingCanvas(canvas);
  if (canvas.state.exit !== null) {
    if (!canvas.state.exit.label.trim() || canvas.state.exit.nextPhase !== 2) {
      throw new Error("Motivation exit must name phase 2");
    }
    // 出口は完成した迷路の上でのみ出す。未完成の盤面に置かない。
    if (canvas.state.processing !== null || canvas.state.target !== null) {
      throw new Error("Motivation exit requires a settled board");
    }
  }
}
