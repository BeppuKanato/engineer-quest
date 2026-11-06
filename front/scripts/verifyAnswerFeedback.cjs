const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const root = path.resolve(__dirname, "../src");

function createLoader(overrides = {}, globals = {}) {
  const cache = new Map();
  return function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(source, { ...globals, exports, require: name => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (!name.startsWith(".")) return require(name);
      const base = path.resolve(path.dirname(file), name);
      return load([`${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate)));
    } }, { filename: file });
    return exports;
  };
}
const load = createLoader();
const file = name => path.join(root, "features/learning", name);
const { newAnswerFeedback, answerFeedbackText } = load(file("assessment/answerFeedbackState.ts"));
const assessment = load(file("assessment/assessment.ts"));
const concept = load(file("bfs/check/check.content.ts")).bfsCheckContent;
const code = load(file("bfs/code-check/codeCheck.content.ts")).bfsCodeCheckContent;
const diagnostic = load(file("bfs/consolidation/consolidation.content.ts")).bfsConsolidationContent;
const { createAssessmentState, answerQuestion, advanceAssessment, assessmentComplete } = assessment;

let before = createAssessmentState(concept);
let after = answerQuestion(concept, before, concept.questions[0].id, { kind: "node", nodeId: "D" });
assert.equal(newAnswerFeedback(concept, before, after).correct, false);
assert.equal(newAnswerFeedback(concept, before, after).message, answerFeedbackText.incorrect);
assert.equal(newAnswerFeedback(concept, after, after), null, "Rerenders and restored records are silent");
assert.equal(newAnswerFeedback(concept, before, before), null, "Rejected submissions are silent");
assert.equal(newAnswerFeedback(concept, { ...before, assessmentId: "other" }, after), null);
const firstError = after;
after = answerQuestion(concept, after, concept.questions[0].id, { kind: "node", nodeId: "D" });
assert.equal(newAnswerFeedback(concept, firstError, after).attempt, 2, "The same wrong answer is a new response");
before = after;
after = answerQuestion(concept, before, concept.questions[0].id, concept.questions[0].correctAnswer);
assert.equal(newAnswerFeedback(concept, before, after).message, "正解！", "Do not invent broader praise for phase 3");
before = after;
after = answerQuestion(concept, before, concept.questions[1].id, { kind: "none" });
assert(assessmentComplete(concept, after));
assert.equal(newAnswerFeedback(concept, before, after).correct, true, "The final accepted answer still produces feedback");
assert.equal(after.records[0].firstCorrect, false, "Presentation does not rewrite first-attempt diagnosis");

for (const question of code.questions) {
  const initial = createAssessmentState(code);
  // Reach the independent question through the existing reducer, without changing its policy.
  let current = initial;
  for (const earlier of code.questions) {
    if (earlier.id === question.id) break;
    current = answerQuestion(code, current, earlier.id, earlier.correctAnswer);
  }
  const correct = answerQuestion(code, current, question.id, question.correctAnswer);
  assert.equal(newAnswerFeedback(code, current, correct).message, question.correctFeedback);
  const wrong = question.choices.find(choice => choice.id !== question.correctAnswer.choiceId);
  assert.equal(newAnswerFeedback(code, current, answerQuestion(code, current, question.id, { kind: "choice", choiceId: wrong.id })).message, code.retryFeedback);
}

let current = createAssessmentState(diagnostic);
const kinds = new Set();
for (const question of diagnostic.questions) {
  kinds.add(question.kind);
  const snapshot = JSON.stringify(current);
  const correct = answerQuestion(diagnostic, current, question.id, question.correctAnswer);
  assert.equal(newAnswerFeedback(diagnostic, current, correct).message, question.correctFeedback);
  const wrong = question.kind === "node" ? { kind: "node", nodeId: "B" }
    : question.kind === "choice" ? { kind: "choice", choiceId: question.choices.find(choice => choice.id !== question.correctAnswer.choiceId).id }
      : { kind: "order", lineIds: question.lineIds };
  const incorrect = answerQuestion(diagnostic, current, question.id, wrong);
  assert.equal(newAnswerFeedback(diagnostic, current, incorrect).message, question.incorrectFeedback);
  assert.equal(JSON.stringify(current), snapshot, "The reader must leave records untouched");
  const next = advanceAssessment(diagnostic, incorrect, question.id);
  assert.equal(newAnswerFeedback(diagnostic, incorrect, next), null, "Next and diagnosis do not replay the last answer");
  current = next;
}
assert.equal([...kinds].sort().join(), "choice,node,parsons");
assert(assessmentComplete(diagnostic, current), "The soft gate still allows all-wrong completion");

// Exercise the effect guard, including StrictMode replay, inactive phases, settings rerenders and reset.
const shown = [], effects = [];
let previousRef;
let presenter = feedback => shown.push(feedback);
const hookModule = createLoader({ react: { ...React,
  useContext: () => presenter,
  useRef: value => previousRef ??= { current: value },
  useEffect: callback => effects.push(callback),
}, "@/app/component/soundFeedback": { useSoundEffect: () => ({ play() {} }) } })(file("assessment/AnswerFeedback.tsx"));
function renderHook(state, active = true) {
  effects.length = 0;
  hookModule.useAssessmentFeedback(concept, state, active);
  effects.forEach(effect => effect());
}
const initial = createAssessmentState(concept);
renderHook(initial); assert.equal(shown.length, 0);
renderHook(firstError); assert.equal(shown.length, 1);
effects[0](); assert.equal(shown.length, 1, "StrictMode must not duplicate a response");
renderHook(firstError); assert.equal(shown.length, 1);
presenter = feedback => shown.push(feedback);
renderHook(firstError); assert.equal(shown.length, 1, "Sound setting changes must not replay a response");
renderHook(after, false); renderHook(after); assert.equal(shown.length, 1, "Returning to a hidden phase is silent");
renderHook(initial); renderHook(firstError); assert.equal(shown.length, 2, "Reset starts a fresh response sequence");

// Provider sound selection and timer lifetime are independent of the answering child's lifetime.
const played = [], cleared = [], timers = new Map(), refs = [], cleanups = [];
let state = null, refIndex = 0, timerId = 0, reduced = false;
const uiModule = createLoader({ react: { ...React,
  useCallback: callback => callback,
  useRef: value => refs[refIndex++] ??= { current: value },
  useState: () => [state, value => { state = typeof value === "function" ? value(state) : value; }],
  useEffect: callback => { const cleanup = callback(); if (cleanup) cleanups.push(cleanup); },
}, "@/app/component/soundFeedback": { useSoundEffect: () => ({ play: name => played.push(name) }) },
"framer-motion": { ...require("framer-motion"), useReducedMotion: () => reduced },
}, { setTimeout: (callback, ms) => { const id = ++timerId; timers.set(id, { callback, ms }); return id; }, clearTimeout: id => cleared.push(id) })(file("assessment/AnswerFeedback.tsx"));
const tree = uiModule.AnswerFeedbackProvider({ children: null });
const present = tree.props.value;
const response = { questionId: "q", attempt: 1, correct: true, message: "正解！" };
present(response);
assert.equal(played.join(), "answerCorrect");
assert.equal(timers.get(1).ms, 1500);
assert.equal(state.correct, true, "A final answer remains present without its phase component");
present({ ...response, correct: false, message: "不正解。もう一度考えてみよう。" });
assert.equal(played.join(), "answerCorrect,answerIncorrect");
assert(cleared.includes(1), "A new answer replaces the previous presentation");
timers.get(2).callback(); assert.equal(state, null);
present(response); cleanups.forEach(cleanup => cleanup()); assert(cleared.includes(3));
for (const correct of [true, false]) {
  reduced = false;
  const overlay = uiModule.AnswerFeedbackPresentation({ feedback: { ...response, correct } });
  assert.equal(overlay.props.sx.pointerEvents, "none", "Feedback must never block answering or navigation");
  assert.equal(overlay.props.role, "status");
  const panel = overlay.props.children;
  assert.equal(panel.props.transition.opacity.duration, 1.5, "Keep the response visible long enough to recognize");
  assert.equal(panel.props.transition.scale.duration, 0.6, "Keep the zoom brief, then hold the result");
  assert.equal(panel.props.transition.repeat, undefined, "No loop");
  assert.equal(panel.props.children[0].props.children.type, correct ? "circle" : "path");
  if (!correct) assert.equal(panel.props.animate.scale, 1, "Incorrect answers do not zoom or shake");
  reduced = true;
  const quiet = uiModule.AnswerFeedbackPresentation({ feedback: { ...response, correct } }).props.children;
  assert.equal(quiet.props.initial, false); assert.equal(quiet.props.transition.opacity.duration, 0);
  assert.equal(quiet.props.transition.scale.duration, 0);
  assert.equal(quiet.props.animate.scale, 1); assert.equal(quiet.props.animate.opacity, 1);
}

for (const preview of ["bfs/check/BfsCheckPreview.tsx", "bfs/code-check/BfsCodeCheckPreview.tsx", "bfs/consolidation/BfsConsolidationPreview.tsx"]) {
  const source = fs.readFileSync(file(preview), "utf8");
  assert.match(source, /useAssessmentFeedback\(/, `${preview}: shared response hook`);
  assert.match(source, /<AnswerFeedbackMessage\b/, `${preview}: shared message renderer`);
  assert(!source.includes("useSoundEffect"), "Phases must not add their own playback path");
}
const layout = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8");
assert.match(layout, /<SoundProvider>\s*<AnswerFeedbackProvider>[\s\S]*\{children\}[\s\S]*<\/AnswerFeedbackProvider>\s*<\/SoundProvider>/);
console.log("Answer feedback: recorded outcomes for every answer type, existing copy, final response lifetime, soft gate, silent rerenders/review/restore, StrictMode dedupe, sound routing, timer replacement, non-blocking presentation and reduced motion passed.");
