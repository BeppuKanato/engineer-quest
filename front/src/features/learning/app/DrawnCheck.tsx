"use client";

import { Box } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

import { playerTokens } from "../player/player.tokens";

/**
 * リザルト共通のチェック図形。円が描かれたあと、チェックが描き込まれる。
 * 動きを減らす設定では最初から完成した状態を出す。
 */
export function DrawnCheck({ size = 64 }: { size?: number }) {
  const reduced = useReducedMotion();
  return <Box component="svg" viewBox="0 0 64 64" aria-hidden sx={{ width: size, height: size, display: "block" }}>
    <motion.circle cx={32} cy={32} r={29} fill="none" stroke={playerTokens.focus} strokeWidth={4}
      initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
      transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.1, repeat: 0, ease: "easeOut" }} />
    <motion.path d="M20 34 L29 43 L45 24" fill="none" stroke={playerTokens.focus} strokeWidth={6}
      strokeLinecap="round" strokeLinejoin="round" data-phase-result-check
      initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
      transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.5, repeat: 0, ease: "easeOut" }} />
  </Box>;
}
