"use client";

import { Box } from "@mui/material";

import { playerTokens } from "../../player/player.tokens";

/**
 * リザルトのスコア図示。総問題数分のドットを並べ、初回正解は塗り、再挑戦で正解した分は輪郭にする。
 * summary の件数だけで描く集計表示であり、問題ごとの内訳ではない（内訳データは保持していない）。
 * 件数が不正・多すぎる場合は何も描かない（事実文側に任せる）。
 */
export function ResultScoreDots({ total, firstAttemptCorrect }: { total: number; firstAttemptCorrect: number }) {
  if (!Number.isInteger(total) || !Number.isInteger(firstAttemptCorrect)
    || total <= 0 || total > 10 || firstAttemptCorrect < 0 || firstAttemptCorrect > total) return null;
  return <Box data-score-dots role="img" aria-label={`全${total}問中、初回で${firstAttemptCorrect}問正解`}
    sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
    {Array.from({ length: total }, (_, index) => {
      const first = index < firstAttemptCorrect;
      return <Box key={index} data-score-dot data-dot-state={first ? "first" : "retry"}
        sx={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
          bgcolor: first ? playerTokens.focus : "transparent", border: `2px solid ${playerTokens.focus}` }} />;
    })}
  </Box>;
}
