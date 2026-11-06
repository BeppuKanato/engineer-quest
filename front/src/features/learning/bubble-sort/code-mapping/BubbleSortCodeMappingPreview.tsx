"use client";

import { Box } from "@mui/material";

import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { bubbleSortCodeMappingContent } from "./codeMapping.content";
import { BubbleSortCodeMappingCanvas } from "./BubbleSortCodeMappingCanvas";

/** 単品の動きとコードの対応。接続・保存・学習ログのポートは持たない。 */
export function BubbleSortCodeMappingPreview() {
  return (
    <Box component="main" aria-label={bubbleSortCodeMappingContent.stageName}
      sx={{ height: "100dvh", minHeight: 440, display: "grid", placeItems: "center", bgcolor: playerTokens.background }}>
      <Box sx={{ width: "84vw", height: "84dvh", minHeight: 360, display: "flex" }}>
        <LearningPlayer content={bubbleSortCodeMappingContent}
          renderCanvas={(canvas) => <BubbleSortCodeMappingCanvas canvas={canvas} />} />
      </Box>
    </Box>
  );
}
