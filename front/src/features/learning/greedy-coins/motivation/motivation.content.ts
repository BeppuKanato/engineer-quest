import { defineLearningContent } from "../../player/content.types";
import {
  greedyCoinsDenominations, greedyCoinsMainAmount, runGreedyCoins,
} from "../greedyCoins";
import type { GreedyCoinStatus } from "../figure/greedyCoins.types";
import {
  validateGreedyCoinsMotivationCanvas,
  type GreedyCoinsMotivationCanvasState, type GreedyCoinsMotivationContent,
} from "./motivation.types";

/**
 * 基準データ §3 フェーズ1（7場面）。全場面で同じ硬貨の図（額面列・残額・トレイ）を使い、
 * 場面ごとの差はトレイ・残額・額面の状態と強調だけで表す（図の大きさは場面で変えない）。
 * 主教材のトレイは greedyCoins.ts の実行記録から組み立て、手書きしない。
 * 用語「貪欲法」はフェーズ1では出さない（名称付けはフェーズ2の最後に置く）。
 */
const coins = greedyCoinsDenominations;
const amount = greedyCoinsMainAmount;
const fullTray = runGreedyCoins(amount, coins); // [500, 100, 100, 50, 10, 10, 10, 5, 1]（9枚）

if (fullTray.length !== 9) throw new Error("Main example must be paid with 9 coins");

const upcoming = (): GreedyCoinStatus[] => coins.map(() => "upcoming" as const);
const passed = (): GreedyCoinStatus[] => coins.map(() => "passed" as const);

function scene(
  state: Partial<GreedyCoinsMotivationCanvasState["state"]> = {},
  highlights: GreedyCoinsMotivationCanvasState["highlights"] = [],
): GreedyCoinsMotivationCanvasState {
  return {
    data: { kind: "greedy-coins-motivation" },
    state: { coins, coinStatuses: upcoming(), amount, remaining: amount, tray: [], exit: null, ...state },
    highlights,
  };
}

const sequence = defineLearningContent<GreedyCoinsMotivationCanvasState>({
  version: 1, kind: "step-sequence", id: "greedy-coins-motivation", phase: 1, intervalMs: 3500,
  steps: [
    {
      id: "small-coins-burden", caption: "786円の買い物を小さい硬貨だけで払おうとすると、硬貨が何百枚も必要になってしまいます。",
      // 小さい硬貨（1円）を強調し、「小さい硬貨だけ」の負担を目の前の図で示す。
      canvas: scene({}, [{ kind: "coin", id: coins.length - 1 }]),
    },
    {
      id: "six-coins", caption: "日本の硬貨は、500円、100円、50円、10円、5円、1円の6種類あります。",
      canvas: scene(),
    },
    {
      id: "large-coin-first", caption: "500円のところは500円硬貨1枚で済みますが、1円硬貨では500枚も必要です。",
      canvas: scene({
        coinStatuses: ["current", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"],
        remaining: amount - 500, tray: [500],
      }),
    },
    {
      id: "large-to-small-demo", caption: "大きい硬貨から順に使うと、786円を9枚の硬貨で払えます。",
      canvas: scene({ coinStatuses: passed(), remaining: 0, tray: fullTray }),
    },
    {
      id: "next-largest", caption: "残りが86円になったら、次に使える一番大きい硬貨は50円です。",
      canvas: scene({
        coinStatuses: ["passed", "passed", "current", "upcoming", "upcoming", "upcoming"],
        remaining: 86, tray: [500, 100, 100],
      }),
    },
    {
      id: "unit-overview", caption: "この単元では、この払い方を、動きの確認からコード、そして自分で実装するところまで順に学びます。",
      canvas: scene(),
    },
    {
      id: "main-example-preview", caption: "次からは、786円を9枚で払う過程を、硬貨1枚ずつ見ていきます。",
      canvas: scene({ exit: { label: "動きの説明へ進む", nextPhase: 2 } }, [{ kind: "coin", id: 0 }]),
    },
  ],
}, validateGreedyCoinsMotivationCanvas);

export const greedyCoinsMotivationContent: GreedyCoinsMotivationContent = {
  ...sequence, stageName: "導入",
  vocabulary: [
    { concept: "remaining", everyday: "残り", technical: "残額", firstStepId: "small-coins-burden", usage: "まだ払えていない金額。図では「残り ○円」と表示し、硬貨を選ぶたびに減っていく。" },
    { concept: "largest-usable", everyday: "使える一番大きい硬貨", technical: "使える一番大きい硬貨", firstStepId: "large-coin-first", usage: "残り以下で一番大きい額面の硬貨。フェーズ1では日常語のまま使い、方法の名称はまだ出さない。" },
  ],
};

for (const entry of greedyCoinsMotivationContent.vocabulary) {
  if (!sequence.steps.some((step) => step.id === entry.firstStepId)) throw new Error("Unknown vocabulary introduction step");
}
