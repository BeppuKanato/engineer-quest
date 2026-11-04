"use client";

import { Box } from "@mui/material";

import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { BfsExecutionCanvas } from "./BfsExecutionCanvas";
import { bfsExecutionContent } from "./execution.content";

export function BfsExecutionPreview() {
  return (
    <Box component="main" sx={{ height: "100dvh", minHeight: 480, bgcolor: playerTokens.background, display: "flex" }}>
      <LearningPlayer content={bfsExecutionContent} renderCanvas={canvas => <BfsExecutionCanvas canvas={canvas} />} />
    </Box>
  );
}
