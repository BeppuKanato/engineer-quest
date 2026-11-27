"use client";

import { Box } from "@mui/material";

import { isMascotId, type MascotState } from "./mascot";
import { MascotFigure } from "./mascotFigure";

/**
 * マスコットの見せ方（2026-11-25、発展ミッションの結果画面で確定し、ホーム等と共通化）：
 * 全身を小さく置くのではなく、大きく切り取って（バストアップ）感情が伝わる大きさで出す。
 * 感情の場面（結果・ホームの相棒の台詞など）で使い、学習フェーズの中では使わない。
 */
export const MascotBust: React.FC<{
  mascotId?: string;
  state: MascotState;
  width?: number;
  height?: number;
  imgSize?: number;
}> = ({ mascotId = "red-panda", state, width = 168, height = 128, imgSize = 215 }) => (
  <Box sx={{ width, height, overflow: "hidden", flexShrink: 0, position: "relative" }} aria-hidden>
    <Box sx={{ position: "absolute", left: "50%", top: -14, transform: "translateX(-50%)", width: imgSize, height: imgSize }}>
      <MascotFigure mascotId={isMascotId(mascotId) ? mascotId : "red-panda"} alt="" state={state} size="XL" grounding="shadow" sx={{ width: imgSize, height: imgSize }} />
    </Box>
  </Box>
);
