"use client";

import { Box } from "@mui/material";

import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { wallExtensionExecutionContent } from "./execution.content";
import { WallExtensionExecutionCanvas } from "./WallExtensionExecutionCanvas";

/** 単品の動きの説明。接続・保存・学習ログのポートは持たない。 */
export function WallExtensionExecutionPreview() {
  return (
    <Box component="main" aria-label={wallExtensionExecutionContent.stageName}
      sx={{ height: "100dvh", minHeight: 440, display: "grid", placeItems: "center", bgcolor: playerTokens.background }}>
      <Box sx={{ width: "84vw", height: "84dvh", minHeight: 360, display: "flex" }}>
        <LearningPlayer content={wallExtensionExecutionContent}
          renderCanvas={(canvas) => <WallExtensionExecutionCanvas canvas={canvas} />} />
      </Box>
    </Box>
  );
}
