"use client";

import type { LearningInstrumentation } from "../../instrumentation/useLearningVisit";
import { TraceDialogShell } from "../../player/TraceDialogShell";
import { GreedyCoinsExecutionCanvas } from "../execution/GreedyCoinsExecutionCanvas";
import { greedyCoinsTraceText as text } from "./trace.content";
import type { GreedyCoinsTracePlayback } from "./trace.types";

/** 構成は共通シェル（TraceDialogShell）が持つ。ここは貪欲法の文言・変数・描画の受け渡しだけを持つ。 */
export function GreedyCoinsTraceDialog({ playback, onClose, onLearningEvent, active = true }: LearningInstrumentation & { playback: GreedyCoinsTracePlayback; onClose: () => void }) {
  return (
    <TraceDialogShell text={text} playback={playback}
      variables={[["result", "array"], ["remaining", "remaining"], ["coin", "coin"], ["amount", "amount"]]}
      renderExecution={canvas => <GreedyCoinsExecutionCanvas canvas={canvas} />}
      traceOf={canvas => canvas.trace}
      onClose={onClose} onLearningEvent={onLearningEvent} active={active} />
  );
}
