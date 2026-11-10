const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const ts = require("typescript"), React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
function createLoader(overrides = {}) {
  const cache = new Map();
  return function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename);
    const exports = {}; cache.set(filename, exports);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(source, { exports, require: name => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (!name.startsWith(".")) return require(name);
      const base = path.resolve(path.dirname(filename), name);
      return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
    } }, { filename });
    return exports;
  };
}
const root = path.resolve(__dirname, "../src/features/learning");
const file = relative => `${root}/${relative}`;
const load = createLoader();
const plain = value => JSON.parse(JSON.stringify(value));
const node = nodeId => ({ kind: "node", nodeId });
const { dfsCheckContent: content } = load(file("dfs/check/check.content.ts"));
const { dfsExecutionContent: execution } = load(file("dfs/execution/execution.content.ts"));
const { searchGraph: graph } = load(file("graphs/searchGraph.ts"));
const { getLearningStep: get, selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateAssessment, createAssessmentState, answerQuestion, advanceAssessment, activeQuestion, assessmentComplete } = load(file("assessment/assessment.ts"));
const { newAnswerFeedback } = load(file("assessment/answerFeedbackState.ts"));
const [q1, q2] = content.questions;
assert.equal(content.id, "dfs-check"); assert.equal(content.phase, 3); assert.equal(content.stageName, "動きの確認問題");
assert.equal(content.questions.length, 2);
assert.deepEqual(plain(content.questions.map(q => [q.id, q.stepId, q.correctAnswer.nodeId, q.tags[0]])), [
  ["take-next", "skip-b-from-d", "F", "next-pop"], ["after-f", "dead-end-f", "E", "after-dead-end"],
]);
assert.equal(q1.requires, null);
assert.deepEqual(plain(q2.requires), { questionId: q1.id, answer: plain(q1.correctAnswer) });
const baseline = fs.readFileSync(path.resolve(__dirname, "../../docs/concept/dfs-unit-baseline.md"), "utf8");
for (const q of content.questions) {
  assert(baseline.includes(q.prompt)); assert(baseline.includes(q.correctFeedback));
  assert.equal(q.allowNone, false, "Both questions have an actual next pop; no none option");
  assert(!/フェーズ|完璧|マスター|再帰/u.test(q.prompt + q.correctFeedback));
  const step = get(execution, q.stepId);
  assert.equal(step.canvas.data.graph, graph);
  assert.deepEqual(plain(q.nodeIds), plain(graph.nodes.map(n => n.id)));
  assert.deepEqual(plain(q.correctAnswer), node(step.canvas.state.stack.at(-1)), "The answer is the actual stack tail");
  const review = selectReviewContent(execution, q.reviewStepIds);
  review.steps.forEach((step, index) => assert.equal(step, get(execution, q.reviewStepIds[index]), "Review uses original steps by reference"));
  assert.equal(review.steps.at(-1).canvas.state.operation.kind, "pop");
  assert.equal(review.steps.at(-1).canvas.state.current, q.correctAnswer.nodeId);
}
assert.equal(q1.reviewStepIds.join(), "skip-b-from-d,pop-f");
assert.equal(q2.reviewStepIds.join(), "dead-end-f,pop-e");
const beforeF = get(execution, q1.stepId).canvas.state, deadEnd = get(execution, q2.stepId).canvas.state;
assert.deepEqual(plain(beforeF.stack), ["C", "E", "F"]); assert.equal(beforeF.current, "D");
assert.deepEqual(plain(deadEnd.stack), ["C", "E"]); assert.equal(deadEnd.current, q1.correctAnswer.nodeId);
assert.equal(deadEnd.operation.kind, "no-add");
const neighbors = graph.edges.flatMap(edge => edge.from === "F" ? [edge.to] : edge.to === "F" ? [edge.from] : []);
assert(neighbors.every(id => deadEnd.nodes.find(n => n.id === id).status !== "idle"), "F cannot add an undiscovered neighbor");
assert.deepEqual(plain(get(execution, "pop-f").canvas.state.stack), plain(deadEnd.stack), "No-add keeps the stack unchanged");
assert.equal(content.completion.stepId, "pop-e");

