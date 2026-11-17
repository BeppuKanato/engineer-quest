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
const NONE = { kind: "none" };
const { dfsCheckContent: content } = load(file("dfs/check/check.content.ts"));
const { dfsExecutionContent: execution } = load(file("dfs/execution/execution.content.ts"));
const { searchGraph: graph } = load(file("graphs/searchGraph.ts"));
const { getLearningStep: get, selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateAssessment, createAssessmentState, answerQuestion, advanceAssessment, activeQuestion, assessmentComplete } = load(file("assessment/assessment.ts"));
const { newAnswerFeedback } = load(file("assessment/answerFeedbackState.ts"));
const [q1, q2, q3, q4, q5, q6, q7, q8] = content.questions;
assert.equal(content.id, "dfs-check"); assert.equal(content.phase, 3); assert.equal(content.stageName, "動きの確認問題");
assert.equal(content.kind, "concept-check");
assert.equal(content.questions.length, 8);
assert.deepEqual(plain(content.questions.map(q => [q.id, q.stepId, q.tags[0]])), [
  ["take-next", "skip-b-from-d", "next-pop"], ["after-f", "dead-end-f", "after-dead-end"],
  ["push-next-from-a", "push-c-from-a", "push-order"], ["take-after-push", "push-b-from-a", "push-order"],
  ["visit-order-f", "pop-d", "visit-order"], ["add-after-f", "pop-f", "no-add"],
  ["add-after-e", "pop-e", "no-add"], ["stack-empty", "no-add-from-e", "stack-empty"],
]);
assert.deepEqual(plain(content.questions.map(q => q.correctAnswer)), [
  node("F"), node("E"), node("B"), node("B"),
  { kind: "choice", choiceId: "four" }, NONE, NONE, node("C"),
]);
assert.deepEqual(plain(content.questions.map(q => q.reviewStepIds)), [
  ["skip-b-from-d", "pop-f"], ["dead-end-f", "pop-e"],
  ["push-c-from-a", "push-b-from-a"], ["push-b-from-a", "pop-b"],
  ["pop-d", "pop-f"], ["pop-f", "dead-end-f"],
  ["pop-e", "no-add-from-e"], ["no-add-from-e", "pop-c", "finish-all"],
]);
// 連動: 問2は問1、問4は問3、問8は問7の正解を前提にする。それ以外は前提なし。
assert.equal(q1.requires, null); assert.equal(q3.requires, null);
assert.equal(q5.requires, null); assert.equal(q6.requires, null); assert.equal(q7.requires, null);
assert.deepEqual(plain(q2.requires), { questionId: q1.id, answer: plain(q1.correctAnswer) });
assert.deepEqual(plain(q4.requires), { questionId: q3.id, answer: plain(q3.correctAnswer) });
assert.deepEqual(plain(q8.requires), { questionId: q7.id, answer: plain(q7.correctAnswer) });

