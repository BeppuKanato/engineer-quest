"use client";

import { Box } from "@mui/material";

import type { LearningInstrumentation } from "../../../instrumentation/useLearningVisit";
import { LearningPlayer } from "../../../player/LearningPlayer";
import { playerTokens } from "../../../player/player.tokens";
import { binarySearchMotivationContent } from "./motivation.content";
import { BinarySearchMotivationCanvas } from "./BinarySearchMotivationCanvas";

/** embedded / onComplete は単元フロー（接続 Issue）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function BinarySearchMotivationPreview({ embedded = false, onLearningEvent, active = true, onComplete }: LearningInstrumentation & { embedded?: boolean; onComplete?: () => void }) {
  const player = (
    <LearningPlayer onLearningEvent={onLearningEvent} active={active} content={binarySearchMotivationContent}
      renderCanvas={(canvas) => <BinarySearchMotivationCanvas canvas={canvas} onExit={onComplete ? () => { onLearningEvent?.({ eventType: "phase_choice", payload: { choice: "continue" } }); onComplete(); } : undefined} />} />
  );
  if (embedded) {
    return (
      <Box component="div" sx={{ height: "100%", minHeight: 0, display: "flex", bgcolor: playerTokens.background }}>
        {player}
      </Box>
    );
  }
  return (
    <Box component="main" aria-label={binarySearchMotivationContent.stageName}
      sx={{ height: "100dvh", minHeight: 440, display: "grid", placeItems: "center", bgcolor: playerTokens.background }}>
      <Box sx={{ width: "84vw", height: "84dvh", minHeight: 360, display: "flex" }}>
        {player}
      </Box>
    </Box>
  );
}
