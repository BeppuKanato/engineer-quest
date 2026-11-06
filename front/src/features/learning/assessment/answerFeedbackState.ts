import type { AssessmentContent, AssessmentState } from "./assessment";

export type AnswerFeedback = {
  readonly assessmentId: string;
  readonly questionId: string;
  readonly attempt: number;
  readonly correct: boolean;
  readonly message: string;
};

export const answerFeedbackText = {
  correct: "正解！",
  incorrect: "不正解。もう一度考えてみよう。",
} as const;

/** 判定済みの記録の差分だけを読む。正解の再判定・記録の変更は行わない。 */
export function newAnswerFeedback(content: AssessmentContent, previous: AssessmentState, current: AssessmentState): AnswerFeedback | null {
  if (previous.assessmentId !== content.id || current.assessmentId !== content.id) return null;
  let feedback: AnswerFeedback | null = null;
  for (const question of content.questions) {
    const record = current.records.find(record => record.questionId === question.id);
    const before = previous.records.find(record => record.questionId === question.id)?.attemptCount ?? 0;
    const attempt = record?.attempts.at(-1);
    if (!record || !attempt || record.attemptCount <= before) continue;
    const message = attempt.correct
      ? "correctFeedback" in question && typeof question.correctFeedback === "string" ? question.correctFeedback : answerFeedbackText.correct
      : "incorrectFeedback" in question && typeof question.incorrectFeedback === "string" ? question.incorrectFeedback
        : "retryFeedback" in content && typeof content.retryFeedback === "string" ? content.retryFeedback : answerFeedbackText.incorrect;
    feedback = { assessmentId: content.id, questionId: question.id, attempt: attempt.number, correct: attempt.correct, message };
  }
  return feedback;
}
