"use client";

import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import type { Ref } from "react";

import { DrawnCheck } from "./DrawnCheck";
import { ResultConfetti } from "./ResultConfetti";
import { playerTokens } from "../../player/player.tokens";

const reducedStyle = {
  "@media (prefers-reduced-motion: reduce)": { transform: "none !important", opacity: "1 !important" },
} as const;

/**
 * リザルト自身の初回出現だけを演出する。報酬キューや保存・遷移には接続しない。
 * 紙吹雪と歓声はこの1回の発火に一元化する：大目標の達成が重なる結果画面では
 * preset を "final" に引き上げて最大級で祝い、二重には発火しない（#370）。
 */
export function UnitResultCelebration({ heading, headingRef, preset = "phase" }: { heading: string; headingRef: Ref<HTMLHeadingElement>; preset?: "phase" | "final" }) {
  const reduced = useReducedMotion();
  return <Box data-phase-result-celebration sx={{ position: "relative", width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    {!reduced && <ResultConfetti preset={preset} />}
    <Box component={motion.div} aria-hidden="true" data-phase-result-mark
      initial={reduced ? false : { scale: 0.8, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.6, repeat: 0, ease: "easeOut" }}
      sx={{ ...reducedStyle, width: 96, height: 96, borderRadius: "50%", bgcolor: playerTokens.layers.layer0, display: "grid", placeItems: "center" }}>
      <DrawnCheck />
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
