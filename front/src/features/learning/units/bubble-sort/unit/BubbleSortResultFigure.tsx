"use client";

import { Box, Typography } from "@mui/material";

import { ArrayDrawing } from "../../../player/ArrayDrawing";
import { validateArrayBarsCanvas, type ArrayBarsCanvasState } from "../../../player/arrayBars.types";
import { playerTokens } from "../../../player/player.tokens";
import { bubbleSortMainValues, runBubbleSort } from "../bubbleSort";

/**
 * 到達図：単元の完成図を結果画面に出す静的表示（バブルソートは並び替えが完成した主教材の配列）。
 * 並びは正本の手順から導出する（runBubbleSort）ので、図と教材の結果がずれることはない。
 * 全マスが確定済み（fixedFrom = 0）の状態で描き、右端から順に決まっていった末の完成形を示す。
 */
const completedArray: ArrayBarsCanvasState = {
  data: { kind: "array-bars" },
  state: {
    values: runBubbleSort(bubbleSortMainValues),
    comparing: null,
    fixedFrom: 0,
  },
  highlights: [],
};
validateArrayBarsCanvas(completedArray);

export function BubbleSortResultFigure() {
  return <Box data-result-figure sx={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
    <Box sx={{ width: "100%", height: 300, position: "relative" }}>
      <ArrayDrawing canvas={completedArray} label="完成した並び：小さい順に並んだ状態" />
    </Box>
    <Typography component="p" sx={{ textAlign: "center", fontSize: 14, color: playerTokens.text }}>
      この段階で完成した並び（小さい順に並びました）
    </Typography>
  </Box>;
}
