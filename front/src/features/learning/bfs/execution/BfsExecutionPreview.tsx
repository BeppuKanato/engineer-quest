"use client";

import { Box } from "@mui/material";

import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";

import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { BfsExecutionCanvas } from "./BfsExecutionCanvas";
import { bfsExecutionContent } from "./execution.content";

/** embedded / onComplete / nextLabel は単元フロー（#77）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function BfsExecutionPreview({ embedded = false, onLearningEvent, active = true, onComplete, nextLabel }: LearningInstrumentation & { embedded?: boolean; onComplete?: () => void; nextLabel?: string }) {
  return (
    <Box component={embedded ? "div" : "main"} sx={{ height: embedded ? "100%" : "100dvh", minHeight: embedded ? 0 : 480, bgcolor: playerTokens.background, display: "flex" }}>
      <LearningPlayer onLearningEvent={onLearningEvent} active={active} content={bfsExecutionContent} renderCanvas={canvas => <BfsExecutionCanvas canvas={canvas} />}
        endAction={onComplete ? { label: nextLabel ?? "次へ進む", onClick: onComplete } : undefined} />
    </Box>
  );
}
