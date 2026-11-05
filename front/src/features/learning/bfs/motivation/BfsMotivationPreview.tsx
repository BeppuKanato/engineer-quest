"use client";

import { Box } from "@mui/material";

import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";

import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { BfsMotivationCanvas } from "./BfsMotivationCanvas";
import { bfsMotivationContent } from "./motivation.content";

/** embedded / onComplete は単元フロー（#77）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function BfsMotivationPreview({ embedded = false, onLearningEvent, active = true, onComplete }: LearningInstrumentation & { embedded?: boolean; onComplete?: () => void }) {
  return (
    <Box component={embedded ? "div" : "main"} sx={{ height: embedded ? "100%" : "100dvh", minHeight: embedded ? 0 : 440, bgcolor: playerTokens.background, display: "flex" }}>
      <LearningPlayer onLearningEvent={onLearningEvent} active={active} content={bfsMotivationContent} renderCanvas={(canvas) => <BfsMotivationCanvas canvas={canvas} onExit={onComplete ? () => { onLearningEvent?.({ eventType: "phase_choice", payload: { choice: "continue" } }); onComplete(); } : undefined} />} />
    </Box>
  );
}
