"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RewardBoundary } from "./presentation";

/** 保存済みのフェーズの切れ目に提示を積む。提示は遷移を待たせない（#147）。
 * 表示中の切れ目がある間に次の提示が来たらキューへ回し、終わった順に表示する。 */
export function useRewardBoundary() {
  const [boundary, setBoundary] = useState<RewardBoundary | null>(null);
  const current = useRef<RewardBoundary | null>(null);
  const queue = useRef<RewardBoundary[]>([]);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const present = useCallback((value: RewardBoundary) => {
    if (!mounted.current) return;
    if (current.current) {
      queue.current.push(value);
      return;
    }
    current.current = value;
    setBoundary(value);
  }, []);
  const finish = useCallback(() => {
    const next = queue.current.shift() ?? null;
    current.current = next;
    setBoundary(next);
  }, []);
  return { boundary, present, finish };
}
