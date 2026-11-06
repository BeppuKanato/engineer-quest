const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { exports, require: name => {
    if (!name.startsWith(".")) return require(name);
    const target = path.resolve(path.dirname(filename), name);
    return load([`${target}.ts`, `${target}.tsx`].find(candidate => fs.existsSync(candidate)));
  } }, { filename });
  return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const { bfsCheckContent: content } = load(path.join(root, "bfs/check/check.content.ts"));
const { bfsExecutionContent: execution } = load(path.join(root, "bfs/execution/execution.content.ts"));
const { searchGraphNodes, searchGraphEdges } = load(path.join(root, "graphs/searchGraph.ts"));
const { getLearningStep, selectReviewContent } = load(path.join(root, "review/reviewContent.ts"));
const { validateAssessment, createAssessmentState, activeQuestion, answerQuestion, advanceAssessment, assessmentComplete } = load(path.join(root, "assessment/assessment.ts"));
const plain = value => JSON.parse(JSON.stringify(value));
const answer = nodeId => ({ kind: "node", nodeId });
const none = { kind: "none" };

function verifyData(candidate) {
  validateAssessment(candidate);
  assert.equal(candidate.phase, 3);
  assert.equal(candidate.questions.length, 2);
  const [take, after] = candidate.questions;
  assert.equal(take.prompt, "キューから次に取り出すのは、どれ？");
  assert.equal(after.prompt, "Cを取り出して調べたあと、キューに新しく入るのはどれ？");
  assert.equal(take.stepId, "complete-b");
  assert.equal(after.stepId, "dequeue-c");
  assert.equal(take.allowNone, false);
  assert.equal(after.allowNone, true);
  assert.equal(take.requires, null);
  const before = getLearningStep(execution, take.stepId).canvas;
  const processing = getLearningStep(execution, after.stepId).canvas;
  assert.equal(before.state.queue.map(item => item.nodeId).join(), "C,D,E");
  assert.equal(before.state.nodes.filter(node => node.status === "completed").map(node => node.id).join(), "A,B");
  assert.deepEqual(take.correctAnswer, answer(before.state.queue[0].nodeId), "Question 1 must select the actual FIFO head");
  assert.deepEqual(after.requires, { questionId: take.id, answer: take.correctAnswer });
  assert.equal(processing.state.current, take.correctAnswer.nodeId, "Question 2 must ask about the selected node");
  assert.deepEqual(plain(processing.state.queue), plain(before.state.queue.slice(1)));
  const neighbors = searchGraphEdges.flatMap(edge => edge.from === processing.state.current ? [edge.to] : edge.to === processing.state.current ? [edge.from] : []);
  const undiscovered = neighbors.filter(id => processing.state.nodes.find(node => node.id === id).status === "idle");
  assert.equal(undiscovered.length, 0, "Every neighbor is already discovered");
  assert.deepEqual(after.correctAnswer, none, "No new queue entry is possible");
  assert.equal(processing.state.nodes.find(node => node.id === "E").status, "queued");
  assert.equal(candidate.completion.stepId, "skip-e");
  assert.match(candidate.completion.caption, /取り出す順序と重ねて追加しない判断/u);
  assert.match(candidate.completion.caption, /次は、図の動きとコードの対応を確かめます/u);
  assert(!/完璧|マスター/u.test(candidate.completion.caption));
  for (const question of candidate.questions) {
    const step = getLearningStep(execution, question.stepId);
    assert.equal(step.canvas.data.graph.nodes, searchGraphNodes, "Use the canonical shared graph");
    assert.equal(step.canvas.data.graph.edges, searchGraphEdges);
    assert.deepEqual(question.nodeIds, plain(searchGraphNodes.map(node => node.id)));
    const review = selectReviewContent(execution, question.reviewStepIds);
    review.steps.forEach((step, i) => assert.equal(step, getLearningStep(execution, question.reviewStepIds[i]), "Reuse exact original step objects"));
  }
  assert.equal(take.reviewStepIds.join(), "complete-b,dequeue-c");
  assert.equal(after.reviewStepIds.join(), "dequeue-c,skip-e");
  const skip = getLearningStep(execution, "skip-e").canvas;
  assert.equal(skip.state.operation.kind, "skip-discovered");
  assert.equal(skip.state.operation.from, processing.state.current);
  assert.deepEqual(plain(skip.state.queue), plain(processing.state.queue));
}
verifyData(plain(content));

