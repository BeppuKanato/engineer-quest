"use client";

import { Box } from "@mui/material";

import { RobotFigure, type RobotState } from "./robotFigure";

/**
 * アルドの見せ方（2026-11-27、全体ロボ化で MascotBust から置き換え）：
 * 枠の中で下端に影で接地させ、感情が伝わる大きさで出す。
 * 感情の場面（結果・ホームの台詞など）で使い、学習フェーズの中では使わない。
 * 形は楕円の胴体＋楕円の腕・脚なし（RobotFigure 側の決まり）。
 */
export const RobotBust: React.FC<{
  state: RobotState;
  width?: number;
  height?: number;
}> = ({ state, width = 168, height = 128 }) => (
  <Box sx={{ width, height, flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" }} aria-hidden>
    <RobotFigure alt="" state={state} size="XL" grounding="shadow" sx={{ width: Math.round(height * 0.94), height }} />
  </Box>
);