let state = createAssessmentState(content);
assert.equal(advanceAssessment(content, state, q1.id), state, "No advancing before an answer");
assert.equal(answerQuestion(content, state, q2.id, node("E")), state, "No answering the future question");
assert.equal(answerQuestion(content, state, q1.id, { kind: "none" }), state);
assert.equal(answerQuestion(content, state, q1.id, node("unknown")), state);
for (const q of content.questions) {
  for (const id of q.nodeIds.filter(id => id !== q.correctAnswer.nodeId)) {
    const previous = state;
    state = answerQuestion(content, state, q.id, node(id));
    assert.equal(activeQuestion(content, state).id, q.id);
    assert.equal(newAnswerFeedback(content, previous, state).message, "不正解。もう一度考えてみよう。");
    const saved = JSON.stringify(state);
    selectReviewContent(execution, q.reviewStepIds);
    assert.equal(JSON.stringify(state), saved, "Opening a review does not change attempts");
  }
  const previous = state;
  state = answerQuestion(content, state, q.id, q.correctAnswer);
  assert.equal(newAnswerFeedback(content, previous, state).message, q.correctFeedback);
  assert.equal(newAnswerFeedback(content, state, state), null, "Rerenders/review restore are silent");
  assert.equal(state.records.find(r => r.questionId === q.id).firstCorrect, false, "Retry success preserves the first failure");
  assert.equal(activeQuestion(content, state).id, q.id, "Success waits for the explicit next button");
  state = advanceAssessment(content, state, q.id);
}
assert(assessmentComplete(content, state));
assert(state.records.every(r => r.attemptCount === 6 && r.attempts.map(a => a.number).join() === "1,2,3,4,5,6"));
assert.equal(answerQuestion(content, state, q2.id, node("E")), state);
let skipped = createAssessmentState(content);
for (const q of content.questions) {
  skipped = answerQuestion(content, skipped, q.id, node("A"));
  skipped = advanceAssessment(content, skipped, q.id);
}
assert(assessmentComplete(content, skipped), "An all-wrong run completes through the common soft gate");
assert(skipped.records.every(r => r.firstCorrect === false && !r.solved));
const invalid = plain(content); invalid.questions[1].requires.answer.nodeId = "A";
assert.throws(() => validateAssessment(invalid));
assert.throws(() => selectReviewContent(execution, ["missing"]));

const { DfsCheckCanvas } = load(file("dfs/check/DfsCheckCanvas.tsx"));
const { DfsExecutionCanvas } = load(file("dfs/execution/DfsExecutionCanvas.tsx"));
for (const q of content.questions) {
  const canvas = get(execution, q.stepId).canvas, saved = JSON.stringify(canvas);
  const html = renderToStaticMarkup(React.createElement(DfsCheckCanvas, { canvas, questionId: q.id, nodeIds: q.nodeIds, onAnswer() {} }));
  assert.equal((html.match(/<circle\b/gu) || []).length, 6, "No duplicated algorithm/answer ring");
  assert.equal((html.match(/<button\b/gu) || []).length, 6);
  assert.match(html, /role="group" aria-label="回答の選択肢"/u);
  for (const id of q.nodeIds) assert.equal(html.split(`aria-label="${id}を選ぶ"`).length - 1, 1);
  assert(!html.includes("どれも入らない"));
  assert.match(html, new RegExp(`data-node-id="${canvas.state.current}"[\\s\\S]*?<circle[^>]*fill="#2563eb"`, "u"));
  assert.match(html, /スタックの中身（左が底、右が末尾）/u); assert.match(html, /訪問順の中身/u);
  const locked = renderToStaticMarkup(React.createElement(DfsCheckCanvas, { canvas, questionId: q.id, nodeIds: q.nodeIds, disabled: true, onAnswer() {} }));
  assert.equal((locked.match(/ disabled=""/gu) || []).length, 6, "Correct responses lock every answer control");
  assert.equal(JSON.stringify(canvas), saved);
  const playback = renderToStaticMarkup(React.createElement(DfsExecutionCanvas, { canvas }));
  assert.equal((playback.match(/<circle\b/gu) || []).length, 7, "Normal playback keeps its original focus ring");
  assert.match(playback, /viewBox="0 0 600 510"/u);
}

