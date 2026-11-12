import type { LearningContent } from "../../../player/content.types";
import {
  validateGreedyCoinsBoard, type GreedyCoinsBoardState, type GreedyCoinsCanvasState,
} from "../figure/greedyCoins.types";

/**
 * フェーズ2の Canvas は硬貨の盤面（figure の盤面型）に、このステップで選んだ硬貨を足す。
 * 1ステップ＝硬貨1枚の選択（参照コードの while 本体1回）であり、選んだ硬貨は
 * トレイの最後の1枚と一致し、その額面が current（今見ている額面）になる。
 * 導入ステップとまとめのステップでは選んだ硬貨は無く（selectedCoin = null）、
 * current な額面も無い（導入は全額面 upcoming、まとめは全額面 passed）。
 */
export type GreedyCoinsExecutionCanvasState = {
  readonly data: { readonly kind: "greedy-coins-execution" };
  readonly state: GreedyCoinsBoardState & {
    /** このステップで選んだ硬貨。導入とまとめでは null。 */
    readonly selectedCoin: number | null;
  };
  readonly highlights: GreedyCoinsCanvasState["highlights"];
};

export type GreedyCoinsExecutionContent = LearningContent<GreedyCoinsExecutionCanvasState> & {
  readonly stageName: "動きの説明";
};

/** 盤面部分を figure の Canvas 形へ戻す（描画の委譲に使う）。 */
export function toGreedyCoinsCanvas(canvas: GreedyCoinsExecutionCanvasState): GreedyCoinsCanvasState {
  const { coins, coinStatuses, amount, remaining, tray } = canvas.state;
  return {
    data: { kind: "greedy-coins" },
    state: { coins, coinStatuses, amount, remaining, tray },
    highlights: canvas.highlights,
  };
}

/** 型付き教材の参照整合性をロード時に検証し、不正な盤面を黙って再生しない。 */
export function validateGreedyCoinsExecutionCanvas(canvas: GreedyCoinsExecutionCanvasState): void {
  if (canvas.data.kind !== "greedy-coins-execution") {
    throw new Error("Unknown greedy coins execution canvas kind");
  }
  validateGreedyCoinsBoard(canvas.state);
  const { coins, coinStatuses, tray, selectedCoin } = canvas.state;
  const currentIndex = coinStatuses.indexOf("current");
  if (selectedCoin === null) {
    if (currentIndex !== -1) throw new Error("A step without a selection has no current denomination");
  } else {
    if (!coins.includes(selectedCoin)) throw new Error("Selected coin must be one of the denominations");
    if (tray.length === 0 || tray[tray.length - 1] !== selectedCoin) {
      throw new Error("Selected coin must be the last coin on the tray");
    }
    if (currentIndex !== coins.indexOf(selectedCoin)) {
      throw new Error("Current denomination must be the selected coin");
    }
  }
  const highlighted = new Set<number>();
  for (const highlight of canvas.highlights) {
    if (highlight.kind !== "coin" || !Number.isInteger(highlight.id) || highlight.id < 0 || highlight.id >= coins.length) {
      throw new Error(`Unknown coin highlight: ${highlight.id}`);
    }
    if (highlighted.has(highlight.id)) throw new Error(`Duplicate highlight: ${highlight.id}`);
    highlighted.add(highlight.id);
  }
}
