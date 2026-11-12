import type { LearningContent } from "../../../player/content.types";
import { validateArrayBarsCanvas, type ArrayBarsCanvasState } from "../../../player/arrayBars.types";
import type { VocabularyEntry } from "../../bfs/motivation/motivation.types";

/**
 * フェーズ1の Canvas は共通配列基盤の具体型に、出口（次フェーズへの区切り）だけを足す。
 * 出口の形は BFS・棒倒し法フェーズ1の仕組みに合わせる（{ label, nextPhase }）。
 */
export type BubbleSortMotivationCanvasState = {
  readonly data: ArrayBarsCanvasState["data"];
  readonly state: ArrayBarsCanvasState["state"] & {
    readonly exit: { label: string; nextPhase: 2 } | null;
  };
  readonly highlights: ArrayBarsCanvasState["highlights"];
};

export type BubbleSortMotivationContent = LearningContent<BubbleSortMotivationCanvasState> & {
  readonly stageName: "導入";
  readonly vocabulary: readonly VocabularyEntry[];
};

export function validateBubbleSortMotivationCanvas(canvas: BubbleSortMotivationCanvasState): void {
  validateArrayBarsCanvas(canvas);
  if (canvas.state.exit !== null) {
    if (!canvas.state.exit.label.trim() || canvas.state.exit.nextPhase !== 2) {
      throw new Error("Motivation exit must name phase 2");
    }
    // 出口は落ち着いた並びの上でのみ出す。比較の途中の場面には置かない。
    if (canvas.state.comparing !== null) {
      throw new Error("Motivation exit requires a settled board");
    }
  }
}
