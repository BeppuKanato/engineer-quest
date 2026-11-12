"use client";

import Box from "@mui/material/Box";
import { motion, useReducedMotion } from "framer-motion";

import { PhaseNextButton } from "../../../components/results/PhaseNextButton";
import { playerTokens } from "../../../player/player.tokens";
import { GreedyCoinsDrawing } from "../figure/GreedyCoinsDrawing";
import { toGreedyCoinsCanvas, type GreedyCoinsMotivationCanvasState } from "./motivation.types";

/**
 * フェーズ1の見た目を描く。描画そのものは単元側の硬貨図（GreedyCoinsDrawing）へ委譲し、
 * ここでは出口ボタンの重ね方だけを持つ（他単元フェーズ1と同じ仕組み）。
 * 単品プレビューでは onExit が無く、ボタンは無効表示になる。
 */
export function GreedyCoinsMotivationCanvas({ canvas, onExit }: {
  canvas: GreedyCoinsMotivationCanvasState;
  onExit?: () => void;
}) {
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : playerTokens.transitionMs / 1000, ease: "easeInOut" } as const;
  const { exit } = canvas.state;
  return (
    <Box sx={{ height: "100%", minHeight: 220, position: "relative" }}>
      <GreedyCoinsDrawing canvas={toGreedyCoinsCanvas(canvas)} label={`${canvas.state.amount}円を硬貨で払う様子`} />
      {exit && (
        <Box component={motion.div} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={transition}
          sx={{ position: "absolute", left: "50%", bottom: 12, transform: "translateX(-50%)" }}>
          <PhaseNextButton label={exit.label} disabled={!onExit} onClick={onExit ?? (() => {})} />
        </Box>
      )}
    </Box>
  );
}
