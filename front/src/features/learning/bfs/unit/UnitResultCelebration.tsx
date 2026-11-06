"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import type { Ref } from "react";

import { playerTokens } from "../../player/player.tokens";

// 回答直後の○に隠れず、大画面でも認識できる幅と余韻を持つ一回の紙吹雪。
// ランダム値・タイマー・ダイアログ状態には依存せず、マウント時だけ開始する。
const pieces = Array.from({ length: 120 }, (_, index) => {
  const lane = Math.floor(index / 2), side = index % 2 === 0 ? "left" : "right";
  const direction = side === "left" ? 1 : -1;
  const angle = (-100 + lane * 19 % 73) * Math.PI / 180;
  const speed = 52 + lane * 7 % 27;
  const reach = direction * Math.cos(angle) * speed * 0.8;
  const rise = -Math.sin(angle) * speed;
  const drift = direction * (3 + lane % 7);
  return {
    side,
    // 左右の発射点から素早く扇状に上がり、頂点で勢いを失ってからゆっくり落ちる。
    x: [0, reach * 0.45, reach * 0.72, reach * 0.86, reach, reach + drift * 0.4, reach + drift].map(value => `${value}vw`),
    y: [0, -rise * 0.72, -rise, -rise * 0.92, -rise * 0.25, 25, 60].map(value => `${value}vh`),
    turn: direction * (240 + lane % 5 * 60),
    delay: lane % 5 * 0.025,
    duration: 3.8 + lane % 3 * 0.2,
    color: [playerTokens.focus, playerTokens.states.queued.stroke, playerTokens.states.processing.stroke][lane % 3],
  };
});
const reducedStyle = {
  "@media (prefers-reduced-motion: reduce)": { transform: "none !important", opacity: "1 !important" },
} as const;

/** リザルト自身の初回出現だけを演出する。報酬キューや保存・遷移には接続しない。 */
export function UnitResultCelebration({ heading, headingRef }: { heading: string; headingRef: Ref<HTMLHeadingElement> }) {
  const reduced = useReducedMotion();
  return <Box data-phase-result-celebration sx={{ position: "relative", width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    {!reduced && <Box aria-hidden="true" data-phase-result-confetti
      sx={{ position: "fixed", top: "10dvh", left: 0, right: 0, height: "85dvh", overflow: "hidden", pointerEvents: "none", zIndex: 1200,
        "@media (prefers-reduced-motion: reduce)": { display: "none" } }}>
      {pieces.map((piece, index) => <Box key={index} component={motion.span} data-confetti-piece data-confetti-origin={piece.side}
        initial={{ opacity: 0, x: "0vw", y: "0vh", rotate: 0 }}
        animate={{ opacity: [0, 1, 1, 1, 1, 1, 0], x: piece.x, y: piece.y,
          rotate: [0, piece.turn * 0.12, piece.turn * 0.25, piece.turn * 0.4, piece.turn * 0.6, piece.turn * 0.8, piece.turn] }}
        transition={{ duration: piece.duration, delay: piece.delay, times: [0, 0.08, 0.16, 0.24, 0.48, 0.74, 1], repeat: 0, ease: "linear" }}
        sx={{ position: "absolute", left: piece.side === "left" ? "12%" : "88%", top: "70%", width: 10 + index % 3 * 2, height: 14 + index % 4 * 3, borderRadius: index % 4 === 0 ? "50%" : 0.5, bgcolor: piece.color }} />)}
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
