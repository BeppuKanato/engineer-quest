"use client";

import { Box } from "@mui/material";

import type { LearningInstrumentation } from "../../../instrumentation/useLearningVisit";
import { LearningPlayer } from "../../../player/LearningPlayer";
import { playerTokens } from "../../../player/player.tokens";
import { wallExtensionCodeMappingContent } from "./codeMapping.content";
import { WallExtensionCodeMappingCanvas } from "./WallExtensionCodeMappingCanvas";

/** embedded / onComplete / nextLabel は単元フロー（#214）からの埋め込み用。未指定なら単品ページとして従来どおり動く。 */
export function WallExtensionCodeMappingPreview({ embedded = false, onLearningEvent, active = true, onComplete, nextLabel }: LearningInstrumentation & { embedded?: boolean; onComplete?: () => void; nextLabel?: string }) {
  const player = (
    <LearningPlayer onLearningEvent={onLearningEvent} active={active} content={wallExtensionCodeMappingContent}
      renderCanvas={(canvas) => <WallExtensionCodeMappingCanvas canvas={canvas} />}
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
    <Box component="main" aria-label={wallExtensionCodeMappingContent.stageName}
      sx={{ height: "100dvh", minHeight: 440, display: "grid", placeItems: "center", bgcolor: playerTokens.background }}>
      <Box sx={{ width: "84vw", height: "84dvh", minHeight: 360, display: "flex" }}>
        {player}
      </Box>
    </Box>
  );
}
