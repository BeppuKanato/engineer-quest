import type { LearningContent } from "../../player/content.types";
import type { VocabularyEntry } from "../../bfs/motivation/motivation.types";
import {
  validateGreedyCoinsBoard, type GreedyCoinsBoardState, type GreedyCoinsCanvasState,
} from "../figure/greedyCoins.types";

/**
 * フェーズ1の Canvas は硬貨の盤面（figure の盤面型）に、出口だけを足す。
 * 出口の形は BFS・二分探索フェーズ1の仕組みに合わせる（{ label, nextPhase }）。
 * 盤面そのものの検証は figure 側の検証を再利用し、二重に定義しない。
 */
export type GreedyCoinsMotivationCanvasState = {
  readonly data: { readonly kind: "greedy-coins-motivation" };
  readonly state: GreedyCoinsBoardState & {
    readonly exit: { label: string; nextPhase: 2 } | null;
  };
  readonly highlights: GreedyCoinsCanvasState["highlights"];
};

export type GreedyCoinsMotivationContent = LearningContent<GreedyCoinsMotivationCanvasState> & {
  readonly stageName: "導入";
  readonly vocabulary: readonly VocabularyEntry[];
};

/** 盤面部分を figure の Canvas 形へ戻す（描画の委譲と検証の共有に使う）。 */
export function toGreedyCoinsCanvas(canvas: GreedyCoinsMotivationCanvasState): GreedyCoinsCanvasState {
  const { coins, coinStatuses, amount, remaining, tray } = canvas.state;
  return {
    data: { kind: "greedy-coins" },
    state: { coins, coinStatuses, amount, remaining, tray },
    highlights: canvas.highlights,
  };
}

export function validateGreedyCoinsMotivationCanvas(canvas: GreedyCoinsMotivationCanvasState): void {
  if (canvas.data.kind !== "greedy-coins-motivation") {
    throw new Error("Unknown greedy coins motivation canvas kind");
  }
  validateGreedyCoinsBoard(canvas.state);
  const { exit } = canvas.state;
  if (exit !== null && (!exit.label.trim() || exit.nextPhase !== 2)) {
    throw new Error("Motivation exit must name phase 2");
  }
  const highlighted = new Set<number>();
  for (const highlight of canvas.highlights) {
    if (highlight.kind !== "coin" || !Number.isInteger(highlight.id)
      || highlight.id < 0 || highlight.id >= canvas.state.coins.length) {
      throw new Error(`Unknown coin highlight: ${highlight.id}`);
    }
    if (highlighted.has(highlight.id)) throw new Error(`Duplicate highlight: ${highlight.id}`);
    highlighted.add(highlight.id);
  }
}
