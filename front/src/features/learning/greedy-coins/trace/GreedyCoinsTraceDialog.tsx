"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, IconButton, Typography } from "@mui/material";

import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";

import { LearningPlayer } from "../../player/LearningPlayer";
import { playerTokens } from "../../player/player.tokens";
import { GreedyCoinsExecutionCanvas } from "../execution/GreedyCoinsExecutionCanvas";
import { greedyCoinsTraceText as text } from "./trace.content";
import type { GreedyCoinsTracePlayback } from "./trace.types";

/** モーダルの構成だけを持つ。描画と再生制御は既存部品へ渡す。 */
export function GreedyCoinsTraceDialog({ playback, onClose, onLearningEvent, active = true }: LearningInstrumentation & { playback: GreedyCoinsTracePlayback; onClose: () => void }) {
  return <Dialog open onClose={onClose} maxWidth={false} aria-label={text.dialog}
    slotProps={{ paper: { "aria-label": text.dialog, sx: { width: "84vw", height: "84dvh", maxHeight: "calc(100dvh - 16px)", m: 1, borderRadius: 0, boxShadow: "none", bgcolor: playerTokens.surface, color: playerTokens.text } } }}>
    <Box sx={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
      <IconButton aria-label={text.close} onClick={onClose} sx={{ color: playerTokens.control }}><CloseIcon /></IconButton>
    </Box>
    {playback.notice && <Typography component="p" role="status" sx={{ textAlign: "center", px: 1 }}>{playback.notice}</Typography>}
    <LearningPlayer onLearningEvent={onLearningEvent} active={active} content={playback.content} renderCanvas={canvas => <Box data-trace-mode={playback.mode} sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Box sx={{ flex: 1, minHeight: 220 }}><GreedyCoinsExecutionCanvas canvas={canvas} /></Box>
      <Box component="dl" aria-label={text.variables} sx={{ m: 0, mt: 1, alignSelf: "center", width: "min(100%, 600px)", display: "grid", gridTemplateColumns: "max-content minmax(0, 1fr)", gap: 0.5,
        maxHeight: 140, overflowY: "auto", flexShrink: 0, fontFamily: "monospace", fontSize: 16, color: playerTokens.text }}>
        <Box component="dt">{text.line}</Box><Box component="dd" data-trace-line sx={{ m: 0 }}>{canvas.trace.line ?? text.unset}</Box>
        {([["result", "array"], ["remaining", "remaining"], ["coin", "coin"], ["amount", "amount"]] as const).map(([name, key]) => <Box key={name} sx={{ display: "contents" }}>
          <Box component="dt">{name} =</Box><Box component="dd" data-trace-variable={name} sx={{ m: 0, overflowWrap: "anywhere" }}>
            {canvas.trace.variables[key] === undefined || canvas.trace.variables[key] === null ? text.unset : JSON.stringify(canvas.trace.variables[key])}
          </Box>
        </Box>)}
      </Box>
    </Box>} />
  </Dialog>;
}
