"use client";

import { Box } from "@mui/material";

import { scenePreviewContent, stepPreviewContent } from "./content/previewContent";
import { GraphCanvas } from "./GraphCanvas";
import { LearningPlayer } from "./LearningPlayer";
import { playerTokens } from "./player.tokens";

export function LearningPlayerPreview({ contentId }: { contentId: "step-demo" | "scene-demo" }) {
  const content = contentId === "scene-demo" ? scenePreviewContent : stepPreviewContent;
  return (
    <Box component="main" sx={{ minHeight: "100dvh", bgcolor: playerTokens.background, display: "grid", alignItems: "center", p: { xs: 1, sm: 4 } }}>
      <LearningPlayer content={content} renderCanvas={(canvas) => <GraphCanvas canvas={canvas} />} />
    </Box>
  );
}
