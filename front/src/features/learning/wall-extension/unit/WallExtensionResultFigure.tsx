"use client";

import { Box, Typography } from "@mui/material";

import { MazeGridDrawing } from "../../player/MazeGridDrawing";
import { validateMazeGridCanvas, type MazeGridCanvasState } from "../../player/mazeGrid.types";
import { playerTokens } from "../../player/player.tokens";
import { buildWallExtensionWalls, wallExtensionMainChoices, wallExtensionMainPath, wallExtensionMainSize } from "../wallExtensionMaze";

/**
 * 到達図：単元の完成図を結果画面に出す静的表示（棒倒し法は完成した主教材の迷路）。
 * 壁は正本の choices から導出する（buildWallExtensionWalls）ので、図と教材の迷路がずれることはない。
 * 経路と旗はフェーズ1で示した、スタートからゴールまでの一本道をそのまま使う。
 */
const completedMaze: MazeGridCanvasState = {
  data: { kind: "maze-grid", size: wallExtensionMainSize },
  state: {
    walls: buildWallExtensionWalls(wallExtensionMainSize, wallExtensionMainChoices),
    processing: null,
    target: null,
    path: wallExtensionMainPath,
    start: wallExtensionMainPath[0],
    goal: wallExtensionMainPath[wallExtensionMainPath.length - 1],
  },
  highlights: [],
};
validateMazeGridCanvas(completedMaze);

export function WallExtensionResultFigure() {
  return <Box data-result-figure sx={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
    <MazeGridDrawing canvas={completedMaze} label="完成した迷路：スタートからゴールまでたどれる状態" />
    <Typography component="p" sx={{ textAlign: "center", fontSize: 14, color: playerTokens.text }}>
      この段階で完成した迷路（スタートからゴールまでたどれる状態）
    </Typography>
  </Box>;
}
