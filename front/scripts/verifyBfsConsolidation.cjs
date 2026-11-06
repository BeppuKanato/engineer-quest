const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const cache = new Map();
function load(filename) {
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const { bfsConsolidationContent: content, validateConsolidation } = load(`${root}/bfs/consolidation/consolidation.content.ts`);
const { bfsGraph } = load(`${root}/bfs/bfsGraph.ts`);
const { bfsCode } = load(`${root}/bfs/code-mapping/bfsCode.ts`);
const { bfsCodeMappingContent: mapping } = load(`${root}/bfs/code-mapping/codeMapping.content.ts`);
const { createAssessmentState, activeQuestion, answerQuestion, advanceAssessment, assessmentComplete, diagnoseAssessment, sameAnswer } = load(`${root}/assessment/assessment.ts`);
const { selectReviewContent } = load(`${root}/review/reviewContent.ts`);
const { ConsolidationGraph } = load(`${root}/bfs/consolidation/ConsolidationGraph.tsx`);
const { ParsonsBoard } = load(`${root}/bfs/consolidation/ParsonsBoard.tsx`);
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const plain = value => JSON.parse(JSON.stringify(value));
const [q1, q2, q3, q4, q5] = content.questions;
validateConsolidation(content);
assert.equal(content.phase, 6);
assert.equal(content.questions.length, 5);
assert.equal(content.code, bfsCode);
assert.equal(bfsCode.id, "bfs-distances-deque"); assert.equal(bfsCode.version, 1);
assert.deepEqual(plain(content.questions.map(question => question.tags[0])), ["処理順序の追跡", "キューの状態の追跡", "たどり着けない場所の扱い", "距離が決まった場所の扱い", "コード全体の流れ"]);
assert.equal(q1.scene.graph, bfsGraph); assert.equal(q4.scene.graph, bfsGraph);
assert.equal(q3.scene.graph.edges, bfsGraph.edges);
assert.deepEqual(plain(q3.scene.graph.nodes.slice(0, 6)), plain(bfsGraph.nodes));
assert.deepEqual(plain(q3.scene.graph.nodes.at(-1)), { id: "Z", label: "Z", x: 530, y: 330 });
assert.deepEqual(plain(q2.scene.graph.nodes.map(({ x, y }) => ({ x, y }))), plain(bfsGraph.nodes.map(({ x, y }) => ({ x, y }))));
assert.equal(q2.scene.graph.nodes.map(node => node.id).join(), "G,H,I,J,K,L");
assert.deepEqual(plain(q2.scene.graph.edges.map(edge => `${edge.from}-${edge.to}`)), ["G-H", "G-I", "H-J", "I-J", "I-K", "J-L", "K-L"]);

// 教材の回答・snapshot helperを使わず、無向辺の順からBFSを独立に実行する。
function bfs(graph, start) {
  const queue = [start], distances = { [start]: 0 }, order = [], enqueued = [start], events = [], checks = [];
  while (queue.length) {
    const node = queue.shift(); order.push(node);
    events.push({ kind: "dequeue", node, queue: [...queue] });
    for (const edge of graph.edges) {
      const neighbor = edge.from === node ? edge.to : edge.to === node ? edge.from : null;
      if (neighbor === null) continue;
      const before = distances[neighbor];
      if (!(neighbor in distances)) {
        distances[neighbor] = distances[node] + 1; queue.push(neighbor); enqueued.push(neighbor);
      }
      checks.push({ node, neighbor, before, after: distances[neighbor] });
    }
    events.push({ kind: "complete", node, queue: [...queue] });
  }
  return { distances, order, enqueued, events, checks };
}
const f = bfs(q1.scene.graph, q1.scene.start);
assert.deepEqual(f.distances, { F: 0, D: 1, E: 1, B: 2, C: 2, A: 3 });
assert.deepEqual(f.order, ["F", "D", "E", "B", "C", "A"]);
assert.equal(q1.correctAnswer.nodeId, f.order.at(-1));
const transfer = bfs(q2.scene.graph, q2.scene.start);
assert.deepEqual(transfer.distances, { G: 0, H: 1, I: 1, J: 2, K: 2, L: 3 });
assert.deepEqual(transfer.order, ["G", "H", "I", "J", "K", "L"]);
assert.deepEqual(transfer.events.find(event => event.kind === "dequeue" && event.node === "J").queue, ["K"], "The dequeue instant is not the completion instant");
const afterJ = transfer.events.find(event => event.kind === "complete" && event.node === "J").queue;
assert.deepEqual(afterJ, ["K", "L"]);
assert.equal(q2.prompt, "Jの隣を調べ終えた直後、キューに入っているのはどれ？", "User-approved correction of the timing");
assert.equal(q2.choices.find(choice => choice.id === q2.correctAnswer.choiceId).text, afterJ.join(" → "));
assert.deepEqual(plain(q2.choices.map(choice => choice.text)), ["K → L", "L → K", "K のみ"]);
for (const question of [q3, q4]) {
  const run = bfs(question.scene.graph, question.scene.start);
  assert.deepEqual(run.distances, { A: 0, B: 1, C: 1, D: 2, E: 2, F: 3 });
  assert.deepEqual(run.order, ["A", "B", "C", "D", "E", "F"]);
  assert(!Object.hasOwn(run.distances, "Z"));
  assert.equal(run.enqueued.filter(id => id === "A").length, 1);
  const backToA = run.checks.find(check => check.node === "B" && check.neighbor === "A");
  assert.equal(backToA.before, 0); assert.equal(backToA.after, 0);
}
assert.equal(q3.correctAnswer.choiceId, "absent"); assert.equal(q4.correctAnswer.choiceId, "unchanged");
const canonicalIds = plain(bfsCode.lines.map(line => line.id));
assert.deepEqual([...q5.lineIds].sort(), [...canonicalIds].sort());
assert.notDeepEqual(plain(q5.lineIds), canonicalIds);
assert.deepEqual(plain(q5.lineIds), ["enqueue-neighbor", "initialize-distances", "while-queue", "return-distances", "dequeue-node", "import-deque", "assign-distance", "define-function", "if-undiscovered", "initialize-queue", "for-neighbor"]);
assert.deepEqual(plain(q5.correctAnswer.lineIds), canonicalIds);
assert.deepEqual(plain(q5.interchangeableLineGroups), [["initialize-distances", "initialize-queue"]]);
for (const question of content.questions) {
  const review = selectReviewContent(mapping, question.reviewStepIds);
  review.steps.forEach((step, index) => assert.equal(step, mapping.steps.find(frame => frame.id === question.reviewStepIds[index])));
  assert(question.instruction.trim()); assert(question.correctFeedback.trim()); assert(question.incorrectFeedback.trim());
  assert(!/完璧|完全に理解|マスター/u.test(question.correctFeedback));
  if (question.kind !== "parsons") {
    const html = renderToStaticMarkup(createElement(ConsolidationGraph, { ...question.scene, onSelect: question.kind === "node" ? () => {} : undefined }));
    assert.match(html, /viewBox="0 0 600 450"/); assert.match(html, /preserveAspectRatio="xMidYMid meet"/);
    assert.equal((html.match(/data-node-id=/g) || []).length, question.scene.graph.nodes.length);
    assert.equal((html.match(/data-edge-id=/g) || []).length, 7);
    assert.equal((html.match(/r="30" stroke-width="2"/g) || []).length, question.scene.graph.nodes.length);
  }
}
const parsonsHtml = renderToStaticMarkup(createElement(ParsonsBoard, { question: q5, code: bfsCode, onAnswer: () => {} }));
assert.deepEqual([...parsonsHtml.matchAll(/data-parsons-line-id="([^"]+)"/g)].map(match => match[1]), plain(q5.lineIds));
for (const line of bfsCode.lines) assert(parsonsHtml.includes(line.text), "Preserve original indentation and every line");

const wrong = question => question.kind === "node" ? { kind: "node", nodeId: "B" } : question.kind === "choice" ?
  { kind: "choice", choiceId: question.choices.find(choice => choice.id !== question.correctAnswer.choiceId).id } : { kind: "order", lineIds: [...question.lineIds] };
function complete(mask, retry) {
  let state = createAssessmentState(content);
  assert.throws(() => diagnoseAssessment(content, state), /incomplete/);
  for (const [index, question] of content.questions.entries()) {
    assert.equal(activeQuestion(content, state), question);
    assert.equal(advanceAssessment(content, state, question.id), state, "Do not skip unanswered questions");
    assert.equal(answerQuestion(content, state, question.id, { kind: "choice", choiceId: "missing" }), state);
    const before = state;
    state = answerQuestion(content, state, question.id, mask[index] ? question.correctAnswer : wrong(question));
    assert.equal(before.records[index].attemptCount, 0, "Do not mutate prior state");
    assert.equal(activeQuestion(content, state), question, "Stay for optional retry and feedback");
    if (retry) state = answerQuestion(content, state, question.id, question.correctAnswer);
    assert.equal(state.records[index].firstCorrect, mask[index]);
    state = advanceAssessment(content, state, question.id);
    assert.equal(advanceAssessment(content, state, question.id), state, "Stale next events cannot skip another question");
    assert.equal(answerQuestion(content, state, question.id, question.correctAnswer), state);
  }
  assert(assessmentComplete(content, state)); assert.equal(activeQuestion(content, state), null);
  const result = diagnoseAssessment(content, state);
  assert.equal(result.correct, mask.filter(Boolean).length);
  assert.deepEqual(plain(result.tags.map(tag => tag.passed)), mask);
  return state;
}
const failed = complete([false, false, false, false, false], false);
assert(failed.records.every(record => !record.solved), "0/5 can finish without correct answers");
const retried = complete([false, false, false, false, false], true);
assert(retried.records.every(record => record.solved && record.firstCorrect === false && record.attemptCount === 2));
complete([true, false, true, false, false], true);
complete([true, true, true, true, true], false);
let state = createAssessmentState(content);
for (const question of content.questions.slice(0, 4)) state = advanceAssessment(content, answerQuestion(content, state, question.id, question.correctAnswer), question.id);
assert.equal(answerQuestion(content, state, q5.id, { kind: "order", lineIds: canonicalIds.slice(1) }), state);
assert.equal(answerQuestion(content, state, q5.id, { kind: "order", lineIds: canonicalIds.map(() => canonicalIds[0]) }), state);
const mutable = [...canonicalIds];
const answered = answerQuestion(content, state, q5.id, { kind: "order", lineIds: mutable });
mutable.reverse();
assert.deepEqual(plain(answered.records[4].attempts[0].answer.lineIds), canonicalIds, "Clone submitted order arrays");
assert(sameAnswer(q5.correctAnswer, answered.records[4].attempts[0].answer));
assert(!sameAnswer(q5.correctAnswer, wrong(q5)));
const swap = (ids, first, second) => {
  const result = [...ids], a = result.indexOf(first), b = result.indexOf(second);
  [result[a], result[b]] = [result[b], result[a]];
  return result;
};
const swappedInitializers = swap(canonicalIds, "initialize-distances", "initialize-queue");
const swappedRecord = answerQuestion(content, state, q5.id, { kind: "order", lineIds: swappedInitializers }).records[4];
assert.equal(swappedRecord.firstCorrect, true, "Independent initializers may be swapped");
assert.deepEqual(plain(swappedRecord.attempts[0].answer.lineIds), swappedInitializers, "Keep the actual submitted order in the attempt");
assert.equal(answerQuestion(content, state, q5.id, { kind: "order", lineIds: swap(canonicalIds, "assign-distance", "enqueue-neighbor") }).records[4].firstCorrect,
  false, "Distance must be assigned before enqueueing");
assert.equal(answerQuestion(content, state, q5.id, { kind: "order", lineIds: swap(swappedInitializers, "assign-distance", "enqueue-neighbor") }).records[4].firstCorrect, false);
for (let index = 0; index < canonicalIds.length - 1; index++) {
  const first = canonicalIds[index], second = canonicalIds[index + 1];
  assert.equal(answerQuestion(content, state, q5.id, { kind: "order", lineIds: swap(canonicalIds, first, second) }).records[4].firstCorrect,
    first === "initialize-distances" && second === "initialize-queue", `Only the initializer pair may be swapped: ${first}/${second}`);
}
const strictContent = { ...content, questions: content.questions.map(question => question.kind === "parsons" ? { ...question, interchangeableLineGroups: undefined } : question) };
assert.equal(answerQuestion(strictContent, state, q5.id, { kind: "order", lineIds: swappedInitializers }).records[4].firstCorrect, false, "Missing groups retain exact comparison");
function rejects(change) { const broken = { ...content, questions: plain(content.questions) }; change(broken); assert.throws(() => validateConsolidation(broken)); }
rejects(broken => broken.questions[4].lineIds.pop());
rejects(broken => broken.questions[4].lineIds[1] = broken.questions[4].lineIds[0]);
rejects(broken => broken.questions[4].correctAnswer.lineIds.reverse());
rejects(broken => broken.questions[1].choices[1].text = broken.questions[1].choices[0].text);
rejects(broken => broken.questions[0].scene.graph.nodes[0].id = "F");
rejects(broken => broken.questions[0].scene.start = "missing");
rejects(broken => broken.questions[2].scene.graph.edges.push({ id: "bad", from: "Z", to: "missing" }));
rejects(broken => broken.questions[0].reviewStepIds = ["missing"]);
rejects(broken => broken.questions[0].tags = []);
rejects(broken => broken.questions[4].interchangeableLineGroups = [["missing", "initialize-queue"]]);
rejects(broken => broken.questions[4].interchangeableLineGroups = [["initialize-queue", "initialize-queue"]]);
rejects(broken => broken.questions[4].interchangeableLineGroups = [["initialize-distances", "while-queue"]]);
rejects(broken => broken.questions[4].interchangeableLineGroups.push(["initialize-distances", "initialize-queue"]));
console.log("BFS consolidation: independent BFS on all four graphs, corrected J timing, 11-line Parsons with interchangeable initializers only, shared rendering/review, 0/5 completion and immutable first-attempt diagnosis passed.");

// ボタンの優先順位と近さの契約（#148）: 主な操作は contained の主ボタン、図の高さは上限を設けて回答部を図の直下に寄せる。
const previewSource = fs.readFileSync(path.resolve(__dirname, "../src/features/learning/bfs/consolidation/BfsConsolidationPreview.tsx"), "utf8");
const parsonsSource = fs.readFileSync(path.resolve(__dirname, "../src/features/learning/bfs/consolidation/ParsonsBoard.tsx"), "utf8");
assert.match(previewSource, /height: "min\(54dvh, 600px\)"/);
assert.match(previewSource, /variant="contained" onClick=\{\(\) => setSession\(current => advanceAssessment/);
assert.match(parsonsSource, /variant="contained" onClick=\{\(\) => onAnswer/);
console.log("BFS consolidation: primary-action buttons and graph-height cap contract passed.");
