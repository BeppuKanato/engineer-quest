"use client";

import Box from "@mui/material/Box";

import { ArrayDrawing } from "../../player/ArrayDrawing";
import type { BubbleSortExecutionCanvasState } from "./execution.types";

/**
 * フェーズ2の見た目を描く。描画そのものは共通配列基盤へ委譲し、
 * ここでは配列の読み（aria ラベル）だけを持つ。フェーズ3の復習や
 * フェーズ4の図にも同じ snapshot と renderer を渡せる。
 */
export function BubbleSortExecutionCanvas({ canvas }: { canvas: BubbleSortExecutionCanvasState }) {
  return (
    <Box sx={{ height: "100%", minHeight: 220, position: "relative" }}>
      <ArrayDrawing canvas={canvas} label="5つの数が並び替わっていく様子" />
    </Box>
  );
}
