"use client";

import { useCallback, useState } from "react";

import {
  clearSolutionRevealAttempt,
  isSolutionRevealUnlocked,
  readSolutionRevealAttempt,
  writeSolutionRevealAttempt,
  type SolutionRevealAttempt,
} from "./answerReveal";

const newAttempt = (): SolutionRevealAttempt => ({
  startedAt: new Date().toISOString(),
  failedRuns: 0,
  viewedSolution: false,
});

/**
 * フェーズ7の1試行（開始〜完了）の状態を持つ。
 * 試行開始時刻・失敗回数・解法例の閲覧は localStorage に永続化し、
 * 画面を閉じて戻ってきても同じ試行として数え続ける。完了時に reset する。
 */
export function useSolutionRevealAttempt(draftBaseKey: string) {
  const [attempt, setAttempt] = useState<SolutionRevealAttempt>(() => {
    const saved = readSolutionRevealAttempt(draftBaseKey);
    if (saved) return saved;
    const created = newAttempt();
    writeSolutionRevealAttempt(draftBaseKey, created);
    return created;
  });

  const update = useCallback((patch: Partial<SolutionRevealAttempt>) => {
    setAttempt(current => {
      const next = { ...current, ...patch };
      writeSolutionRevealAttempt(draftBaseKey, next);
      return next;
    });
  }, [draftBaseKey]);

  const recordFailure = useCallback(() => {
    setAttempt(current => {
      const next = { ...current, failedRuns: current.failedRuns + 1 };
      writeSolutionRevealAttempt(draftBaseKey, next);
      return next;
    });
  }, [draftBaseKey]);

  const markViewedSolution = useCallback(() => update({ viewedSolution: true }), [update]);

  const resetAttempt = useCallback(() => {
    clearSolutionRevealAttempt(draftBaseKey);
    setAttempt(newAttempt());
  }, [draftBaseKey]);

  return {
    attempt,
    unlocked: isSolutionRevealUnlocked(attempt),
    recordFailure,
    markViewedSolution,
    resetAttempt,
  };
}
