"use client";

import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { TraceDialogShell } from "../../player/TraceDialogShell";
import { BinarySearchExecutionCanvas } from "../execution/BinarySearchExecutionCanvas";
import { binarySearchTraceText as text } from "./trace.content";
import type { BinarySearchTracePlayback } from "./trace.types";

/** 構成は共通シェル（TraceDialogShell）が持つ。ここは二分探索の文言・変数・描画の受け渡しだけを持つ。 */
export function BinarySearchTraceDialog({ playback, onClose, onLearningEvent, active = true }: LearningInstrumentation & { playback: BinarySearchTracePlayback; onClose: () => void }) {
  return (
    <TraceDialogShell text={text} playback={playback}
      variables={[["values", "array"], ["lo", "lo"], ["hi", "hi"], ["mid", "mid"], ["target", "target"]]}
      renderExecution={canvas => <BinarySearchExecutionCanvas canvas={canvas} />}
      traceOf={canvas => canvas.trace}
      onClose={onClose} onLearningEvent={onLearningEvent} active={active} />
  );
}
