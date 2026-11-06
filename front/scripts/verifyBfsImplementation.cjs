const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const ts = require("typescript");
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
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
const { recordHintUsage, resultKinds, classifyExecutionError, runningMessage, distanceEntries, allTestsPassed, runImplementationTests } = load(`${root}/bfs/implementation/implementation.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const plain = value => JSON.parse(JSON.stringify(value));
assert.equal(content.id, "bfs-implementation"); assert.equal(content.phase, 7); assert.equal(content.version, 1);
assert.match(content.template, /^from collections import deque\ndef bfs_distances\(graph, start\):\n/u);
assert.match(content.template, /\n +pass$/u);
assert.deepEqual(plain(content.hints.tokens), ["deque", "queue", "distances", "graph", "start", "node", "neighbor", "popleft()", "append()", "while", "for", "if", "not in", "return"]);
assert.equal(new Set(content.hints.tokens).size, 14);
const referenceCode = bfsCode.lines.map(line => line.text).join("\n");
assert.deepEqual(plain(content.hints.skeletonLineIds), ["while-queue", "for-neighbor", "if-undiscovered"]);
content.hints.skeletonLines.forEach((line, index) => assert.equal(line, bfsCode.lines.find(line => line.id === content.hints.skeletonLineIds[index])));
assert.equal(content.hints.labels.length, 4);
assert.equal(content.hints.flow.length, 4);
for (const file of fs.readdirSync(`${root}/bfs/implementation`).filter(file => /\.tsx?$/u.test(file))) {
  assert(!/codeDiff|diffLines|from ["']diff["']|diffTitle|referenceCode/u.test(fs.readFileSync(`${root}/bfs/implementation/${file}`, "utf8")), "No diff hint dependency remains in the feature");
}
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
const python = spawnSync(process.env.PYTHON || "python3", ["-c", `import ast,json,sys\ndata=json.load(sys.stdin)\nast.parse(data['template'])\nns={}\nexec(data['code'],ns)\nfor test in data['tests']:\n assert ns[test['functionName']](*test['args']) == test['expected'], test['id']\n`], {
  input: JSON.stringify({ template: content.template, code: referenceCode, tests: content.tests }), encoding: "utf8",
});
assert.equal(python.status, 0, python.stderr);
let usage = [0, 0, 0, 0];
for (const level of [2, 3, 4]) assert.equal(recordHintUsage(usage, level), usage);
for (const level of [1, 2, 3, 4]) {
  usage = recordHintUsage(usage, level);
  assert.equal(usage[level - 1], 1);
  if (level < 3) assert.equal(recordHintUsage(usage, 4), usage);
}
usage = recordHintUsage(usage, 4); assert.deepEqual(plain(usage), [1, 1, 1, 2]);
assert.deepEqual(plain(resultKinds([])), []);
assert.deepEqual(plain(resultKinds([{ id: "D1", passed: true }])), []);
for (const kind of ["syntax", "runtime", "timeout"]) assert.deepEqual(plain(resultKinds([{ id: "D1", passed: false, error: kind }])), [kind]);
assert.deepEqual(plain(resultKinds([{ id: "D1", passed: false }])), ["mismatch"]);
const timeoutMessage = "Pythonの実行がタイムアウトしました。処理を見直してください。";
assert(fs.readFileSync(path.resolve(root, "../../lib/pyodideRunner.ts"), "utf8").includes(timeoutMessage), "Match the runner deadline message exactly");
assert.equal(classifyExecutionError(new Error(timeoutMessage)), "timeout");
assert.equal(classifyExecutionError(new Error("SyntaxError: bad syntax")), "syntax");
assert.equal(classifyExecutionError(new Error("IndentationError: bad indentation")), "syntax");
assert.equal(classifyExecutionError(new Error("ValueError: " + timeoutMessage)), "runtime", "Do not mistake a Python exception mentioning a timeout for the runner deadline");
assert.deepEqual(plain(resultKinds([{ id: "D1", passed: false }, { id: "D2", passed: false, error: "timeout" }])), ["timeout", "mismatch"]);
for (let done = 0; done < 5; done++) assert.equal(runningMessage(done, 5), `テストを実行中です（${done + 1}/5件目）`);
const entries = distanceEntries({ A: 0, B: 1, C: 1 }, { A: 0, B: 99, Z: 3 });
assert.deepEqual(plain(entries.map(entry => [entry.node, entry.state])), [["A", "same"], ["B", "different"], ["C", "missing"], ["Z", "extra"]]);
const { searchGraph } = load(`${root}/graphs/searchGraph.ts`);
const { transferGraph } = load(`${root}/bfs/consolidation/consolidation.graphs.ts`);
assert.equal(content.displayScenes[0].graph, searchGraph); assert.equal(content.displayScenes[1].graph, transferGraph);
for (const scene of content.displayScenes) {
  const test = content.tests.find(test => test.id === scene.testId), graph = scene.graph;
  assert.equal(scene.start, test.args[1]);
  for (const node of graph.nodes) {
    const neighbors = graph.edges.flatMap(edge => edge.from === node.id ? [edge.to] : edge.to === node.id ? [edge.from] : []);
    assert.deepEqual(plain(neighbors), plain(test.args[0][node.id]));
  }
}
const passed = content.tests.map(test => ({ id: test.id, passed: true }));
assert(allTestsPassed(content.tests, passed)); assert(!allTestsPassed(content.tests, passed.slice(1)));
assert(!allTestsPassed(content.tests, passed.map(test => test.id === "J3" ? { ...test, passed: false } : test)));
assert(!allTestsPassed([], []));
const hiddenOutcomes = content.tests.map(test => ({ id: test.id, passed: false, actual: { PRIVATE_OUTPUT_SENTINEL: 9 } }));
const html = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: hiddenOutcomes }));
assert.equal((html.match(/PRIVATE_OUTPUT_SENTINEL/g) || []).length, 2, "Only two display cases expose actual output");
for (const id of ["J1", "J2", "J3"]) {
  const item = html.match(new RegExp(`data-test-id="${id}"[\\s\\S]*?</li>`))[0];
  assert(!/入力|期待値|実際の出力|PRIVATE_OUTPUT_SENTINEL/u.test(item));
}
const { ImplementationHints } = load(`${root}/bfs/implementation/ImplementationHints.tsx`);
// Dialog portals are tested in the browser; verify the shared board has no scoring action here.
assert.equal(typeof ImplementationHints, "function");
const unchangedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [] }));
assert(!unchangedHtml.includes("data-error-kind"));
assert(unchangedHtml.includes(content.display.statuses.unexecuted.icon));
assert.equal((unchangedHtml.match(/<svg/g) || []).length, 2);
assert.equal((unchangedHtml.match(/data-node-id=/g) || []).length, 12);
for (const test of content.tests) assert(!unchangedHtml.includes(`>${test.id} `), "Internal IDs stay out of visible headings");
const mismatchedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [{ id: "D1", passed: false, actual: { A: 9, Z: 1 } }] }));
for (const state of ["different", "missing", "extra"]) assert(mismatchedHtml.includes(`data-distance-state="${state}"`));
assert(mismatchedHtml.includes(content.display.statuses.failed.icon));
assert(mismatchedHtml.includes("期待と異なる")); assert(mismatchedHtml.includes("項目なし")); assert(mismatchedHtml.includes("余分な項目"));
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
    if (test.id === "J2") throw new Error(timeoutMessage);
    return { results: [{ ...test, passed: true, actual: "HIDDEN_VALUE" }], stdout: "HIDDEN_STDOUT", stderr: "HIDDEN_STDERR" };
  };
  const outcomes = await runImplementationTests("learner code", content.tests, next => progress.push(next));
  assert.deepEqual(calls, ["D1", "D2", "J1", "J2", "J3"], "Continue after case errors");
  assert.deepEqual(progress.map(next => next.length), [1, 2, 3, 4, 5]);
  assert.equal(outcomes[1].error, "syntax"); assert.equal(outcomes[2].error, "runtime"); assert.equal(outcomes[3].error, "timeout");
  assert(!JSON.stringify(outcomes.slice(2)).includes("HIDDEN"), "Judgement values never enter UI state");
  assert(!JSON.stringify(outcomes).includes("HIDDEN_EXCEPTION"));
  assert.equal(progress[0].length, 1, "Earlier progress snapshots stay unchanged");
  let active = true;
  const cancelled = await runImplementationTests("learner code", content.tests, () => { active = false; }, () => active);
  assert.equal(cancelled.length, 1, "Unmounting stops subsequent case requests");
  // 画面契約（#149）: エディタはライトテーマ＋枠と見出しで分離し、ダーク基調を持たない。ヒント2はフロー表示、結果の状態はアニメーションで現れる。
  const impl = (file) => fs.readFileSync(`${root}/bfs/implementation/${file}`, "utf8");
  const previewSource = impl("BfsImplementationPreview.tsx");
  assert.match(previewSource, /theme="vs"/);
  assert(!previewSource.includes("vs-dark"), "editor is light themed");
  assert.match(previewSource, /border: `2px solid \$\{colors\.focus\}`/, "editor area is framed in the focus colour");
  assert(!/Implementation(Results|Hints) dark/.test(previewSource), "no dark variants remain");
  assert(!impl("editor.tokens.ts").includes("#1e1e1e"), "editor tokens are light");
  const hintsSource = impl("ImplementationHints.tsx");
  assert.match(hintsSource, /キューが空になるまでくり返し/, "hint 2 shows the loop as a flow");
  assert.match(hintsSource, /min\(92vw, 760px\)/, "hint dialog width is capped for readability");
  const resultsSource = impl("ImplementationResults.tsx");
  assert.match(resultsSource, /data-test-status/, "test status changes animate in");
  assert.match(resultsSource, /component=\{motion\.span\} key=\{statusKey\}/, "a status change mounts its own short animation");
  assert.match(resultsSource, /initial=\{reducedMotion \? false/, "reduced motion skips the initial animation state");
  assert.match(resultsSource, /duration: reducedMotion \? 0 : 0\.3/, "reduced motion removes the transition");
  const traceText = fs.readFileSync(`${root}/bfs/trace/trace.content.ts`, "utf8");
  assert.match(traceText, /button: "グラフで動きを見る"/, "trace button says what it does");
  console.log("BFS implementation: independent BFS on five cases, canonical skeleton, hint-1 tokens, four staged hints, mini graphs and distance differences, timeout classification, hidden-case redaction, all-pass gate and runner progress/error/cancellation checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
