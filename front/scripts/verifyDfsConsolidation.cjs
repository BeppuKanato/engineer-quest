const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const ts = require("typescript");
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
    const base = name.startsWith("@/") ? path.resolve(__dirname, "../src", name.slice(2)) : path.resolve(path.dirname(filename), name);
    return load([base + ".ts", base + ".tsx"].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}

const root = path.resolve(__dirname, "../src/features/learning");
const { dfsConsolidationContent: content } = load(root + "/units/dfs/consolidation/consolidation.content.ts");
const { dfsCode, dfsCodeSource } = load(root + "/units/dfs/code-mapping/dfsCode.ts");
const { dfsCodeMappingContent: mapping } = load(root + "/units/dfs/code-mapping/codeMapping.content.ts");
const { searchGraph } = load(root + "/graphs/searchGraph.ts");
const { createAssessmentState, answerQuestion, advanceAssessment, assessmentComplete, diagnoseAssessment } = load(root + "/assessment/assessment.ts");
const { selectReviewContent } = load(root + "/review/reviewContent.ts");
const { ConsolidationGraph } = load(root + "/units/bfs/consolidation/ConsolidationGraph.tsx");
const { ParsonsBoard } = load(root + "/components/assessment/ParsonsBoard.tsx");
const { parsonsMovableSegments } = load(root + "/assessment/parsonsOrderFeedback.ts");
const plain = value => JSON.parse(JSON.stringify(value));

assert.equal(content.stageName, "応用問題");
assert.equal(content.code, dfsCode);
assert.deepEqual(plain(content.questions.map(question => question.kind)), ["node", "choice", "choice", "choice", "parsons"]);
const [q1, q2, q3, q4, q5] = content.questions;
const nodeQuestion = renderToStaticMarkup(createElement(ConsolidationGraph, { ...q1.scene, onSelect: () => {} }));
assert.deepEqual([...nodeQuestion.matchAll(/aria-label="([A-F])を選ぶ"/g)].map(match => match[1]), ["A", "B", "C", "D", "E", "F"]);
assert.equal(q1.scene.graph, searchGraph);
assert.equal(q4.scene.graph, searchGraph);
assert.equal(q3.scene.graph.edges, searchGraph.edges);
assert.deepEqual(plain(q3.scene.graph.nodes.at(-1)), { id: "Z", label: "Z", x: 530, y: 330 });
assert.deepEqual(plain(q2.scene.graph.nodes.map(({ x, y }) => ({ x, y }))),
  plain(searchGraph.nodes.map(({ x, y }) => ({ x, y }))));
assert.deepEqual(plain(q2.scene.graph.edges.map(({ from, to }) => [from, to])),
  [["G", "H"], ["G", "I"], ["H", "J"], ["H", "K"], ["I", "L"]]);

function executionInput(question) {
  const { graph, start } = question.scene;
  const adjacency = Object.fromEntries(graph.nodes.map(({ id }) => [id, []]));
  for (const { from, to } of graph.edges) {
    adjacency[from].push(to);
    adjacency[to].push(from);
  }
  return { adjacency, start };
}

const canonical = Array.from(dfsCode.lines, line => line.id);
assert.deepEqual(plain(q5.correctAnswer.lineIds), canonical);
assert.deepEqual([...q5.lineIds].sort(), [...canonical].sort());
const fixed = ["define-function", "while-stack", "return-order"];
const inits = ["initialize-visited", "initialize-order", "initialize-stack"];
assert.deepEqual(plain(q5.fixedLineIds), fixed);
assert.deepEqual(plain(q5.interchangeableLineGroups), [inits]);
for (const id of fixed) assert.equal(q5.lineIds.indexOf(id), canonical.indexOf(id));
const segments = order => plain(parsonsMovableSegments(order, fixed));
const expectedSegments = segments(canonical);
assert.deepEqual(expectedSegments.map(segment => segment.length), [3, 6]);
assert.deepEqual(segments(q5.lineIds).map(segment => [...segment].sort()), expectedSegments.map(segment => [...segment].sort()));
assert.notDeepEqual(segments(q5.lineIds)[1], expectedSegments[1]);

