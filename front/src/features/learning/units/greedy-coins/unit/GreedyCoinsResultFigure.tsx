"use client";

import { Box, Typography } from "@mui/material";

import { playerTokens } from "../../../player/player.tokens";
import { greedyCoinsDenominations, greedyCoinsMainAmount, runGreedyCoins } from "../greedyCoins";
import { GreedyCoinsExecutionCanvas } from "../execution/GreedyCoinsExecutionCanvas";
import {
  validateGreedyCoinsExecutionCanvas,
  type GreedyCoinsExecutionCanvasState,
} from "../execution/execution.types";

/**
 * 到達図：単元の完成図を結果画面に出す静的表示（基準データ §4：トレイに主教材の9枚が並び
 * 「786円・9枚」を示す図）。トレイは正本の実行記録（runGreedyCoins）から導出するので、
 * 図と教材の選択過程がずれることはない。完了した盤面として全額面を passed にし、
 * 選んだ硬貨は置かない（フェーズ2のまとめの盤面と同一の状態）。検証は単元側の盤面検証で行う。
 */
const coins = greedyCoinsDenominations;
const amount = greedyCoinsMainAmount;
const tray = runGreedyCoins(amount, coins);
const completedBoard: GreedyCoinsExecutionCanvasState = {
  data: { kind: "greedy-coins-execution" },
  state: {
    coins, coinStatuses: coins.map(() => "passed" as const), amount, remaining: 0, tray, selectedCoin: null,
  },
  highlights: [],
};
validateGreedyCoinsExecutionCanvas(completedBoard);

export function GreedyCoinsResultFigure() {
  return <Box data-result-figure sx={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
    <Box sx={{ width: "100%", height: 300, position: "relative" }}>
      <GreedyCoinsExecutionCanvas canvas={completedBoard} />
    </Box>
    <Typography component="p" sx={{ textAlign: "center", fontSize: 14, color: playerTokens.text }}>
      この段階で払った金額（{amount}円・{tray.length}枚）
    </Typography>
  </Box>;
}
