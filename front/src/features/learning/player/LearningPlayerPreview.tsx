"use client";

import { Box } from "@mui/material";

import { scenePreviewContent, stepPreviewContent } from "./content/previewContent";
import { GraphCanvas } from "./GraphCanvas";
import { LearningPlayer } from "./LearningPlayer";
import { playerTokens } from "./player.tokens";

export function LearningPlayerPreview({ contentId }: { contentId: "step-demo" | "scene-demo" }) {
  const content = contentId === "scene-demo" ? scenePreviewContent : stepPreviewContent;
  return (
    <Box component="main" sx={{ height: "100dvh", minHeight: 440, bgcolor: playerTokens.background, display: "flex" }}>
      <LearningPlayer content={content} renderCanvas={(canvas) => <GraphCanvas canvas={canvas} />} />
    </Box>
  );
}
