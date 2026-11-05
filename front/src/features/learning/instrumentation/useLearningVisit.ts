"use client";
import { useEffect, useRef } from "react";
import type { LearningObserver } from "../../../lib/learningEvents";

/** 可視時間だけを数え、非表示・離脱・フェーズ切替で区間を閉じる。 */
export function observeLearningVisit(onEvent: LearningObserver, eventType: string, targetId?: string, payload?: Record<string, unknown>) {
  let began: number | null = document.visibilityState === "hidden" ? null : performance.now();
  let viewed = false;
  const view = () => { if (!viewed && began !== null) { viewed = true; onEvent({ eventType, targetId, payload }); } };
  const end = () => {
    if (began === null) return;
    onEvent({ eventType: eventType.replace(/_view$|_start$/u, "") + "_dwell", targetId, payload: { ...payload, visibleMs: Math.max(0, Math.round(performance.now() - began)) } });
    began = null;
  };
  const visibility = () => { if (document.visibilityState === "hidden") end(); else { began = performance.now(); view(); } };
  view(); document.addEventListener("visibilitychange", visibility); window.addEventListener("pagehide", end);
  return () => { end(); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", end); };
}
export function useLearningVisit(onEvent: LearningObserver | undefined, active: boolean, eventType: string, targetId?: string, payload?: Record<string, unknown>) {
  const callback = useRef(onEvent);
  useEffect(() => { callback.current = onEvent; }, [onEvent]);
  const enabled = !!onEvent;
  const metadata = JSON.stringify(payload ?? {});
  useEffect(() => {
    if (!active || !callback.current) return;
    return observeLearningVisit(event => callback.current?.(event), eventType, targetId, JSON.parse(metadata));
  }, [active, eventType, targetId, metadata, enabled]); // observerの同一性では滞在区間を切らない
}
export type LearningInstrumentation = { onLearningEvent?: LearningObserver; active?: boolean };
