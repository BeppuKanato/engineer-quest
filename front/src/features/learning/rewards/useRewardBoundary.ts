"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RewardBoundary } from "./presentation";

/** 保存済みのフェーズの切れ目だけを待つ。離脱時も待機を解放する。 */
export function useRewardBoundary() {
  const [boundary, setBoundary] = useState<RewardBoundary | null>(null);
  const pending = useRef<(() => void) | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; pending.current?.(); pending.current = null; };
  }, []);
  const present = useCallback((value: RewardBoundary) => {
    if (!mounted.current) return Promise.resolve();
    return new Promise<void>(resolve => { pending.current = resolve; setBoundary(value); });
  }, []);
  const finish = useCallback(() => { setBoundary(null); pending.current?.(); pending.current = null; }, []);
  return { boundary, present, finish };
}
