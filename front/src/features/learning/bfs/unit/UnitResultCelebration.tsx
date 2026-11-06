"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import type { Ref } from "react";

import { playerTokens } from "../../player/player.tokens";

// カードの光条・回転・段階演出より控えめな、中央の小さな一回の紙吹雪。
// ランダム値・タイマー・ダイアログ状態には依存せず、マウント時だけ開始する。
const pieces = Array.from({ length: 18 }, (_, index) => ({
  x: (index - 8.5) * 16,
  turn: (index % 2 ? 1 : -1) * (90 + index * 13),
  color: [playerTokens.focus, playerTokens.states.queued.stroke, playerTokens.states.completed.stroke][index % 3],
}));
const reducedStyle = {
  "@media (prefers-reduced-motion: reduce)": { transform: "none !important", opacity: "1 !important" },
} as const;

/** リザルト自身の初回出現だけを演出する。報酬キューや保存・遷移には接続しない。 */
export function UnitResultCelebration({ heading, headingRef }: { heading: string; headingRef: Ref<HTMLHeadingElement> }) {
  const reduced = useReducedMotion();
  return <Box data-phase-result-celebration sx={{ position: "relative", width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    {!reduced && <Box aria-hidden="true" data-phase-result-confetti
      sx={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 360, height: 180, overflow: "hidden", pointerEvents: "none",
        "@media (prefers-reduced-motion: reduce)": { display: "none" } }}>
      {pieces.map((piece, index) => <Box key={index} component={motion.span} data-confetti-piece
        initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
        animate={{ opacity: [0, 1, 1, 0], x: [0, piece.x * 0.4, piece.x * 0.85, piece.x], y: [0, -16, 88, 150], rotate: [0, piece.turn * 0.3, piece.turn * 0.7, piece.turn] }}
        transition={{ duration: 1.15, delay: index % 3 * 0.08, times: [0, 0.15, 0.8, 1], repeat: 0 }}
        sx={{ position: "absolute", left: "50%", top: 24, width: 6, height: 10, borderRadius: 0.5, bgcolor: piece.color }} />)}
    </Box>}
    <Box component={motion.div} aria-hidden="true" data-phase-result-mark
      initial={reduced ? false : { scale: 0.8, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.6, repeat: 0, ease: "easeOut" }}
      sx={{ ...reducedStyle, width: 96, height: 96, borderRadius: "50%", bgcolor: playerTokens.layers.layer0, display: "grid", placeItems: "center" }}>
      <CheckCircleIcon sx={{ fontSize: 72, color: playerTokens.focus }} />
    </Box>
    <Box component={motion.div} data-phase-result-heading
      initial={reduced ? false : { y: 10, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.08, repeat: 0, ease: "easeOut" }}
      sx={reducedStyle}>
      <Typography ref={headingRef} component="h2" tabIndex={-1}
        sx={{ color: playerTokens.text, fontWeight: 700, textAlign: "center", fontSize: "clamp(20px, 1.8vw, 32px)", outline: "none" }}>{heading}</Typography>
    </Box>
  </Box>;
}
