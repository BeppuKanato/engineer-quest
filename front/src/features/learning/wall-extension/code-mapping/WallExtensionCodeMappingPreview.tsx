"use client";

import { Box } from "@mui/material";

import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { wallExtensionCodeMappingContent } from "./codeMapping.content";
import { WallExtensionCodeMappingCanvas } from "./WallExtensionCodeMappingCanvas";

/** 単品の動きとコードの対応。接続・保存・学習ログのポートは持たない。 */
export function WallExtensionCodeMappingPreview() {
  return (
    <Box component="main" aria-label={wallExtensionCodeMappingContent.stageName}
      sx={{ height: "100dvh", minHeight: 440, display: "grid", placeItems: "center", bgcolor: playerTokens.background }}>
      <Box sx={{ width: "84vw", height: "84dvh", minHeight: 360, display: "flex" }}>
        <LearningPlayer content={wallExtensionCodeMappingContent}
          renderCanvas={(canvas) => <WallExtensionCodeMappingCanvas canvas={canvas} />} />
      </Box>
    </Box>
  );
}
