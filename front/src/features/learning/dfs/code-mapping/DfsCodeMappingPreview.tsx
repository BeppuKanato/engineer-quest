"use client";

import { Box } from "@mui/material";
import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { DfsCodeMappingCanvas } from "./DfsCodeMappingCanvas";
import { dfsCodeMappingContent } from "./codeMapping.content";

export function DfsCodeMappingPreview() {
  return <Box component="main" aria-label={dfsCodeMappingContent.stageName}
    sx={{ height: "100dvh", minHeight: 480, display: "grid", placeItems: "center", bgcolor: playerTokens.background }}>
    <Box sx={{ width: "84vw", height: "84dvh", minHeight: 400, minWidth: 0, display: "flex" }}>
      <LearningPlayer content={dfsCodeMappingContent} renderCanvas={canvas => <DfsCodeMappingCanvas canvas={canvas} />} />
    </Box>
  </Box>;
}