// BFS に依存しない進行管理。誤答の再試行、依存条件、初回正誤と全試行の保持を確認。
const [q1, q2] = content.questions;
let state = createAssessmentState(content);
assert.equal(activeQuestion(content, state).id, q1.id);
assert(!assessmentComplete(content, state));
assert.equal(answerQuestion(content, state, q2.id, none), state, "Question 2 cannot be answered early");
assert.equal(answerQuestion(content, state, q1.id, none), state, "No none option in question 1");
assert.equal(answerQuestion(content, state, q1.id, answer("unknown")), state);
for (const id of ["D", "E"]) state = answerQuestion(content, state, q1.id, answer(id));
assert.equal(activeQuestion(content, state).id, q1.id);
assert.equal(state.records[0].attemptCount, 2);
assert.equal(state.records[0].firstCorrect, false);
const previous = state;
state = answerQuestion(content, state, q1.id, answer("C"));
assert.equal(previous.records[0].attemptCount, 2, "Past records are immutable");
assert.equal(state.records[0].attemptCount, 3);
assert.equal(state.records[0].firstCorrect, false, "Retry success must preserve first failure");
assert.equal(activeQuestion(content, state).id, q1.id, "A correct answer does not advance on its own");
state = advanceAssessment(content, state, q1.id);
assert.equal(activeQuestion(content, state).id, q2.id);
assert.equal(answerQuestion(content, state, q1.id, answer("C")), state, "Stale / double answer cannot spill into next question");
for (const id of q2.nodeIds) {
  state = answerQuestion(content, state, q2.id, answer(id));
  assert.equal(activeQuestion(content, state).id, q2.id);
  assert(!assessmentComplete(content, state));
}
state = answerQuestion(content, state, q2.id, none);
state = advanceAssessment(content, state, q2.id);
assert(assessmentComplete(content, state));
assert.equal(activeQuestion(content, state), null);
assert.equal(state.records[1].firstCorrect, false);
assert.equal(state.records[1].attemptCount, 7);
assert.equal(state.records[1].attempts.map(attempt => attempt.number).join(), "1,2,3,4,5,6,7");
assert.equal(answerQuestion(content, state, q2.id, none), state, "Complete session does not accept more answers");
let firstTry = createAssessmentState(content);
firstTry = answerQuestion(content, firstTry, q1.id, answer("C"));
firstTry = advanceAssessment(content, firstTry, q1.id);
firstTry = answerQuestion(content, firstTry, q2.id, none);
firstTry = advanceAssessment(content, firstTry, q2.id);
assert(assessmentComplete(content, firstTry));
assert(firstTry.records.every(record => record.firstCorrect === true && record.attemptCount === 1));

// 「次の問題へ」で正解せず進める（ソフトゲート）。依存条件のある第2問にも未正解のまま到達でき、全問未正解でも完了する。
let skipped = createAssessmentState(content);
assert.equal(advanceAssessment(content, skipped, q1.id), skipped, "Cannot advance before answering");
skipped = answerQuestion(content, skipped, q1.id, answer("D"));
skipped = advanceAssessment(content, skipped, q1.id);
assert.equal(activeQuestion(content, skipped).id, q2.id, "Skipping question 1 still reaches the linked question 2");
skipped = answerQuestion(content, skipped, q2.id, answer(q2.nodeIds[0]));
skipped = advanceAssessment(content, skipped, q2.id);
assert(assessmentComplete(content, skipped), "An all-wrong run still completes");
assert(skipped.records.every(record => record.firstCorrect === false && !record.solved && record.attemptCount === 1));

// 画面側の契約：誤答後に「次の問題へ／結果を見る」で進める導線を持つ。
const checkPreviewSource = fs.readFileSync(path.join(root, "bfs/check/BfsCheckPreview.tsx"), "utf8");
assert.match(checkPreviewSource, /advanceAssessment\(bfsCheckContent, current, question\.id\)/);
assert.match(checkPreviewSource, /"結果を見る" : "次の問題へ"/);

function rejects(change) { const broken = plain(content); change(broken); assert.throws(() => verifyData(broken)); }
rejects(broken => broken.questions[0].stepId = "missing");
rejects(broken => broken.questions[0].correctAnswer = answer("D"));
rejects(broken => broken.questions[1].requires = null);
rejects(broken => broken.questions[1].requires.questionId = "after-c");
rejects(broken => broken.questions[1].requires.answer = answer("D"));
rejects(broken => broken.questions[1].correctAnswer = answer("E"));
rejects(broken => broken.questions[1].reviewStepIds = ["missing"]);
assert.throws(() => selectReviewContent(execution, ["missing"]));
assert.throws(() => selectReviewContent(execution, ["skip-e", "skip-e"]));
console.log("BFS check verified: exact phase-2 references, shared graph identity, FIFO answer, no new neighbor, linked retry gate, first-attempt records and review identity.");

// 描画の回帰: 回答中だけ状態強調リングを抑え、ノードの状態色と通常再生の描画は保つ。
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { BfsCheckCanvas } = load(path.join(root, "bfs/check/BfsCheckCanvas.tsx"));
const { BfsExecutionCanvas } = load(path.join(root, "bfs/execution/BfsExecutionCanvas.tsx"));
for (const question of content.questions) {
  const canvas = getLearningStep(execution, question.stepId).canvas;
  const snapshot = JSON.stringify(canvas);
  const html = renderToStaticMarkup(React.createElement(BfsCheckCanvas, {
    canvas, questionId: question.id, nodeIds: question.nodeIds, allowNone: question.allowNone, onAnswer() {},
  }));
  assert.equal((html.match(/<circle\b/g) || []).length, question.nodeIds.length, "No extra algorithm highlight ring over an answer node");
  assert.equal((html.match(/<button\b/g) || []).length, question.nodeIds.length + Number(question.allowNone));
  for (const id of question.nodeIds) assert.equal(html.split(`aria-label="${id}を選ぶ"`).length - 1, 1);
  assert.equal(html.includes("どれも入らない"), question.allowNone);
  if (question.allowNone) {
    assert(html.indexOf("どれも入らない") < html.indexOf('aria-label="キュー"'), "Keep the alternative answer next to the graph, above the queue");
    assert.match(html, /data-node-id="C"[\s\S]*?<circle[^>]*fill="#2563eb"/, "Keep the processing node blue");
  }
  assert.equal(JSON.stringify(canvas), snapshot, "Rendering must not mutate the shared snapshot");
  const playback = renderToStaticMarkup(React.createElement(BfsExecutionCanvas, { canvas }));
  assert.equal((playback.match(/<circle\b/g) || []).length, question.nodeIds.length + 1, "Normal playback keeps its focus ring");
  assert.match(playback, /viewBox="0 0 600 450"/, "Normal playback keeps the original viewport");
}
console.log("BFS check UI verified: one answer button per node, no double rings, processing colors, graph-adjacent alternative, immutable snapshots and unchanged playback defaults.");
