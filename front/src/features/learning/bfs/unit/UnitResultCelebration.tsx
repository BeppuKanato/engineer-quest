"use client";

import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import type { Ref } from "react";

import { ResultConfetti } from "../../app/ResultConfetti";
import { playerTokens } from "../../player/player.tokens";

const reducedStyle = {
  "@media (prefers-reduced-motion: reduce)": { transform: "none !important", opacity: "1 !important" },
} as const;

/** リザルト自身の初回出現だけを演出する。報酬キューや保存・遷移には接続しない。 */
export function UnitResultCelebration({ heading, headingRef }: { heading: string; headingRef: Ref<HTMLHeadingElement> }) {
  const reduced = useReducedMotion();
  return <Box data-phase-result-celebration sx={{ position: "relative", width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    {!reduced && <ResultConfetti />}
    <Box component={motion.div} aria-hidden="true" data-phase-result-mark
      initial={reduced ? false : { scale: 0.8, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.6, repeat: 0, ease: "easeOut" }}
      sx={{ ...reducedStyle, width: 96, height: 96, borderRadius: "50%", bgcolor: playerTokens.layers.layer0, display: "grid", placeItems: "center" }}>
      <Box component="svg" viewBox="0 0 64 64" sx={{ width: 64, height: 64, display: "block" }}>
        <motion.circle cx={32} cy={32} r={29} fill="none" stroke={playerTokens.focus} strokeWidth={4}
          initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.1, repeat: 0, ease: "easeOut" }} />
        <motion.path d="M20 34 L29 43 L45 24" fill="none" stroke={playerTokens.focus} strokeWidth={6}
          strokeLinecap="round" strokeLinejoin="round" data-phase-result-check
          initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.5, repeat: 0, ease: "easeOut" }} />
      </Box>
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
