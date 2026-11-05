"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, IconButton } from "@mui/material";
import { useMemo, type ReactNode } from "react";

import type { LearningInstrumentation } from "../instrumentation/useLearningVisit";

import type { CanvasSnapshot, LearningContent } from "../player/content.types";
import { LearningPlayer } from "../player/LearningPlayer";
import { playerTokens } from "../player/player.tokens";
import { selectReviewContent } from "./reviewContent";

export function LearningReviewDialog<T extends CanvasSnapshot>({ content, stepIds, renderCanvas, onClose, onLearningEvent, active = true }: LearningInstrumentation & {
  content: LearningContent<T>; stepIds: readonly [string, ...string[]]; renderCanvas: (canvas: T) => ReactNode; onClose: () => void;
}) {
  const review = useMemo(() => selectReviewContent(content, stepIds), [content, stepIds]);
  return <Dialog open onClose={onClose} maxWidth={false}
    slotProps={{ paper: { "aria-label": "該当ステップの復習", sx: { width: "84vw", height: "84dvh", maxHeight: "calc(100dvh - 16px)", m: 1, borderRadius: 0, boxShadow: "none", bgcolor: playerTokens.surface } } }}>
    <Box sx={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
      <IconButton aria-label="復習を閉じる" onClick={onClose} sx={{ color: playerTokens.control }}><CloseIcon /></IconButton>
    </Box>
    <LearningPlayer onLearningEvent={onLearningEvent} active={active} content={review} renderCanvas={renderCanvas} />
  </Dialog>;
}
