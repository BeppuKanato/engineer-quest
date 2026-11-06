"use client";

import { Box } from "@mui/material";
import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { DfsMotivationCanvas } from "./DfsMotivationCanvas";
import { dfsMotivationContent } from "./motivation.content";

/** 単品の導入。接続・保存・学習ログのポートは持たない。 */
export function DfsMotivationPreview() {
  return <Box component="main" aria-label={dfsMotivationContent.stageName}
    sx={{ height: "100dvh", minHeight: 440, display: "grid", placeItems: "center", bgcolor: playerTokens.background }}>
    <Box sx={{ width: "84vw", height: "84dvh", minHeight: 360, display: "flex" }}>
      <LearningPlayer content={dfsMotivationContent} renderCanvas={canvas => <DfsMotivationCanvas canvas={canvas} />} />
    </Box>
  </Box>;
}
