"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Typography } from "@mui/material";
import confetti from "canvas-confetti";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type Ref } from "react";

import { playerTokens } from "../../player/player.tokens";

const reducedStyle = {
  "@media (prefers-reduced-motion: reduce)": { transform: "none !important", opacity: "1 !important" },
} as const;

/**
 * 紙吹雪の発射だけを担う。マウント時に一度だけ、左右の下寄り2点から撃つ。
 * 報酬ダイアログ（zIndex 1300）より下に置き、再描画やダイアログ開閉で再発射しない。
 * 動きを減らす設定ではライブラリ側（disableForReducedMotion）でも止めるが、
 * ここでも useReducedMotion を見て発射自体を行わない。
 */
function PhaseResultConfetti() {
  const reduced = useReducedMotion();
  const firedRef = useRef(false);
  useEffect(() => {
    if (reduced || firedRef.current) return;
    firedRef.current = true;
    const base: confetti.Options = {
      particleCount: 60,
      spread: 75,
      startVelocity: 48,
      gravity: 0.9,
      ticks: 260,
      scalar: 1.05,
      zIndex: 1200,
      disableForReducedMotion: true,
      colors: [playerTokens.focus, playerTokens.states.queued.stroke, playerTokens.states.processing.stroke],
    };
    void confetti({ ...base, angle: 60, origin: { x: 0.12, y: 0.7 } });
    void confetti({ ...base, angle: 120, origin: { x: 0.88, y: 0.7 } });
  }, [reduced]);
  return null;
}

/** リザルト自身の初回出現だけを演出する。報酬キューや保存・遷移には接続しない。 */
export function UnitResultCelebration({ heading, headingRef }: { heading: string; headingRef: Ref<HTMLHeadingElement> }) {
  const reduced = useReducedMotion();
  return <Box data-phase-result-celebration sx={{ position: "relative", width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    {!reduced && <PhaseResultConfetti />}
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
