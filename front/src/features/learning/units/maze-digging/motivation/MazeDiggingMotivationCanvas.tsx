"use client";

import Box from "@mui/material/Box";
import { motion, useReducedMotion } from "framer-motion";

import { PhaseNextButton } from "../../../app/PhaseNextButton";
import { MazeGridDrawing } from "../../../player/MazeGridDrawing";
import { playerTokens } from "../../../player/player.tokens";
import type { MazeDiggingMotivationCanvasState } from "./motivation.types";

/**
 * フェーズ1の見た目を描く。描画そのものは共通グリッド基盤へ委譲し、
 * ここでは出口ボタン（BFS フェーズ1と同じ仕組み）の重ね方だけを持つ。
 * 単品プレビューでは onExit が無く、ボタンは無効表示になる（棒倒し法フェーズ1と同じ）。
 */
export function MazeDiggingMotivationCanvas({ canvas, onExit }: {
  canvas: MazeDiggingMotivationCanvasState;
  onExit?: () => void;
}) {
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : playerTokens.transitionMs / 1000, ease: "easeInOut" } as const;
  const { exit } = canvas.state;
  return (
    <Box sx={{ height: "100%", minHeight: 220, position: "relative" }}>
      <MazeGridDrawing canvas={canvas} label={`${canvas.data.size}×${canvas.data.size}の迷路の盤面`} />
      {exit && (
        <Box component={motion.div} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={transition}
          sx={{ position: "absolute", left: "50%", bottom: 12, transform: "translateX(-50%)" }}>
          <PhaseNextButton label={exit.label} disabled={!onExit} onClick={onExit ?? (() => {})} />
        </Box>
      )}
    </Box>
  );
}