const variants = inits.flatMap((first, i) => inits.filter((_, j) => i !== j).map(second => {
  const third = inits.find(id => id !== first && id !== second);
  return [canonical[0], first, second, third, ...canonical.slice(4)];
}));
const sourceFor = ids => ids.map(id => dfsCode.lines.find(line => line.id === id).text).join("\n");
const syntax = spawnSync(process.env.PYTHON || "python3", ["-c", [
  "import json, sys",
  "data = json.load(sys.stdin)",
  "def run(source, case):",
  "    scope = {}",
  "    exec(compile(source, 'dfs-reference', 'exec'), scope)",
  "    dfs = scope['dfs_order']",
  "    completed, conditions = {}, []",
  "    def trace(frame, event, arg):",
  "        if frame.f_code is not dfs.__code__: return",
  "        if event == 'line':",
  "            loc = frame.f_locals",
  "            if frame.f_lineno == data['while_line'] and 'node' in loc:",
  "                completed[loc['node']] = list(loc['stack'])",
  "            if frame.f_lineno == data['if_line']:",
  "                conditions.append([loc['node'], loc['neighbor'], loc['neighbor'] in loc['visited']])",
  "        return trace",
  "    sys.settrace(trace)",
  "    try: order = dfs(case['adjacency'], case['start'])",
  "    finally: sys.settrace(None)",
  "    return dict(order=order, completed=completed, conditions=conditions)",
  "baseline = [run(data['code'], case) for case in data['cases']]",
  "for source in data['variants']:",
  "    assert [run(source, case) for case in data['cases']] == baseline",
  "print(json.dumps(baseline))",
].join("\n")], {
  input: JSON.stringify({ code: dfsCodeSource, cases: [q1, q2, q3, q4].map(executionInput), variants: variants.map(sourceFor),
    while_line: canonical.indexOf("while-stack") + 1, if_line: canonical.indexOf("if-unvisited") + 1 }),
  encoding: "utf8",
});
assert.ifError(syntax.error);
assert.equal(syntax.status, 0, syntax.stderr);
const [f, tree, isolated, revisit] = JSON.parse(syntax.stdout);
assert.deepEqual(f.order, ["F", "D", "B", "A", "C", "E"]);
assert.equal(q1.correctAnswer.nodeId, f.order.at(-1));
assert.deepEqual(tree.order, ["G", "H", "J", "K", "I", "L"]);
assert.deepEqual(tree.completed.J, ["I", "K"]);
assert.deepEqual(tree.completed.K, ["I"]);
assert.equal(q2.choices.find(choice => choice.id === q2.correctAnswer.choiceId).text, tree.completed.K[0] + " のみ");
assert(!isolated.order.includes("Z"));
assert.equal(q3.correctAnswer.choiceId, "absent");
assert.deepEqual(revisit.conditions.find(([node, neighbor]) => node === "B" && neighbor === "A"), ["B", "A", true]);
assert.equal(revisit.order.filter(node => node === "A").length, 1);
assert.equal(q4.correctAnswer.choiceId, "skip");

for (const question of content.questions) {
  const review = selectReviewContent(mapping, question.reviewStepIds);
  assert(review.steps.some(frame => frame.id === question.stepId));
  review.steps.forEach((frame, index) => assert.equal(frame, mapping.steps.find(step => step.id === question.reviewStepIds[index])));
}
const board = renderToStaticMarkup(createElement(ParsonsBoard, {
  question: q5, code: dfsCode,
  orderFeedback: { solutionLineIds: canonical, interchangeableLineGroups: [inits], active: true, submittedLineIds: q5.lineIds },
}));
assert.deepEqual([...board.matchAll(/data-parsons-line-id="([^"]+)"/g)].map(match => match[1]), plain(q5.lineIds));
const fixedRows = [...board.matchAll(/<div[^>]*data-parsons-fixed="true"[^>]*>/g)].map(match => match[0]);
assert.deepEqual(fixedRows.map(row => /data-parsons-line-id="([^"]+)"/.exec(row)[1]), fixed);
assert(fixedRows.every(row => !row.includes("data-parsons-keep")));
assert.equal((board.match(/aria-label="コード行の並び替え"/g) || []).length, 2);

let state = createAssessmentState(content);
assert.equal(advanceAssessment(content, state, q1.id), state);
for (const question of content.questions.slice(0, -1)) {
  const first = question === q1 ? { kind: "node", nodeId: "F" } : question.correctAnswer;
  state = answerQuestion(content, state, question.id, first);
  if (question === q1) state = answerQuestion(content, state, q1.id, q1.correctAnswer);
  state = advanceAssessment(content, state, question.id);
}
for (const lineIds of variants) {
  const result = answerQuestion(content, state, q5.id, { kind: "order", lineIds });
  assert.equal(result.records.at(-1).solved, true);
}
const acrossWhile = [...canonical];
[acrossWhile[3], acrossWhile[5]] = [acrossWhile[5], acrossWhile[3]];
assert.equal(answerQuestion(content, state, q5.id, { kind: "order", lineIds: acrossWhile }).records.at(-1).solved, false);
state = answerQuestion(content, state, q5.id, { kind: "order", lineIds: q5.lineIds });
assert.equal(state.records.at(-1).solved, false);
state = advanceAssessment(content, state, q5.id);
assert(assessmentComplete(content, state));
const diagnosis = diagnoseAssessment(content, state);
assert.equal(diagnosis.correct, 3);
assert.equal(diagnosis.total, 5);
assert.deepEqual(plain(diagnosis.tags.map(tag => tag.passed)), [false, true, true, true, false]);

console.log("DFS consolidation verified: independent Python transfer and boundary cases, canonical fixed-row Parsons with all six initialization orders, phase-4 reviews, and first-attempt diagnosis.");
