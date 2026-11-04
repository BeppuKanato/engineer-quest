"use client";

import { Box } from "@mui/material";

import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { BfsMotivationCanvas } from "./BfsMotivationCanvas";
import { bfsMotivationContent } from "./motivation.content";

export function BfsMotivationPreview() {
  return (
    <Box component="main" sx={{ height: "100dvh", minHeight: 440, bgcolor: playerTokens.background, display: "flex" }}>
      <LearningPlayer content={bfsMotivationContent} renderCanvas={(canvas) => <BfsMotivationCanvas canvas={canvas} />} />
    </Box>
  );
}
