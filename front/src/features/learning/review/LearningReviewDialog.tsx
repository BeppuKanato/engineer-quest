"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, IconButton } from "@mui/material";
import { useMemo, type ReactNode } from "react";

import type { CanvasSnapshot, LearningContent } from "../player/content.types";
import { LearningPlayer } from "../player/LearningPlayer";
import { playerTokens } from "../player/player.tokens";
import { selectReviewContent } from "./reviewContent";

export function LearningReviewDialog<T extends CanvasSnapshot>({ content, stepIds, renderCanvas, onClose }: {
  content: LearningContent<T>; stepIds: readonly [string, ...string[]]; renderCanvas: (canvas: T) => ReactNode; onClose: () => void;
}) {
  const review = useMemo(() => selectReviewContent(content, stepIds), [content, stepIds]);
  return <Dialog open onClose={onClose} maxWidth={false}
    slotProps={{ paper: { "aria-label": "該当ステップの復習", sx: { width: "84vw", height: "84dvh", maxHeight: "calc(100dvh - 16px)", m: 1, borderRadius: 0, boxShadow: "none", bgcolor: playerTokens.surface } } }}>
    <Box sx={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
      <IconButton aria-label="復習を閉じる" onClick={onClose} sx={{ color: playerTokens.control }}><CloseIcon /></IconButton>
    </Box>
    <LearningPlayer content={review} renderCanvas={renderCanvas} />
  </Dialog>;
}
