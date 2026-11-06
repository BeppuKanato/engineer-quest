/** 実装済みの入力形式だけを扱う。ノード・選択肢・コード穴埋め・Parsons。 */
export type NodeAnswer = { readonly kind: "node"; readonly nodeId: string } | { readonly kind: "none" };
export type ChoiceAnswer = { readonly kind: "choice"; readonly choiceId: string };
export type OrderAnswer = { readonly kind: "order"; readonly lineIds: readonly string[] };
export type AssessmentAnswer = NodeAnswer | ChoiceAnswer | OrderAnswer;
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
export type ChoiceQuestion = {
  readonly kind: "choice";
  readonly id: string;
  readonly prompt: string;
  readonly stepId: string;
  readonly choices: readonly { readonly id: string; readonly text: string }[];
  readonly correctAnswer: ChoiceAnswer;
  readonly requires: null;
  readonly reviewStepIds: readonly [string, ...string[]];
  readonly tags: readonly string[];
};
export type ParsonsQuestion = Omit<ChoiceQuestion, "kind" | "choices" | "correctAnswer"> & {
  readonly kind: "parsons";
  readonly lineIds: readonly string[];
  readonly correctAnswer: OrderAnswer;
  /** 正解順で隣接する、グループ内だけ順不同の行。未指定なら完全一致。 */
  readonly interchangeableLineGroups?: readonly (readonly string[])[];
};
export type DiagnosticAssessment = {
  readonly version: 1;
  readonly kind: "diagnostic-check";
  readonly id: string;
  readonly questions: readonly [NodeTapQuestion | ChoiceQuestion | ParsonsQuestion, ...(NodeTapQuestion | ChoiceQuestion | ParsonsQuestion)[]];
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
export type AssessmentContent = NodeTapAssessment | CodeBlankAssessment | DiagnosticAssessment;
type Question = NodeTapQuestion | CodeBlankQuestion | ChoiceQuestion | ParsonsQuestion;
export type QuestionRecord = {
  readonly questionId: string;
  readonly attemptCount: number;
  readonly firstCorrect: boolean | null;
  readonly solved: boolean;
  readonly attempts: readonly { readonly number: number; readonly answer: AssessmentAnswer; readonly correct: boolean }[];
};
export type AssessmentState = {
  readonly assessmentId: string;
  readonly records: readonly QuestionRecord[];
  /** 現在の問題の位置。全形式共通で、回答後の再挑戦と「次へ」を分離する。 */
  readonly position?: number;
};

export function sameAnswer(left: AssessmentAnswer, right: AssessmentAnswer): boolean {
  if (left.kind === "order") return right.kind === "order" && left.lineIds.length === right.lineIds.length && left.lineIds.every((id, index) => id === right.lineIds[index]);
  if (left.kind === "none") return right.kind === "none";
  if (left.kind === "choice") return right.kind === "choice" && left.choiceId === right.choiceId;
  return right.kind === "node" && left.nodeId === right.nodeId;
}
function isCodeBlank(question: Question): question is CodeBlankQuestion {
  return "kind" in question && question.kind === "code-blank";
}
function normalizeParsonsOrder(question: ParsonsQuestion, answer: OrderAnswer): OrderAnswer {
  const lineIds = [...answer.lineIds];
  for (const group of question.interchangeableLineGroups ?? []) {
    const canonical = question.correctAnswer.lineIds.filter(id => group.includes(id));
    const positions = lineIds.flatMap((id, index) => group.includes(id) ? [index] : []);
    // 離れた行や他の行を飛び越えた移動は許容しない。
    if (positions.length === canonical.length && positions.every((position, index) => position === positions[0] + index)) {
      positions.forEach((position, index) => { lineIds[position] = canonical[index]; });
    }
  }
  return { kind: "order", lineIds };
}
function allowed(question: Question, answer: AssessmentAnswer): boolean {
  if ("kind" in question && question.kind === "parsons") return answer.kind === "order" &&
    answer.lineIds.length === question.lineIds.length && new Set(answer.lineIds).size === question.lineIds.length && answer.lineIds.every(id => question.lineIds.includes(id));
  if (isCodeBlank(question) || ("kind" in question && question.kind === "choice")) return answer.kind === "choice" && question.choices.some(choice => choice.id === answer.choiceId);
  return answer.kind === "none" ? question.allowNone : answer.kind === "node" && question.nodeIds.includes(answer.nodeId);
}
export function validateAssessment(content: AssessmentContent): void {
  if (content.version !== 1 || !["node-tap-check", "code-blank-check", "diagnostic-check"].includes(content.kind) || !content.id.trim() || !content.questions.length) throw new Error("Invalid assessment");
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
    } else if ("kind" in question && question.kind === "choice") {
      if (content.kind !== "diagnostic-check" || question.requires !== null || question.choices.length < 2 ||
        new Set(question.choices.map(choice => choice.id)).size !== question.choices.length || new Set(question.choices.map(choice => choice.text)).size !== question.choices.length ||
        question.choices.some(choice => !choice.id.trim() || !choice.text.trim())) throw new Error("Invalid choice question");
    } else if ("kind" in question && question.kind === "parsons") {
      if (content.kind !== "diagnostic-check" || question.requires !== null || question.lineIds.length < 2 ||
        new Set(question.lineIds).size !== question.lineIds.length || question.lineIds.some(id => !id.trim())) throw new Error("Invalid Parsons question");
      const grouped = new Set<string>();
      for (const group of question.interchangeableLineGroups ?? []) {
        const positions = group.map(id => question.correctAnswer.lineIds.indexOf(id)).sort((a, b) => a - b);
        if (group.length < 2 || group.some(id => grouped.has(id) || !question.lineIds.includes(id)) ||
          new Set(group).size !== group.length || positions.some((position, index) => position !== positions[0] + index)) throw new Error("Invalid interchangeable line group");
        group.forEach(id => grouped.add(id));
      }
    } else if (content.kind === "code-blank-check" || !question.nodeIds.length || new Set(question.nodeIds).size !== question.nodeIds.length) {
      throw new Error("Invalid node-tap question");
    }
    if (content.kind === "diagnostic-check" && (question.requires !== null || !question.tags.length || question.tags.some(tag => !tag.trim()))) throw new Error("Diagnostic questions need independent tags");
    if (question.requires) {
      const prerequisite = earlier.get(question.requires.questionId);
      if (!prerequisite || !sameAnswer(prerequisite.correctAnswer, question.requires.answer)) throw new Error("Question requires an earlier correct answer");
    }
    earlier.set(question.id, question);
  }
}
export function createAssessmentState(content: AssessmentContent): AssessmentState {
  validateAssessment(content);
  return { assessmentId: content.id, position: 0, records: content.questions.map(question => ({ questionId: question.id, attemptCount: 0, firstCorrect: null, solved: false, attempts: [] })) };
}
/** 進行は全形式で位置ベース。正解しても止まらない問題（確認問題）も、位置が進んだ問題へは戻らない。 */
export function activeQuestion<T extends AssessmentContent>(content: T, state: AssessmentState): T["questions"][number] | null {
  if (state.assessmentId !== content.id) throw new Error("Assessment session mismatch");
  return content.questions[state.position ?? 0] ?? null;
}
/** 完了は全形式共通：最後まで進み、全問に1回以上回答していること（正解は問わない）。結果は初回回答から導く。 */
export function assessmentComplete(content: AssessmentContent, state: AssessmentState): boolean {
  return state.assessmentId === content.id && state.position === content.questions.length &&
    content.questions.every(question => state.records.some(record => record.questionId === question.id && record.attemptCount > 0));
}
/** questionId を照合するため、連打・古い画面のイベントが次問の回答として記録されない。 */
export function answerQuestion(content: AssessmentContent, state: AssessmentState, questionId: string, answer: AssessmentAnswer): AssessmentState {
  const question = activeQuestion(content, state);
  if (!question || question.id !== questionId || !allowed(question, answer)) return state;
  const comparable = "kind" in question && question.kind === "parsons" && answer.kind === "order" ? normalizeParsonsOrder(question, answer) : answer;
  const correct = sameAnswer(comparable, question.correctAnswer);
  // 確認問題（診断型以外）は正解したらそのまま次の問題へ進む。診断型は正解しても「次へ」を押すまで同じ問に留まる。
  const advance = correct && content.kind !== "diagnostic-check";
  return { ...state, position: advance ? (state.position ?? 0) + 1 : state.position, records: state.records.map(record => record.questionId !== questionId ? record : {
    questionId, attemptCount: record.attemptCount + 1, firstCorrect: record.firstCorrect ?? correct, solved: record.solved || correct,
    attempts: [...record.attempts, { number: record.attemptCount + 1, answer: answer.kind === "order" ? { ...answer, lineIds: [...answer.lineIds] } : { ...answer }, correct }],
  }) };
}

/** 正誤では止めない進行。回答直後は同じ問で再挑戦でき、「次へ」で正解していなくても進める。 */
export function advanceAssessment(content: AssessmentContent, state: AssessmentState, questionId: string): AssessmentState {
  const question = activeQuestion(content, state);
  if (!question || question.id !== questionId || !state.records.some(record => record.questionId === questionId && record.attemptCount > 0)) return state;
  return { ...state, position: (state.position ?? 0) + 1 };
}

/** 診断は最新の正誤や再挑戦後のsolvedではなく、初回だけから導出する。 */
export function diagnoseAssessment(content: DiagnosticAssessment, state: AssessmentState) {
  if (!assessmentComplete(content, state)) throw new Error("Diagnostic assessment is incomplete");
  const tags = [...new Set(content.questions.flatMap(question => question.tags))].map(tag => {
    const questions = content.questions.filter(question => question.tags.includes(tag));
    const correct = questions.filter(question => state.records.find(record => record.questionId === question.id)?.firstCorrect === true).length;
    return { tag, correct, total: questions.length, passed: correct === questions.length };
  });
  return { correct: state.records.filter(record => record.firstCorrect === true).length, total: content.questions.length, tags };
}
