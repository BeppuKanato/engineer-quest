"use client";

import { Box } from "@mui/material";
import type { LearningInstrumentation } from "../../../instrumentation/useLearningVisit";
import { LearningPlayer } from "../../../player/LearningPlayer";
import { playerTokens } from "../../../player/player.tokens";
import { DfsCodeMappingCanvas } from "./DfsCodeMappingCanvas";
import { dfsCodeMappingContent } from "./codeMapping.content";

export function DfsCodeMappingPreview({ embedded = false, active = true, onLearningEvent, onComplete, nextLabel }: LearningInstrumentation & {
  embedded?: boolean; onComplete?: () => void; nextLabel?: string;
} = {}) {
  return <Box component={embedded ? "div" : "main"} aria-label={dfsCodeMappingContent.stageName}
    sx={{ height: embedded ? "100%" : "100dvh", minHeight: embedded ? 0 : 480, display: "grid", placeItems: "center", bgcolor: playerTokens.background }}>
    <Box sx={{ width: embedded ? "100%" : "84vw", height: embedded ? "100%" : "84dvh", minHeight: embedded ? 0 : 400, minWidth: 0, display: "flex" }}>
      <LearningPlayer content={dfsCodeMappingContent} active={active} onLearningEvent={onLearningEvent}
        renderCanvas={canvas => <DfsCodeMappingCanvas canvas={canvas} />}
        endAction={onComplete ? { label: nextLabel ?? "次へ進む", onClick: onComplete } : undefined} />
    </Box>
  </Box>;
}
