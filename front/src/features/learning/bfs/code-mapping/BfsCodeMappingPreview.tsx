"use client";

import { Box } from "@mui/material";

import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { BfsCodeMappingCanvas } from "./BfsCodeMappingCanvas";
import { bfsCodeMappingContent } from "./codeMapping.content";

export function BfsCodeMappingPreview() {
  return <Box component="main" sx={{ height: "100dvh", minHeight: 480, bgcolor: playerTokens.background, display: "flex" }}>
    <LearningPlayer content={bfsCodeMappingContent} renderCanvas={canvas => <BfsCodeMappingCanvas canvas={canvas} />} />
  </Box>;
}
