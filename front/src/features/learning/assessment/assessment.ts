/** 実装済みの入力形式だけを扱う。ノード選択とコード穴埋め選択。 */
export type NodeAnswer = { readonly kind: "node"; readonly nodeId: string } | { readonly kind: "none" };
export type ChoiceAnswer = { readonly kind: "choice"; readonly choiceId: string };
export type AssessmentAnswer = NodeAnswer | ChoiceAnswer;
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
export type CodeBlankQuestion = {
  readonly kind: "code-blank";
  readonly id: string;
  readonly prompt: string;
  readonly stepId: string;
  readonly lineId: string;
  readonly blank: { readonly start: number; readonly length: number };
  readonly choices: readonly { readonly id: string; readonly text: string }[];
  readonly correctAnswer: ChoiceAnswer;
  /** 今回の穴埋めは独立設問。前問の解答を条件にしない。 */
  readonly requires: null;
  readonly reviewStepIds: readonly [string, ...string[]];
  readonly tags: readonly string[];
};
export type NodeTapAssessment = {
  readonly version: 1;
  readonly kind: "node-tap-check";
  readonly id: string;
  readonly questions: readonly [NodeTapQuestion, ...NodeTapQuestion[]];
};
export type CodeBlankAssessment = {
  readonly version: 1;
  readonly kind: "code-blank-check";
  readonly id: string;
  readonly questions: readonly [CodeBlankQuestion, ...CodeBlankQuestion[]];
};
export type AssessmentContent = NodeTapAssessment | CodeBlankAssessment;
type Question = NodeTapQuestion | CodeBlankQuestion;
export type QuestionRecord = {
  readonly questionId: string;
  readonly attemptCount: number;
  readonly firstCorrect: boolean | null;
  readonly solved: boolean;
  readonly attempts: readonly { readonly number: number; readonly answer: AssessmentAnswer; readonly correct: boolean }[];
};
export type AssessmentState = { readonly assessmentId: string; readonly records: readonly QuestionRecord[] };

export function sameAnswer(left: AssessmentAnswer, right: AssessmentAnswer): boolean {
  if (left.kind === "none") return right.kind === "none";
  if (left.kind === "choice") return right.kind === "choice" && left.choiceId === right.choiceId;
  return right.kind === "node" && left.nodeId === right.nodeId;
}
function isCodeBlank(question: Question): question is CodeBlankQuestion {
  return "kind" in question && question.kind === "code-blank";
}
function allowed(question: Question, answer: AssessmentAnswer): boolean {
  if (isCodeBlank(question)) return answer.kind === "choice" && question.choices.some(choice => choice.id === answer.choiceId);
  return answer.kind === "none" ? question.allowNone : answer.kind === "node" && question.nodeIds.includes(answer.nodeId);
}
export function validateAssessment(content: AssessmentContent): void {
  if (content.version !== 1 || !["node-tap-check", "code-blank-check"].includes(content.kind) || !content.id.trim() || !content.questions.length) throw new Error("Invalid assessment");
  const earlier = new Map<string, Question>();
  for (const question of content.questions) {
    if (!question.id.trim() || earlier.has(question.id) || !question.prompt.trim() || /[\r\n]/u.test(question.prompt) ||
      !question.stepId.trim() || !question.reviewStepIds.length || question.reviewStepIds.some(id => !id.trim()) ||
      !allowed(question, question.correctAnswer)) throw new Error("Invalid assessment question");
    if (isCodeBlank(question)) {
      if (content.kind !== "code-blank-check" || !question.lineId.trim() || question.requires !== null ||
        !Number.isInteger(question.blank.start) || question.blank.start < 0 || !Number.isInteger(question.blank.length) || question.blank.length < 1 ||
        question.choices.length < 2 || new Set(question.choices.map(choice => choice.id)).size !== question.choices.length ||
        new Set(question.choices.map(choice => choice.text)).size !== question.choices.length ||
        question.choices.some(choice => !choice.id.trim() || !choice.text.trim() || /[\r\n]/u.test(choice.text))) throw new Error("Invalid code-blank question");
    } else if (content.kind !== "node-tap-check" || !question.nodeIds.length || new Set(question.nodeIds).size !== question.nodeIds.length) {
      throw new Error("Invalid node-tap question");
    }
    if (question.requires) {
      const prerequisite = earlier.get(question.requires.questionId);
      if (!prerequisite || !sameAnswer(prerequisite.correctAnswer, question.requires.answer)) throw new Error("Question requires an earlier correct answer");
    }
    earlier.set(question.id, question);
  }
}
export function createAssessmentState(content: AssessmentContent): AssessmentState {
  validateAssessment(content);
  return { assessmentId: content.id, records: content.questions.map(question => ({ questionId: question.id, attemptCount: 0, firstCorrect: null, solved: false, attempts: [] })) };
}
export function activeQuestion<T extends AssessmentContent>(content: T, state: AssessmentState): T["questions"][number] | null {
  if (state.assessmentId !== content.id) throw new Error("Assessment session mismatch");
  const next = content.questions.find(question => !state.records.some(record => record.questionId === question.id && record.solved));
  if (!next) return null;
  if (next.requires && !state.records.some(record => record.questionId === next.requires!.questionId && record.solved &&
    record.attempts.some(attempt => attempt.correct && sameAnswer(attempt.answer, next.requires!.answer)))) return null;
  return next;
}
export function assessmentComplete(content: AssessmentContent, state: AssessmentState): boolean {
  return state.assessmentId === content.id && content.questions.every(question => state.records.some(record => record.questionId === question.id && record.solved));
}
/** questionId を照合するため、連打・古い画面のイベントが次問の回答として記録されない。 */
export function answerQuestion(content: AssessmentContent, state: AssessmentState, questionId: string, answer: AssessmentAnswer): AssessmentState {
  const question = activeQuestion(content, state);
  if (!question || question.id !== questionId || !allowed(question, answer)) return state;
  const correct = sameAnswer(answer, question.correctAnswer);
  return { ...state, records: state.records.map(record => record.questionId !== questionId ? record : {
    questionId, attemptCount: record.attemptCount + 1, firstCorrect: record.firstCorrect ?? correct, solved: correct,
    attempts: [...record.attempts, { number: record.attemptCount + 1, answer: { ...answer }, correct }],
  }) };
}
