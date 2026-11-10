import { useEffect, useRef } from "react";
import type { UnitPhaseSummary } from "../unit/unit.types";

/** 解き直しを始めるまで、同じ回答結果の完了通知は一度だけ行う。 */
export function useAssessmentCompletion(complete: boolean, firstAttemptCorrect: number, totalQuestions: number,
  onComplete?: (summary: UnitPhaseSummary) => void) {
  const reported = useRef(false);
  useEffect(() => {
    if (complete && !reported.current) {
      reported.current = true;
      onComplete?.({ firstAttemptCorrect, totalQuestions });
    }
    if (!complete) reported.current = false;
  }, [complete, firstAttemptCorrect, totalQuestions, onComplete]);
}
