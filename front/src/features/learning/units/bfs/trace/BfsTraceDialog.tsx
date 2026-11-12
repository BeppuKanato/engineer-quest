"use client";

import { LearningDialogFrame } from "../../../components/dialogs/LearningDialogFrame";

import { Box, Typography } from "@mui/material";

import type { LearningInstrumentation } from "../../../instrumentation/useLearningVisit";

import { LearningPlayer } from "../../../player/LearningPlayer";
import { playerTokens } from "../../../player/player.tokens";
import { BfsExecutionCanvas } from "../execution/BfsExecutionCanvas";
import { bfsTraceText as text } from "./trace.content";
import type { BfsTracePlayback } from "./trace.types";

/** モーダルの構成だけを持つ。描画と再生制御は既存部品へ渡す。 */
export function BfsTraceDialog({ playback, onClose, onLearningEvent, active = true }: LearningInstrumentation & { playback: BfsTracePlayback; onClose: () => void }) {
  return <LearningDialogFrame label={text.dialog} closeLabel={text.close} onClose={onClose} dialogLabel={text.dialog} paperSx={{ color: playerTokens.text }}>
    {playback.notice && <Typography component="p" role="status" sx={{ textAlign: "center", px: 1 }}>{playback.notice}</Typography>}
    <LearningPlayer onLearningEvent={onLearningEvent} active={active} content={playback.content} renderCanvas={canvas => <Box data-trace-mode={playback.mode} sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Box sx={{ flex: 1, minHeight: 220 }}><BfsExecutionCanvas canvas={canvas} /></Box>
      <Box component="dl" aria-label={text.variables} sx={{ m: 0, mt: 1, alignSelf: "center", width: "min(100%, 600px)", display: "grid", gridTemplateColumns: "max-content minmax(0, 1fr)", gap: 0.5,
        maxHeight: 140, overflowY: "auto", flexShrink: 0, fontFamily: "monospace", fontSize: 16, color: playerTokens.text }}>
        <Box component="dt">{text.line}</Box><Box component="dd" data-trace-line sx={{ m: 0 }}>{canvas.trace.line ?? text.unset}</Box>
        {(["queue", "distances", "node"] as const).map(name => <Box key={name} sx={{ display: "contents" }}>
          <Box component="dt">{name} =</Box><Box component="dd" data-trace-variable={name} sx={{ m: 0, overflowWrap: "anywhere" }}>
            {canvas.trace.variables[name] === undefined || canvas.trace.variables[name] === null ? text.unset : JSON.stringify(canvas.trace.variables[name])}
          </Box>
        </Box>)}
      </Box>
    </Box>} />
  </LearningDialogFrame>;
}
