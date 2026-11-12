"use client";

import { Box } from "@mui/material";
import type { LearningInstrumentation } from "../../../instrumentation/useLearningVisit";
import { LearningPlayer } from "../../../player/LearningPlayer";
import { playerTokens } from "../../../player/player.tokens";
import { DfsMotivationCanvas } from "./DfsMotivationCanvas";
import { dfsMotivationContent } from "./motivation.content";

export function DfsMotivationPreview({ embedded = false, active = true, onLearningEvent, onComplete }: LearningInstrumentation & {
  embedded?: boolean; onComplete?: () => void;
} = {}) {
  return <Box component={embedded ? "div" : "main"} aria-label={dfsMotivationContent.stageName}
    sx={{ height: embedded ? "100%" : "100dvh", minHeight: embedded ? 0 : 440, display: "grid", placeItems: "center", bgcolor: playerTokens.background }}>
    <Box sx={{ width: embedded ? "100%" : "84vw", height: embedded ? "100%" : "84dvh", minHeight: embedded ? 0 : 360, display: "flex" }}>
      <LearningPlayer content={dfsMotivationContent} active={active} onLearningEvent={onLearningEvent} renderCanvas={canvas =>
        <DfsMotivationCanvas canvas={canvas} onExit={onComplete ? () => {
          onLearningEvent?.({ eventType: "phase_choice", payload: { choice: "continue" } });
          onComplete();
        } : undefined} />} />
    </Box>
  </Box>;
}