// Execute the actual preview callbacks with a small React hook harness, without a browser or backend.
const slots = []; let cursor = 0;
const hooks = { ...React,
  useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], update => { slots[index] = typeof update === "function" ? update(slots[index]) : update; }]; },
  useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
  useEffect(effect) { effect(); },
};
const ui = createLoader({ react: hooks, "../../assessment/AnswerFeedback": { AnswerFeedbackNotice: () => null, useAssessmentFeedback() {} } });
const { DfsCheckPreview } = ui(file("dfs/check/DfsCheckPreview.tsx"));
const Canvas = ui(file("dfs/check/DfsCheckCanvas.tsx")).DfsCheckCanvas;
const ReviewButton = ui(file("review/AssessmentReviewButton.tsx")).AssessmentReviewButton;
const ReviewDialog = ui(file("review/LearningReviewDialog.tsx")).LearningReviewDialog;
const elements = value => !value || typeof value !== "object" ? [] : Array.isArray(value) ? value.flatMap(elements) : [value, ...elements(value.props?.children)];
let tree, props;
const render = () => { cursor = 0; tree = elements(DfsCheckPreview(props)); };
const canvas = () => tree.find(element => element.type === Canvas).props;
const button = label => { const element = tree.find(element => element.props?.children === label); assert(element, `Missing button: ${label}`); return element.props; };
render();
const first = canvas(); first.onAnswer(node("A")); render();
assert.equal(canvas().questionId, q1.id); assert.equal(canvas().disabled, false);
tree.find(element => element.type === ReviewButton).props.onClick(); render();
const dialog = tree.find(element => element.type === ReviewDialog);
assert(dialog); assert.equal(dialog.props.stepIds.join(), q1.reviewStepIds.join());
const recordBeforeReviewClose = slots[0]; dialog.props.onClose(); render();
assert.equal(slots[0], recordBeforeReviewClose);
canvas().onAnswer(node("F")); render();
assert.equal(canvas().disabled, true);
const solved = slots[0]; first.onAnswer(node("F")); render();
assert.equal(slots[0], solved, "Even a queued duplicate cannot add another attempt after success");
button("次の問題へ").onClick(); render();
assert.equal(canvas().questionId, q2.id);
first.onAnswer(node("A")); render(); assert.equal(slots[0].records[1].attemptCount, 0, "Stale first-question callbacks cannot answer question 2");
canvas().onAnswer(node("F")); render();
tree.find(element => element.type === ReviewButton).props.onClick(); render();
assert.equal(tree.find(element => element.type === ReviewDialog).props.stepIds.join(), "dead-end-f,pop-e");
tree.find(element => element.type === ReviewDialog).props.onClose(); render();
button("結果を見る").onClick(); render();
assert(tree.some(element => element.props?.children === "初回の正解は2問中0問でした。"), "Do not praise mastery or claim success after wrong answers");
assert.equal(canvas().questionId, undefined);
button("もう一度解く").onClick(); render();
for (const [answer, label] of [["F", "次の問題へ"], ["E", "結果を見る"]]) {
  canvas().onAnswer(node(answer)); render(); button(label).onClick(); render();
}
assert(tree.some(element => element.props?.children === "初回の正解は2問中2問でした。"));

slots.length = 0;
const summaries = [];
props = { embedded: true, onComplete: summary => summaries.push(summary) };
render();
for (const [answer, label] of [["A", "次の問題へ"], ["E", "結果を見る"]]) {
  canvas().onAnswer(node(answer)); render(); button(label).onClick(); render();
}
render();
assert.deepEqual(JSON.parse(JSON.stringify(summaries)), [{ firstAttemptCorrect: 1, totalQuestions: 2 }]);

const overlay = fs.readFileSync(file("assessment/NodeAnswerOverlay.tsx"), "utf8");
assert.match(overlay, /prefers-reduced-motion: reduce/u); assert.match(overlay, /answer-cue 700ms ease-in-out 2/u);
const preview = fs.readFileSync(file("dfs/check/DfsCheckPreview.tsx"), "utf8");
assert.match(preview, /useAssessmentFeedback\(dfsCheckContent, session, active && !reviewOpen\)/u);
assert.match(preview, /AnswerFeedbackNotice assessmentId=\{dfsCheckContent.id\}/u);
assert(!/fetch\(|localStorage|sessionStorage/u.test(preview), "The preview does not persist progress");
for (const relative of ["bfs/check/BfsCheckCanvas.tsx", "dfs/check/DfsCheckCanvas.tsx"]) assert.match(fs.readFileSync(file(relative), "utf8"), /<NodeAnswerOverlay/u);
console.log("DFS check verified: F/E linked questions, original DFS snapshots/review, soft gate and retries, immutable first results, callback locking, shared answer controls, feedback wiring and standalone scope.");
