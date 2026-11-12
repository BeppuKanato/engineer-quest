"use client";

import { LearningDialogFrame } from "../components/dialogs/LearningDialogFrame";

import { useMemo, type ReactNode } from "react";

import type { LearningInstrumentation } from "../instrumentation/useLearningVisit";

import type { CanvasSnapshot, LearningContent } from "../player/content.types";
import { LearningPlayer } from "../player/LearningPlayer";
import { selectReviewContent } from "./reviewContent";

export function LearningReviewDialog<T extends CanvasSnapshot>({ content, stepIds, renderCanvas, onClose, onLearningEvent, active = true }: LearningInstrumentation & {
  content: LearningContent<T>; stepIds: readonly [string, ...string[]]; renderCanvas: (canvas: T) => ReactNode; onClose: () => void;
}) {
  const review = useMemo(() => selectReviewContent(content, stepIds), [content, stepIds]);
  return <LearningDialogFrame label="該当ステップの復習" closeLabel="復習を閉じる" onClose={onClose}>
    <LearningPlayer onLearningEvent={onLearningEvent} active={active} content={review} renderCanvas={renderCanvas} />
  </LearningDialogFrame>;
}
