"use client";

import Box from "@mui/material/Box";

import { GreedyCoinsDrawing } from "../figure/GreedyCoinsDrawing";
import { toGreedyCoinsCanvas, type GreedyCoinsExecutionCanvasState } from "./execution.types";

/** フェーズ2の見た目を描く。描画そのものは単元側の硬貨図へ委譲し、ここでは配列の読み（aria ラベル）だけを持つ。 */
export function GreedyCoinsExecutionCanvas({ canvas }: { canvas: GreedyCoinsExecutionCanvasState }) {
  return (
    <Box sx={{ height: "100%", minHeight: 220, position: "relative" }}>
      <GreedyCoinsDrawing canvas={toGreedyCoinsCanvas(canvas)} label={`${canvas.state.amount}円を硬貨の枚数が少なくなるように払う様子`} />
    </Box>
  );
}
