"use client";

import { Box } from "@mui/material";

import { bfsTraceText as text } from "../../bfs/trace/trace.content";
import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { TraceDialogShell } from "../../player/TraceDialogShell";
import { DfsExecutionCanvas } from "../execution/DfsExecutionCanvas";
import type { DfsTracePlayback } from "./convertTrace";

/**
 * 構成は共通シェル（TraceDialogShell）が持つ。ここは DFS の変数・描画と、
 * 終了時に変数パネルの末尾へ足す戻り値の行だけを持つ。
 * グラフを出さない場面（showGraph）はシェル側がトレースの形から判定する。
 */
export function DfsTraceDialog({ playback, onClose, onLearningEvent, active = true }: LearningInstrumentation & {
  playback: DfsTracePlayback;
  onClose: () => void;
}) {
  return (
    <TraceDialogShell text={text} playback={playback} variables={["stack", "visited", "order", "node", "neighbor"]}
      renderExecution={canvas => <DfsExecutionCanvas canvas={canvas} />}
      traceOf={canvas => canvas.trace}
      extraRows={canvas => canvas.trace.terminal && playback.order !== null ? <>
        <Box component="dt">戻り値</Box>
        <Box component="dd" sx={{ m: 0, overflowWrap: "anywhere" }}>{JSON.stringify(playback.order)}</Box>
      </> : null}
      onClose={onClose} onLearningEvent={onLearningEvent} active={active} />
  );
}
