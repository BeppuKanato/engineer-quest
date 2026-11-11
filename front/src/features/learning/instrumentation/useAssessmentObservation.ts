"use client";
import { useEffect, useRef } from "react";
import { assessmentComplete, activeQuestion, type AssessmentContent, type AssessmentState } from "../assessment/assessment";
import type { LearningObserver } from "../../../lib/learningEvents";
import { useLearningVisit } from "./useLearningVisit";

export function useAssessmentObservation(content: AssessmentContent, session: AssessmentState, onEvent?: LearningObserver, active = true, reviewId?: string) {
  const seen = useRef<Record<string, number>>({});
  const seenSession = useRef(session.evidenceSession?.id);
  const completed = useRef(false);
  const question = activeQuestion(content, session);
  const questionTime = useRef({ id: question?.id, began: 0 });
  useEffect(() => {
    if (!active || !onEvent) return;
    if (seenSession.current !== session.evidenceSession?.id) { seen.current = {}; completed.current = false; seenSession.current = session.evidenceSession?.id; }
    for (const record of session.records) {
      if (record.attemptCount < (seen.current[record.questionId] ?? 0)) seen.current[record.questionId] = 0;
      const item = content.questions.find(item => item.id === record.questionId)!;
      for (const attempt of record.attempts.slice(seen.current[record.questionId] ?? 0)) {
        if (attempt.number > 1) onEvent({ eventType: "assessment_retry", targetId: record.questionId, payload: { attempt: attempt.number, tags: item.tags } });
        onEvent({ eventType: "answer_attempt", targetId: record.questionId, payload: {
          assessmentId: content.id, assessmentSessionId: session.evidenceSession?.id, assessmentStartedAt: session.evidenceSession?.startedAt,
          answer: attempt.answer, correct: attempt.correct, attempt: attempt.number, firstAttempt: attempt.number === 1, tags: item.tags,
          responseMs: questionTime.current.id === record.questionId ? Math.max(0, Math.round(performance.now() - questionTime.current.began)) : 0,
          ..."lineId" in item ? { lineId: item.lineId } : {},
        } });
      }
      if (record.attemptCount > (seen.current[record.questionId] ?? 0) && questionTime.current.id === record.questionId) questionTime.current.began = performance.now();
      seen.current[record.questionId] = record.attemptCount;
    }
    const done = assessmentComplete(content, session);
    if (done && !completed.current) onEvent({ eventType: "assessment_complete", targetId: content.id,
      payload: { firstAttemptCorrect: session.records.filter(record => record.firstCorrect).length, totalQuestions: content.questions.length,
        tags: content.questions.map(item => ({ questionId: item.id, tags: item.tags, correct: session.records.find(record => record.questionId === item.id)?.firstCorrect })) } });
    completed.current = done;
    if (questionTime.current.id !== question?.id || questionTime.current.began === 0) questionTime.current = { id: question?.id, began: performance.now() };
  }, [active, onEvent, content, session, question?.id]);
  useLearningVisit(onEvent, active && !!question, "question_view", question?.id, { tags: question?.tags ?? [], ...question && "lineId" in question ? { lineId: question.lineId } : {} });
  useLearningVisit(onEvent, active && !!reviewId, "review_view", reviewId);
  useLearningVisit(onEvent, active && content.kind === "diagnostic-check" && assessmentComplete(content, session), "diagnosis_view", content.id,
    { firstAttemptCorrect: session.records.filter(record => record.firstCorrect).length, totalQuestions: content.questions.length });
}
