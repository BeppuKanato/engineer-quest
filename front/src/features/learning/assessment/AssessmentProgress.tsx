"use client";

import { Box, LinearProgress, Typography } from "@mui/material";

/**
 * 問題の進み具合（2026-11-23 決定）: 何問目かと、終わった量を緑バーで示す。
 * 進捗ゲージの既存の言葉（緑＝完了した量）にそろえる。結果画面のドットは
 * 初回正解数の集計専用なので、ここでは流用しない。
 * position は0始まりの現在の問題位置、total は全問題数。
 */
export function AssessmentProgress({ position, total }: { position: number; total: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "center", flexShrink: 0, mb: 1 }}>
      <Typography component="p" sx={{ fontSize: 15, fontWeight: 700 }}>
        問題 {position + 1} / {total}
      </Typography>
      <LinearProgress aria-label="問題の進み具合" variant="determinate" value={(position / total) * 100}
        sx={{ width: 200, height: 8, borderRadius: 4, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: "#16a34a", borderRadius: 4 } }} />
    </Box>
  );
}
