"use client";

import Box from "@mui/material/Box";

import { MazeGridDrawing } from "../../../player/MazeGridDrawing";
import type { WallExtensionExecutionCanvasState } from "./execution.types";

/**
 * フェーズ2の見た目を描く。描画そのものは共通グリッド基盤へ委譲し、
 * ここでは盤面の読み（aria ラベル）だけを持つ。フェーズ3の復習や
 * フェーズ4の図にも同じ snapshot と renderer を渡せる。
 */
export function WallExtensionExecutionCanvas({ canvas }: { canvas: WallExtensionExecutionCanvasState }) {
  return (
    <Box sx={{ height: "100%", minHeight: 220, position: "relative" }}>
      <MazeGridDrawing canvas={canvas} label="9×9の迷路ができあがる様子" />
    </Box>
  );
}
