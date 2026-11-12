"use client";

import { LearningDialogFrame } from "../../components/dialogs/LearningDialogFrame";

import { Box, Typography } from "@mui/material";
import { bfsTraceText as text } from "../../units/bfs/trace/trace.content";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { DfsExecutionCanvas } from "../execution/DfsExecutionCanvas";
import type { DfsTracePlayback } from "./convertTrace";

const variables = ["stack", "visited", "order", "node", "neighbor"] as const;

export function DfsTraceDialog({ playback, onClose, onLearningEvent, active = true }: LearningInstrumentation & {
  playback: DfsTracePlayback;
  onClose: () => void;
}) {
  return <LearningDialogFrame label={text.dialog} closeLabel={text.close} onClose={onClose} dialogLabel={text.dialog} paperSx={{ color: playerTokens.text }}>
    {playback.notice && <Typography component="p" role="status" sx={{ textAlign: "center", px: 1 }}>{playback.notice}</Typography>}
    <LearningPlayer onLearningEvent={onLearningEvent} active={active} content={playback.content} renderCanvas={canvas =>
      <Box data-trace-mode={playback.mode} sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
        {canvas.trace.showGraph && <Box sx={{ flex: 1, minHeight: 220 }}><DfsExecutionCanvas canvas={canvas} /></Box>}
        <Box component="dl" aria-label={text.variables} sx={{ m: 0, mt: 1, alignSelf: "center", width: "min(100%, 600px)", display: "grid",
          gridTemplateColumns: "max-content minmax(0, 1fr)", gap: 0.5, maxHeight: 145, overflowY: "auto", flexShrink: 0,
          fontFamily: "monospace", fontSize: 16, color: playerTokens.text }}>
          <Box component="dt">{text.line}</Box><Box component="dd" data-trace-line sx={{ m: 0 }}>{canvas.trace.line ?? text.unset}</Box>
          {variables.map(name => <Box key={name} sx={{ display: "contents" }}>
            <Box component="dt">{name} =</Box>
            <Box component="dd" data-trace-variable={name} sx={{ m: 0, overflowWrap: "anywhere" }}>
              {canvas.trace.variables[name] == null ? text.unset : JSON.stringify(canvas.trace.variables[name])}
            </Box>
          </Box>)}
          {canvas.trace.terminal && playback.order !== null && <>
            <Box component="dt">戻り値</Box>
            <Box component="dd" sx={{ m: 0, overflowWrap: "anywhere" }}>{JSON.stringify(playback.order)}</Box>
          </>}
        </Box>
      </Box>} />
  </LearningDialogFrame>;
}
