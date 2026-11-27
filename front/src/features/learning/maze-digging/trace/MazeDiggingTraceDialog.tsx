"use client";

import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { TraceDialogShell } from "../../player/TraceDialogShell";
import { MazeDiggingExecutionCanvas } from "../execution/MazeDiggingExecutionCanvas";
import { mazeDiggingTraceText as text } from "./trace.content";
import type { MazeDiggingTracePlayback } from "./trace.types";

/** 構成は共通シェル（TraceDialogShell）が持つ。ここは穴掘り法の文言・変数・描画の受け渡しだけを持つ。 */
export function MazeDiggingTraceDialog({ playback, onClose, onLearningEvent, active = true }: LearningInstrumentation & { playback: MazeDiggingTracePlayback; onClose: () => void }) {
  return (
    <TraceDialogShell text={text} playback={playback} variables={["size", "choices"]}
      renderExecution={canvas => <MazeDiggingExecutionCanvas canvas={canvas} />}
      traceOf={canvas => canvas.trace}
      onClose={onClose} onLearningEvent={onLearningEvent} active={active} />
  );
}