const baseline = fs.readFileSync(path.resolve(__dirname, "../../docs/concept/dfs-unit-baseline.md"), "utf8");
const stepIndex = stepId => execution.steps.findIndex(step => step.id === stepId);
for (const q of content.questions) {
  assert(baseline.includes(q.prompt), `Baseline documents the prompt: ${q.id}`);
  assert(baseline.includes(q.correctFeedback), `Baseline documents the feedback: ${q.id}`);
  assert(!/フェーズ|完璧|マスター|再帰/u.test(q.prompt + q.correctFeedback));
  const step = get(execution, q.stepId);
  assert.equal(step.canvas.data.graph, graph);
  const review = selectReviewContent(execution, q.reviewStepIds);
  review.steps.forEach((reviewStep, index) => assert.equal(reviewStep, get(execution, q.reviewStepIds[index]), "Review uses original steps by reference"));
  if ("nodeIds" in q) assert.deepEqual(plain(q.nodeIds), plain(graph.nodes.map(n => n.id)));
}
// 取り出す問題の正解は、その場面のスタック末尾そのもの。
for (const q of [q1, q2, q4]) {
  assert.deepEqual(plain(q.correctAnswer), node(get(execution, q.stepId).canvas.state.stack.at(-1)), `${q.id}: answer is the stack tail`);
  const lastReview = get(execution, q.reviewStepIds.at(-1));
  assert.equal(lastReview.canvas.state.operation.kind, "pop");
  assert.equal(lastReview.canvas.state.current, q.correctAnswer.nodeId);
}
// 問3: push-c-from-a の直後のコマが、正解の場所を追加するコマである。
const afterPushC = execution.steps[stepIndex("push-c-from-a") + 1];
assert.equal(afterPushC.id, "push-b-from-a");
assert.deepEqual(plain(afterPushC.canvas.state.operation), { kind: "push", from: "A", nodeId: q3.correctAnswer.nodeId, edgeId: "ab" });
// 問5: pop-d 時点の訪問順は3件で、その次に取り出されるのはF。数値の正解は4。
assert.deepEqual(plain(get(execution, "pop-d").canvas.state.order), ["A", "B", "D"]);
assert.deepEqual(plain(q5.choices.map(choice => choice.text)), ["3", "4", "5"]);
assert.equal(q5.choices.find(choice => choice.id === q5.correctAnswer.choiceId).text, "4");
// 問6・問7: 取り出し直後のコマが no-add で、隣はすべて発見済み側にある。
for (const [q, noAddId] of [[q6, "dead-end-f"], [q7, "no-add-from-e"]]) {
  assert.equal(q.allowNone, true);
  assert.equal(execution.steps[stepIndex(q.stepId) + 1].id, noAddId);
  assert.equal(get(execution, noAddId).canvas.state.operation.kind, "no-add");
}
const deadEnd = get(execution, "dead-end-f").canvas.state;
assert.deepEqual(plain(deadEnd.stack), ["C", "E"]); assert.equal(deadEnd.current, "F");
const neighborsOfF = graph.edges.flatMap(edge => edge.from === "F" ? [edge.to] : edge.to === "F" ? [edge.from] : []);
assert(neighborsOfF.every(id => deadEnd.nodes.find(n => n.id === id).status !== "idle"), "F cannot add an undiscovered neighbor");
assert.deepEqual(plain(get(execution, "pop-f").canvas.state.stack), plain(deadEnd.stack), "No-add keeps the stack unchanged");
// 問8: no-add-from-e のあとに残る取り出しは pop-c だけで、その時点でスタックが空になる。
assert.deepEqual(plain(get(execution, "pop-c").canvas.state.stack), []);
assert.equal(get(execution, "pop-c").canvas.state.current, q8.correctAnswer.nodeId);
assert.equal(content.completion.stepId, "finish-all");

// 全問: 誤答を一通り試してから正解し、初回結果が保持され、明示操作でのみ進む。
const wrongAnswers = q => "choices" in q
  ? q.choices.filter(choice => choice.id !== q.correctAnswer.choiceId).map(choice => ({ kind: "choice", choiceId: choice.id }))
  : q.correctAnswer.kind === "none"
    ? q.nodeIds.map(id => node(id))
    : q.nodeIds.filter(id => id !== q.correctAnswer.nodeId).map(id => node(id));
