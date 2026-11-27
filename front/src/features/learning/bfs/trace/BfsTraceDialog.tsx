"use client";

import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { TraceDialogShell } from "../../player/TraceDialogShell";
import { BfsExecutionCanvas } from "../execution/BfsExecutionCanvas";
import { bfsTraceText as text } from "./trace.content";
import type { BfsTracePlayback } from "./trace.types";

/** 構成は共通シェル（TraceDialogShell）が持つ。ここは BFS の文言・変数・描画の受け渡しだけを持つ。 */
export function BfsTraceDialog({ playback, onClose, onLearningEvent, active = true }: LearningInstrumentation & { playback: BfsTracePlayback; onClose: () => void }) {
  return (
    <TraceDialogShell text={text} playback={playback} variables={["queue", "distances", "node"]}
      renderExecution={canvas => <BfsExecutionCanvas canvas={canvas} />}
      traceOf={canvas => canvas.trace}
      onClose={onClose} onLearningEvent={onLearningEvent} active={active} />
  );
}
