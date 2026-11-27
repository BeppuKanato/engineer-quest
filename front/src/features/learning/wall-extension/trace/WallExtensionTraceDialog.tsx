"use client";

import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { TraceDialogShell } from "../../player/TraceDialogShell";
import { WallExtensionExecutionCanvas } from "../execution/WallExtensionExecutionCanvas";
import { wallExtensionTraceText as text } from "./trace.content";
import type { WallExtensionTracePlayback } from "./trace.types";

/** 構成は共通シェル（TraceDialogShell）が持つ。ここは棒倒し法の文言・変数・描画の受け渡しだけを持つ。 */
export function WallExtensionTraceDialog({ playback, onClose, onLearningEvent, active = true }: LearningInstrumentation & { playback: WallExtensionTracePlayback; onClose: () => void }) {
  return (
    <TraceDialogShell text={text} playback={playback} variables={["size", "choices"]}
      renderExecution={canvas => <WallExtensionExecutionCanvas canvas={canvas} />}
      traceOf={canvas => canvas.trace}
      onClose={onClose} onLearningEvent={onLearningEvent} active={active} />
  );
}
