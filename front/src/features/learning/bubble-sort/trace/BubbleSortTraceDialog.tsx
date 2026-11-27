"use client";

import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { TraceDialogShell } from "../../player/TraceDialogShell";
import { BubbleSortExecutionCanvas } from "../execution/BubbleSortExecutionCanvas";
import { bubbleSortTraceText as text } from "./trace.content";
import type { BubbleSortTracePlayback } from "./trace.types";

/** 構成は共通シェル（TraceDialogShell）が持つ。ここはバブルソートの文言・変数・描画の受け渡しだけを持つ。 */
export function BubbleSortTraceDialog({ playback, onClose, onLearningEvent, active = true }: LearningInstrumentation & { playback: BubbleSortTracePlayback; onClose: () => void }) {
  return (
    <TraceDialogShell text={text} playback={playback}
      variables={[["result", "array"], ["i", "i"], ["j", "j"]]}
      renderExecution={canvas => <BubbleSortExecutionCanvas canvas={canvas} />}
      traceOf={canvas => canvas.trace}
      onClose={onClose} onLearningEvent={onLearningEvent} active={active} />
  );
}