let state = createAssessmentState(content);
assert.equal(advanceAssessment(content, state, q1.id), state, "No advancing before an answer");
assert.equal(answerQuestion(content, state, q2.id, node("E")), state, "No answering the future question");
assert.equal(answerQuestion(content, state, q1.id, NONE), state, "None is rejected where allowNone is false");
assert.equal(answerQuestion(content, state, q1.id, node("unknown")), state);
for (const q of content.questions) {
  for (const wrong of wrongAnswers(q)) {
    const previous = state;
    state = answerQuestion(content, state, q.id, wrong);
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
for (const q of content.questions) {
  const record = state.records.find(r => r.questionId === q.id);
  assert.equal(record.attemptCount, wrongAnswers(q).length + 1);
  assert.deepEqual(record.attempts.map(a => a.number), record.attempts.map((_, index) => index + 1));
}
assert.equal(answerQuestion(content, state, q8.id, node("C")), state);
let skipped = createAssessmentState(content);
for (const q of content.questions) {
  skipped = answerQuestion(content, skipped, q.id, wrongAnswers(q)[0]);
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
  if (!("nodeIds" in q)) continue;
  const canvas = get(execution, q.stepId).canvas, saved = JSON.stringify(canvas);
  const html = renderToStaticMarkup(React.createElement(DfsCheckCanvas, { canvas, questionId: q.id, nodeIds: q.nodeIds, allowNone: q.allowNone, onAnswer() {} }));
  assert.equal((html.match(/<circle\b/gu) || []).length, 6, "No duplicated algorithm/answer ring");
  assert.equal((html.match(/<button\b/gu) || []).length, q.allowNone ? 7 : 6);
  assert.match(html, /role="group" aria-label="回答の選択肢"/u);
  for (const id of q.nodeIds) assert.equal(html.split(`aria-label="${id}を選ぶ"`).length - 1, 1);
  assert.equal(html.includes("どれも入らない"), q.allowNone);
  assert.match(html, new RegExp(`data-node-id="${canvas.state.current}"[\\s\\S]*?<circle[^>]*fill="#2563eb"`, "u"));
  assert.match(html, /スタックの中身（左が底、右が末尾）/u); assert.match(html, /訪問順の中身/u);
  const locked = renderToStaticMarkup(React.createElement(DfsCheckCanvas, { canvas, questionId: q.id, nodeIds: q.nodeIds, allowNone: q.allowNone, disabled: true, onAnswer() {} }));
  assert.equal((locked.match(/ disabled=""/gu) || []).length, q.allowNone ? 7 : 6, "Correct responses lock every answer control");
  assert.equal(JSON.stringify(canvas), saved);
}
const playback = renderToStaticMarkup(React.createElement(DfsExecutionCanvas, { canvas: get(execution, q1.stepId).canvas }));
assert.equal((playback.match(/<circle\b/gu) || []).length, 7, "Normal playback keeps its original focus ring");
assert.match(playback, /viewBox="0 0 600 510"/u);

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
const choiceButton = choiceId => { const element = tree.find(element => element.props?.["data-choice-id"] === choiceId); assert(element, `Missing choice: ${choiceId}`); return element.props; };
const answerCurrent = answer => {
  if (answer.kind === "choice") choiceButton(answer.choiceId).onClick();
  else canvas().onAnswer(answer);
  render();
};
const advanceCurrent = index => { button(index === content.questions.length - 1 ? "結果を見る" : "次の問題へ").onClick(); render(); };

// 問1: 誤答→復習→正解→入力固定→古いコールバックの無効、までを通す。
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
advanceCurrent(0);
assert.equal(canvas().questionId, q2.id);
first.onAnswer(node("A")); render(); assert.equal(slots[0].records[1].attemptCount, 0, "Stale first-question callbacks cannot answer question 2");
// 残りの問題を正解で進め、完了表示と要約を確認する。
for (const [index, q] of [...content.questions.entries()].slice(1)) {
  answerCurrent(q.correctAnswer);
  advanceCurrent(index);
}
assert(tree.some(element => element.props?.children === "初回の正解は8問中7問でした。"), "First-attempt results stay factual");
assert.equal(canvas().questionId, undefined);
button("もう一度解く").onClick(); render();
for (const [index, q] of content.questions.entries()) {
  answerCurrent(q.correctAnswer);
  advanceCurrent(index);
}
assert(tree.some(element => element.props?.children === "初回の正解は8問中8問でした。"));

slots.length = 0;
const summaries = [];
props = { embedded: true, onComplete: summary => summaries.push(summary) };
render();
for (const [index, q] of content.questions.entries()) {
  answerCurrent(index === 0 ? node("A") : q.correctAnswer);
  advanceCurrent(index);
}
render();
assert.deepEqual(JSON.parse(JSON.stringify(summaries.map(summary => ({ firstAttemptCorrect: summary.firstAttemptCorrect, totalQuestions: summary.totalQuestions })))), [{ firstAttemptCorrect: 7, totalQuestions: 8 }]);
assert.equal(summaries[0].assessmentEvidence.assessmentId, "dfs-check");
assert.deepEqual(JSON.parse(JSON.stringify(summaries[0].assessmentEvidence.records.map(r => r.attempts.map(a => a.correct)))),
  [[false], [true], [true], [true], [true], [true], [true], [true]]);

const overlay = fs.readFileSync(file("assessment/NodeAnswerOverlay.tsx"), "utf8");
assert.match(overlay, /prefers-reduced-motion: reduce/u); assert.match(overlay, /answer-cue 700ms ease-in-out 2/u);
const preview = fs.readFileSync(file("dfs/check/DfsCheckPreview.tsx"), "utf8");
assert.match(preview, /useAssessmentFeedback\(dfsCheckContent, session, active && !reviewOpen\)/u);
assert.match(preview, /AnswerFeedbackNotice assessmentId=\{dfsCheckContent.id\}/u);
assert(!/fetch\(|localStorage|sessionStorage/u.test(preview), "The preview does not persist progress");
for (const relative of ["bfs/check/BfsCheckCanvas.tsx", "dfs/check/DfsCheckCanvas.tsx"]) assert.match(fs.readFileSync(file(relative), "utf8"), /<NodeAnswerOverlay/u);
console.log("DFS check verified: 8 questions in 4 cycles (push order, visit order choice, no-add judgments, termination), original DFS snapshots/review, soft gate and retries, immutable first results, callback locking, shared answer controls, feedback wiring and standalone scope.");
