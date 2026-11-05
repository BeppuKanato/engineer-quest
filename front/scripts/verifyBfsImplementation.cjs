const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const ts = require("typescript");
const cache = new Map();
function load(filename) {
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const { bfsImplementationContent: content } = load(`${root}/bfs/implementation/implementation.content.ts`);
const { bfsCode } = load(`${root}/bfs/code-mapping/bfsCode.ts`);
const { bfsConsolidationContent } = load(`${root}/bfs/consolidation/consolidation.content.ts`);
const { ImplementationResults } = load(`${root}/bfs/implementation/ImplementationResults.tsx`);
const { ParsonsBoard } = load(`${root}/bfs/consolidation/ParsonsBoard.tsx`);
const { recordHintUsage, hintMessage, allTestsPassed, runImplementationTests, codeDiff } = load(`${root}/bfs/implementation/implementation.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const plain = value => JSON.parse(JSON.stringify(value));
assert.equal(content.id, "bfs-implementation"); assert.equal(content.phase, 7); assert.equal(content.version, 1);
assert.match(content.template, /^from collections import deque\ndef bfs_distances\(graph, start\):\n/u);
assert.match(content.template, /\n +pass$/u);
assert.deepEqual(plain(content.chips), ["deque", "queue", "distances", "graph", "start", "node", "neighbor", "popleft()", "append()", "while", "for", "if", "not in", "return"]);
assert.equal(new Set(content.chips).size, 14);
assert.equal(content.hints.referenceCode, bfsCode.lines.map(line => line.text).join("\n"));
assert.equal(bfsCode.id, "bfs-distances-deque"); assert.equal(bfsCode.version, 1);
assert.equal(content.hints.parsonsQuestion, bfsConsolidationContent.questions.find(question => question.kind === "parsons"));
assert.deepEqual(plain(content.tests.map(test => test.id)), ["D1", "D2", "J1", "J2", "J3"]);
assert.deepEqual(plain(content.tests.map(test => test.visibility)), ["display", "display", "judgement", "judgement", "judgement"]);
// 教材の期待値・既存BFSヘルパーを使わず、隣接リストから独立に再計算。
for (const test of content.tests) {
  assert.equal(test.functionName, "bfs_distances"); assert.equal(test.args.length, 2);
  const [graph, start] = plain(test.args);
  const queue = [start], distances = { [start]: 0 };
  for (let index = 0; index < queue.length; index++) {
    const node = queue[index];
    for (const neighbor of graph[node] ?? []) if (!Object.hasOwn(distances, neighbor)) {
      distances[neighbor] = distances[node] + 1; queue.push(neighbor);
    }
  }
  assert.deepEqual(distances, plain(test.expected), test.id);
}
assert.deepEqual(plain(content.tests[0].args), [{ A: ["B", "C"], B: ["A", "D", "E"], C: ["A", "E"], D: ["B", "F"], E: ["B", "C", "F"], F: ["D", "E"] }, "A"]);
assert.deepEqual(plain(content.tests[1].args), [{ G: ["H", "I"], H: ["G", "J"], I: ["G", "J", "K"], J: ["H", "I", "L"], K: ["I", "L"], L: ["J", "K"] }, "G"]);
assert.deepEqual(plain(content.tests[2].args), [{ ...plain(content.tests[0].args[0]), Z: [] }, "A"]);
assert.deepEqual(plain(content.tests[3].args), [{ A: [] }, "A"]);
assert.deepEqual(plain(content.tests[4].args), [{ A: ["B"] }, "A"]);
const python = spawnSync("python3", ["-c", `import ast,json,sys\ndata=json.load(sys.stdin)\nast.parse(data['template'])\nns={}\nexec(data['code'],ns)\nfor test in data['tests']:\n assert ns[test['functionName']](*test['args']) == test['expected'], test['id']\n`], {
  input: JSON.stringify({ template: content.template, code: content.hints.referenceCode, tests: content.tests }), encoding: "utf8",
});
assert.equal(python.status, 0, python.stderr);
let usage = [0, 0, 0];
assert.equal(recordHintUsage(usage, 2), usage); assert.equal(recordHintUsage(usage, 3), usage);
usage = recordHintUsage(usage, 1); assert.deepEqual(plain(usage), [1, 0, 0]);
assert.equal(recordHintUsage(usage, 3), usage);
usage = recordHintUsage(recordHintUsage(recordHintUsage(usage, 2), 3), 3); assert.deepEqual(plain(usage), [1, 1, 2]);
assert.equal(hintMessage([]), content.hints.messages.unexecuted);
assert.equal(hintMessage([{ id: "D1", passed: false, error: "syntax" }]), content.hints.messages.syntax);
assert.equal(hintMessage([{ id: "J1", passed: false, error: "runtime" }]), content.hints.messages.runtime);
assert.equal(hintMessage([{ id: "D1", passed: false }]), content.hints.messages.mismatch);
const passed = content.tests.map(test => ({ id: test.id, passed: true }));
assert(allTestsPassed(content.tests, passed)); assert(!allTestsPassed(content.tests, passed.slice(1)));
assert(!allTestsPassed(content.tests, passed.map(test => test.id === "J3" ? { ...test, passed: false } : test)));
assert(!allTestsPassed([], []));
assert(codeDiff(content.hints.referenceCode).every(row => !row.changed && row.current === row.reference));
const rows = codeDiff(content.template);
assert(rows.some(row => row.changed));
assert.equal(rows.filter(row => row.current !== undefined).map(row => row.current).join("\n"), content.template);
assert.equal(rows.filter(row => row.reference !== undefined).map(row => row.reference).join("\n"), content.hints.referenceCode);
const hiddenOutcomes = content.tests.map(test => ({ id: test.id, passed: false, actual: "HIDDEN_OUTPUT_SENTINEL" }));
const html = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: hiddenOutcomes }));
assert.equal((html.match(/HIDDEN_OUTPUT_SENTINEL/g) || []).length, 2, "Only two display cases expose actual output");
for (const id of ["J1", "J2", "J3"]) {
  const item = html.match(new RegExp(`data-test-id="${id}"[\\s\\S]*?</li>`))[0];
  assert(!/入力|期待値|実際の出力|HIDDEN_OUTPUT_SENTINEL/u.test(item));
}
const review = renderToStaticMarkup(createElement(ParsonsBoard, { question: content.hints.parsonsQuestion, code: bfsCode }));
assert.equal((review.match(/data-parsons-line-id=/g) || []).length, 11);
assert(!review.includes("この順序で回答する"), "Hint Parsons has no scoring action");
(async () => {
  const calls = [], progress = [];
  runner.runCourseMissionTests = async (code, tests) => {
    assert.equal(code, "learner code"); assert.equal(tests.length, 1); calls.push(tests[0].id);
    const test = tests[0];
    if (test.id === "D2") throw new Error("SyntaxError: HIDDEN_EXCEPTION");
    if (test.id === "J1") throw new Error("KeyError: HIDDEN_EXCEPTION");
    return { results: [{ ...test, passed: true, actual: "HIDDEN_VALUE" }], stdout: "HIDDEN_STDOUT", stderr: "HIDDEN_STDERR" };
  };
  const outcomes = await runImplementationTests("learner code", content.tests, next => progress.push(next));
  assert.deepEqual(calls, ["D1", "D2", "J1", "J2", "J3"], "Continue after case errors");
  assert.deepEqual(progress.map(next => next.length), [1, 2, 3, 4, 5]);
  assert.equal(outcomes[1].error, "syntax"); assert.equal(outcomes[2].error, "runtime");
  assert(!JSON.stringify(outcomes.slice(2)).includes("HIDDEN"), "Judgement values never enter UI state");
  assert(!JSON.stringify(outcomes).includes("HIDDEN_EXCEPTION"));
  assert.equal(progress[0].length, 1, "Earlier progress snapshots stay unchanged");
  let active = true;
  const cancelled = await runImplementationTests("learner code", content.tests, () => { active = false; }, () => active);
  assert.equal(cancelled.length, 1, "Unmounting stops subsequent case requests");
  console.log("BFS implementation: independent BFS on five cases, canonical reference, allowed tokens, staged hints, line diff, hidden-case redaction, all-pass gate and runner progress/error/cancellation checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
