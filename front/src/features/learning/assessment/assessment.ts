/** 今回の入力形式はノードの1タップ選択のみ。コード穴埋め等は先行実装しない。 */
export type NodeAnswer = { readonly kind: "node"; readonly nodeId: string } | { readonly kind: "none" };
export type NodeTapQuestion = {
  readonly id: string;
  readonly prompt: string;
  readonly stepId: string;
  readonly nodeIds: readonly string[];
  readonly allowNone: boolean;
  readonly correctAnswer: NodeAnswer;
  readonly requires: { readonly questionId: string; readonly answer: NodeAnswer } | null;
  readonly reviewStepIds: readonly [string, ...string[]];
  readonly tags: readonly string[];
};
export type NodeTapAssessment = {
  readonly version: 1;
  readonly kind: "node-tap-check";
  readonly id: string;
  readonly questions: readonly [NodeTapQuestion, ...NodeTapQuestion[]];
};
export type QuestionRecord = {
  readonly questionId: string;
  readonly attemptCount: number;
  readonly firstCorrect: boolean | null;
  readonly solved: boolean;
  readonly attempts: readonly { readonly number: number; readonly answer: NodeAnswer; readonly correct: boolean }[];
};
export type AssessmentState = { readonly assessmentId: string; readonly records: readonly QuestionRecord[] };

export function sameAnswer(left: NodeAnswer, right: NodeAnswer): boolean {
  return left.kind === right.kind && (left.kind === "none" || (right.kind === "node" && left.nodeId === right.nodeId));
}
function allowed(question: NodeTapQuestion, answer: NodeAnswer): boolean {
  return answer.kind === "none" ? question.allowNone : question.nodeIds.includes(answer.nodeId);
}
export function validateAssessment(content: NodeTapAssessment): void {
  if (content.version !== 1 || content.kind !== "node-tap-check" || !content.id.trim() || !content.questions.length) throw new Error("Invalid assessment");
  const earlier = new Map<string, NodeTapQuestion>();
  for (const question of content.questions) {
    if (!question.id.trim() || earlier.has(question.id) || !question.prompt.trim() || /[\r\n]/u.test(question.prompt) ||
      !question.stepId.trim() || !question.nodeIds.length || new Set(question.nodeIds).size !== question.nodeIds.length ||
      !question.reviewStepIds.length || question.reviewStepIds.some(id => !id.trim()) || !allowed(question, question.correctAnswer)) throw new Error("Invalid node-tap question");
    if (question.requires) {
      const prerequisite = earlier.get(question.requires.questionId);
      if (!prerequisite || !sameAnswer(prerequisite.correctAnswer, question.requires.answer)) throw new Error("Question requires an earlier correct answer");
    }
    earlier.set(question.id, question);
  }
}
export function createAssessmentState(content: NodeTapAssessment): AssessmentState {
  validateAssessment(content);
  return { assessmentId: content.id, records: content.questions.map(question => ({ questionId: question.id, attemptCount: 0, firstCorrect: null, solved: false, attempts: [] })) };
}
export function activeQuestion(content: NodeTapAssessment, state: AssessmentState): NodeTapQuestion | null {
  if (state.assessmentId !== content.id) throw new Error("Assessment session mismatch");
  const next = content.questions.find(question => !state.records.some(record => record.questionId === question.id && record.solved));
  if (!next) return null;
  if (next.requires && !state.records.some(record => record.questionId === next.requires!.questionId && record.solved &&
    record.attempts.some(attempt => attempt.correct && sameAnswer(attempt.answer, next.requires!.answer)))) return null;
  return next;
}
export function assessmentComplete(content: NodeTapAssessment, state: AssessmentState): boolean {
  return state.assessmentId === content.id && content.questions.every(question => state.records.some(record => record.questionId === question.id && record.solved));
}
/** questionId を照合するため、連打・古い画面のイベントが次問の回答として記録されない。 */
export function answerQuestion(content: NodeTapAssessment, state: AssessmentState, questionId: string, answer: NodeAnswer): AssessmentState {
  const question = activeQuestion(content, state);
  if (!question || question.id !== questionId || !allowed(question, answer)) return state;
  const correct = sameAnswer(answer, question.correctAnswer);
  return { ...state, records: state.records.map(record => record.questionId !== questionId ? record : {
    questionId, attemptCount: record.attemptCount + 1, firstCorrect: record.firstCorrect ?? correct, solved: correct,
    attempts: [...record.attempts, { number: record.attemptCount + 1, answer: { ...answer }, correct }],
  }) };
}
