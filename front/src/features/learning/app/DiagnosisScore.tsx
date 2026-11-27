"use client";

import { Box, Typography } from "@mui/material";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";

import { playerTokens } from "../player/player.tokens";

/**
 * フェーズ6（応用問題）の診断スコア表示。正解数とゲージがアニメーションで増えて最終値に届く。
 * 動きを減らす設定では即座に最終値を出す。全単元で同じ表示を使うため、ここだけが持つ。
 */
export function DiagnosisScore({ correct, total }: { correct: number; total: number }) {
  const reduced = useReducedMotion();
  const progress = useMotionValue(reduced ? 1 : 0);
  const count = useTransform(progress, value => Math.round(value * correct));
  const width = useTransform(progress, value => `${total > 0 ? (value * correct / total) * 100 : 0}%`);
  useEffect(() => {
    if (reduced) { progress.set(1); return; }
    const controls = animate(progress, 1, { duration: 0.9, delay: 0.25, ease: "easeOut" });
    return () => controls.stop();
  }, [progress, reduced]);
  return <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, mt: 1 }}>
    <Typography component="p" sx={{ fontSize: 15 }}>初回正解</Typography>
    <Typography component="p" sx={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: playerTokens.focus }}>
      <motion.span>{count}</motion.span> / {total}<Typography component="span" sx={{ fontSize: 20, fontWeight: 700 }}> 問</Typography>
    </Typography>
    <Box aria-hidden sx={{ width: "min(420px, 80%)", height: 10, borderRadius: 999, overflow: "hidden", bgcolor: playerTokens.states.completed.fill }}>
      <Box component={motion.div} style={{ width }} sx={{ height: "100%", bgcolor: playerTokens.focus }} />
    </Box>
  </Box>;
}
