"use client";

// スコアランクのメダル（2026-11-25）。点数の横に、そのランクの色のメダルを置く。
// ティア（ブロンズ／シルバー／ゴールド）はランクと二重になるため廃止し、
// 目標は「次のランクまであと何点」で表す。
import { Box } from "@mui/material";

export const rankColors: Record<string, { bg: string; ring: string; text: string }> = {
  S: { bg: "#d97706", ring: "#92400e", text: "#ffffff" },
  A: { bg: "#7d8ca3", ring: "#4b5a6d", text: "#ffffff" },
  B: { bg: "#a9713f", ring: "#7c4a21", text: "#ffffff" },
  C: { bg: "#c3cad4", ring: "#94a3b8", text: "#334155" },
};

export const RankMedal: React.FC<{ rank: string; size?: number }> = ({ rank, size = 34 }) => {
  const c = rankColors[rank] ?? rankColors.C;
  return (
    <Box
      aria-label={`${rank}ランク`}
      sx={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        bgcolor: c.bg, border: `2.5px solid ${c.ring}`, color: c.text,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.48, fontWeight: 900, lineHeight: 1,
      }}
    >
      {rank}
    </Box>
  );
};
