import { useEffect, useRef } from "react";
import type { UnitPhaseSummary } from "../unit/unit.types";

/** 解き直しを始めるまで、同じ回答結果の完了通知は一度だけ行う。 */
export function useAssessmentCompletion(complete: boolean, firstAttemptCorrect: number, totalQuestions: number,
  onComplete?: (summary: UnitPhaseSummary) => void, evidence?: UnitPhaseSummary["assessmentEvidence"]) {
  const reported = useRef(false);
  useEffect(() => {
    if (complete && !reported.current) {
      reported.current = true;
      onComplete?.({ firstAttemptCorrect, totalQuestions, assessmentEvidence: evidence });
    }
    if (!complete) reported.current = false;
  }, [complete, firstAttemptCorrect, totalQuestions, onComplete, evidence]);
}
