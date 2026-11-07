"use client";

import { Box, Typography } from "@mui/material";

import { mazeCellKey, type MazeGridCanvasState } from "../../player/mazeGrid.types";
import { MazeGridDrawing } from "../../player/MazeGridDrawing";
import { playerTokens } from "../../player/player.tokens";
import { validateMazeDiggingCanvas } from "../mazeDiggingCanvas";
import { mazeDiggingMainChoices, mazeDiggingMainSize, mazeDiggingWalls, runMazeDigging, solveMazeDiggingPath } from "../mazeDiggingMaze";

/**
 * 到達図：単元の完成図を結果画面に出す静的表示（穴掘り法は完成した主教材の迷路）。
 * 壁は正本の choices から参照手続きで導出する（runMazeDigging）ので、図と教材の迷路がずれることはない。
 * 経路と旗はフェーズ1で示した、スタートからゴールまでの一本道をそのまま使う。
 * 検証は単元側の意味に合わせた検証器（validateMazeDiggingCanvas）で行う（基準データ §4）。
 */
const completedRun = runMazeDigging(mazeDiggingMainSize, mazeDiggingMainChoices);
const completedPath = solveMazeDiggingPath(completedRun.grid, mazeCellKey(1, 1), mazeCellKey(7, 7));
const completedMaze: MazeGridCanvasState = {
  data: { kind: "maze-grid", size: mazeDiggingMainSize },
  state: {
    walls: mazeDiggingWalls(completedRun.grid),
    processing: null,
    target: null,
    path: completedPath,
    start: completedPath[0],
    goal: completedPath[completedPath.length - 1],
  },
  highlights: [],
};
validateMazeDiggingCanvas(completedMaze);

export function MazeDiggingResultFigure() {
  return <Box data-result-figure sx={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
    <MazeGridDrawing canvas={completedMaze} label="完成した迷路：スタートからゴールまでたどれる状態" />
    <Typography component="p" sx={{ textAlign: "center", fontSize: 14, color: playerTokens.text }}>
      この段階で完成した迷路（スタートからゴールまでたどれる状態）
    </Typography>
  </Box>;
}
