import { defineLearningContent, type LearningStep } from "../../../player/content.types";
import {
  greedyCoinsDenominations, greedyCoinsMainAmount, greedyCoinsSelections,
} from "../greedyCoins";
import type { GreedyCoinStatus } from "../figure/greedyCoins.types";
import {
  validateGreedyCoinsExecutionCanvas,
  type GreedyCoinsExecutionCanvasState, type GreedyCoinsExecutionContent,
} from "./execution.types";

/**
 * 基準データ §3 フェーズ2（11ステップ）。盤面は greedyCoins.ts の実行記録
 * （契約 greedy-coins-v1 の選択列）から組み立て、手書きしない。
 * 1ステップ＝硬貨1枚の選択で、図（額面列・残額・トレイ）とキャプションを完全同期させる。
 * ステップIDは select-<何枚目か> とし、フェーズ3が場面として直接参照できる
 * （例: select-3 は500・100・100を使い終わり残額86になったところ）。
 *
 * 基準データのステップ表のキャプションは全ステップ2文になっているが、同表の見出しと
 * 教材指針は「キャプションは全て1文」と定めるため、意味と数値を変えず1文へ圧縮した
 * （例: 「500円を選びます。残りは286円です」→「500円を選んで、残りは286円です。」）。
 * 図の状態と選択列・残額は表どおりを厳密に再現する。圧縮の是非は PR で要確認とする。
 */
const coins = greedyCoinsDenominations;
const amount = greedyCoinsMainAmount;
const selections = greedyCoinsSelections(amount, coins);

// 主教材は9枚で残額推移が基準データ §1 の表どおりになる（実行検証済み）。形が変わったら教材データの誤りとして止める。
if (selections.length !== 9
  || selections.map((selection) => selection.coin).join(",") !== "500,100,100,50,10,10,10,5,1"
  || selections.map((selection) => selection.remainingAfter).join(",") !== "286,186,86,36,26,16,6,1,0") {
  throw new Error("Main example must select [500,100,100,50,10,10,10,5,1] with remaining 786→286→186→86→36→26→16→6→1→0");
}

function snapshot(
  coinStatuses: readonly GreedyCoinStatus[],
  remaining: number,
  tray: readonly number[],
  selectedCoin: number | null,
): GreedyCoinsExecutionCanvasState {
  return {
    data: { kind: "greedy-coins-execution" },
    state: { coins, coinStatuses, amount, remaining, tray, selectedCoin },
    highlights: [],
  };
}

/** 選んだ額面より大きい額面は passed、その額面は current、小さい額面は upcoming。 */
function statusesFor(coin: number): GreedyCoinStatus[] {
  const selectedIndex = coins.indexOf(coin);
  return coins.map((_, index) =>
    index < selectedIndex ? "passed" as const : index === selectedIndex ? "current" as const : "upcoming" as const);
}

const steps: LearningStep<GreedyCoinsExecutionCanvasState>[] = [
  {
    id: "introduce",
    caption: "786円を、硬貨の枚数が少なくなるように、そのつど使える一番大きい硬貨を選んで払います。",
    canvas: snapshot(coins.map(() => "upcoming" as const), amount, [], null),
  },
  ...selections.map((selection, index): LearningStep<GreedyCoinsExecutionCanvasState> => ({
    id: `select-${index + 1}`,
    caption: `${selection.coin}円を選んで、残りは${selection.remainingAfter}円です。`,
    canvas: snapshot(
      statusesFor(selection.coin),
      selection.remainingAfter,
      selections.slice(0, index + 1).map((entry) => entry.coin),
      selection.coin,
    ),
  })),
  {
    id: "summary",
    caption: "そのつど一番大きい硬貨を選ぶこの方法は貪欲法と呼ばれ、9枚で払えました。",
    canvas: snapshot(
      coins.map(() => "passed" as const), 0, selections.map((selection) => selection.coin), null,
    ),
  },
];

const sequence = defineLearningContent<GreedyCoinsExecutionCanvasState>({
  version: 1, kind: "step-sequence", id: "greedy-coins-execution", phase: 2, intervalMs: 3500,
  steps: steps as [LearningStep<GreedyCoinsExecutionCanvasState>, ...LearningStep<GreedyCoinsExecutionCanvasState>[]],
}, validateGreedyCoinsExecutionCanvas);

export const greedyCoinsExecutionContent: GreedyCoinsExecutionContent = {
  ...sequence, stageName: "動きの説明",
};
