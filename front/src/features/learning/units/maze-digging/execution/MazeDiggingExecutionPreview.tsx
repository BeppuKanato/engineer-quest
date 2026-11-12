"use client";

import { Box } from "@mui/material";

import type { LearningInstrumentation } from "../../../instrumentation/useLearningVisit";
import { LearningPlayer } from "../../../player/LearningPlayer";
import { playerTokens } from "../../../player/player.tokens";
import { mazeDiggingExecutionContent } from "./execution.content";
import { MazeDiggingExecutionCanvas } from "./MazeDiggingExecutionCanvas";

/** embedded / onComplete / nextLabel は単元フロー（接続 Issue）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function MazeDiggingExecutionPreview({ embedded = false, onLearningEvent, active = true, onComplete, nextLabel }: LearningInstrumentation & { embedded?: boolean; onComplete?: () => void; nextLabel?: string }) {
  const player = (
    <LearningPlayer onLearningEvent={onLearningEvent} active={active} content={mazeDiggingExecutionContent}
      renderCanvas={(canvas) => <MazeDiggingExecutionCanvas canvas={canvas} />}
      endAction={onComplete ? { label: nextLabel ?? "次へ進む", onClick: onComplete } : undefined} />
  );
  if (embedded) {
    return (
      <Box component="div" sx={{ height: "100%", minHeight: 0, display: "flex", bgcolor: playerTokens.background }}>
        {player}
      </Box>
    );
  }
  return (
    <Box component="main" aria-label={mazeDiggingExecutionContent.stageName}
      sx={{ height: "100dvh", minHeight: 440, display: "grid", placeItems: "center", bgcolor: playerTokens.background }}>
      <Box sx={{ width: "84vw", height: "84dvh", minHeight: 360, display: "flex" }}>
        {player}
      </Box>
    </Box>
  );
}
