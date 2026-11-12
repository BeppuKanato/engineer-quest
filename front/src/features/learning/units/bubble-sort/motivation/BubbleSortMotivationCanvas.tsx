"use client";

import Box from "@mui/material/Box";
import { motion, useReducedMotion } from "framer-motion";

import { PhaseNextButton } from "../../../app/PhaseNextButton";
import { ArrayDrawing } from "../../../player/ArrayDrawing";
import { playerTokens } from "../../../player/player.tokens";
import type { BubbleSortMotivationCanvasState } from "./motivation.types";

/**
 * フェーズ1の見た目を描く。描画そのものは共通配列基盤へ委譲し、
 * ここでは出口ボタン（BFS・棒倒し法フェーズ1と同じ仕組み）の重ね方だけを持つ。
 * 単品プレビューでは onExit が無く、ボタンは無効表示になる（棒倒し法フェーズ1と同じ）。
 */
export function BubbleSortMotivationCanvas({ canvas, onExit }: {
  canvas: BubbleSortMotivationCanvasState;
  onExit?: () => void;
}) {
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : playerTokens.transitionMs / 1000, ease: "easeInOut" } as const;
  const { exit } = canvas.state;
  return (
    <Box sx={{ height: "100%", minHeight: 220, position: "relative" }}>
      <ArrayDrawing canvas={canvas} label={`${canvas.state.values.length}つの数の並び`} />
      {exit && (
        <Box component={motion.div} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={transition}
          sx={{ position: "absolute", left: "50%", bottom: 12, transform: "translateX(-50%)" }}>
          <PhaseNextButton label={exit.label} disabled={!onExit} onClick={onExit ?? (() => {})} />
        </Box>
      )}
    </Box>
  );
}
