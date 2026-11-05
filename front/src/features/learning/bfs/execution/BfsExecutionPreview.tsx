"use client";

import { Box } from "@mui/material";

import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { BfsExecutionCanvas } from "./BfsExecutionCanvas";
import { bfsExecutionContent } from "./execution.content";

/** embedded / onComplete / nextLabel は単元フロー（#77）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function BfsExecutionPreview({ embedded = false, onComplete, nextLabel }: { embedded?: boolean; onComplete?: () => void; nextLabel?: string }) {
  return (
    <Box component={embedded ? "div" : "main"} sx={{ height: embedded ? "100%" : "100dvh", minHeight: embedded ? 0 : 480, bgcolor: playerTokens.background, display: "flex" }}>
      <LearningPlayer content={bfsExecutionContent} renderCanvas={canvas => <BfsExecutionCanvas canvas={canvas} />}
        endAction={onComplete ? { label: nextLabel ?? "次のフェーズへ進む", onClick: onComplete } : undefined} />
    </Box>
  );
}
