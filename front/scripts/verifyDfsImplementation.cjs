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
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return load([base + ".ts", base + ".tsx"].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}

const root = path.resolve(__dirname, "../src/features/learning");
const { dfsImplementationContent: content, freeDisplayCase } = load(root + "/dfs/implementation/implementation.content.ts");
const { dfsCode, dfsCodeSource } = load(root + "/dfs/code-mapping/dfsCode.ts");
const { transferGraph } = load(root + "/dfs/consolidation/consolidation.content.ts");
const { searchGraph, searchGraphAdjacency } = load(root + "/graphs/searchGraph.ts");
const { runImplementationTests, allTestsPassed } = load(root + "/bfs/implementation/implementation.ts");
const { runFreeDisplayCase } = load(root + "/bfs/implementation/freeExecution.ts");
const { countImplementationPlaceholders } = load(root + "/implementation/inputLevel.ts");
const { ParsonsBoard } = load(root + "/components/assessment/ParsonsBoard.tsx");
const { DfsImplementationResults, VisitOrderOutput } = load(root + "/dfs/implementation/ImplementationResults.tsx");
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const plain = value => JSON.parse(JSON.stringify(value));
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props));

assert.equal(content.stageName, "自分で実装");
assert.equal(content.tests[0], freeDisplayCase);
assert.equal(content.displayScenes[0].graph, searchGraph);
assert.equal(content.displayScenes[1].graph, transferGraph);
assert.equal(content.tests[0].args[0], searchGraphAdjacency);
assert.deepEqual(plain(content.tests.map(test => [test.id, test.visibility, test.functionName])), [
  ["D1", "display", "dfs_order"], ["D2", "display", "dfs_order"], ["J1", "judgement", "dfs_order"],
  ["J2", "judgement", "dfs_order"], ["J3", "judgement", "dfs_order"],
]);
assert.deepEqual(plain(content.tests.map(test => test.expected)), [
  ["A", "B", "D", "F", "E", "C"], ["G", "H", "J", "K", "I", "L"], ["A", "B", "D", "F", "E", "C"], ["A"], ["A", "B"],
]);
assert.deepEqual(plain(content.tests[1].args), [{ G: ["H", "I"], H: ["G", "J", "K"], I: ["G", "L"], J: ["H"], K: ["H"], L: ["I"] }, "G"]);
assert.deepEqual(plain(content.tests[2].args), plain([{ ...searchGraphAdjacency, Z: [] }, "A"]));
assert.deepEqual(plain(content.tests.slice(3).map(test => test.args)), [[{ A: [] }, "A"], [{ A: ["B"] }, "A"]]);

const canonicalLines = dfsCode.lines.map(line => line.text);
assert.equal(content.templates.full.split("\n")[0], canonicalLines[0]);
assert(content.templates.full.endsWith("\n    pass"));
for (const [level, blankCount] of [["skeleton", 7], ["fill-in", 3]]) {
  const template = content.templates[level];
  assert.equal(countImplementationPlaceholders(template), blankCount);
  const withoutGuide = template.split("\n").filter((_, index) => index !== 1);
  assert.equal(withoutGuide.length, canonicalLines.length);
  withoutGuide.forEach((line, index) => {
    if (line.includes("raise NotImplementedError")) assert.equal(line.match(/^ */)[0], canonicalLines[index].match(/^ */)[0]);
    else assert.equal(line, canonicalLines[index]);
  });
}

assert.equal(content.hints.labels.length, 4);
assert.deepEqual(plain(content.hints.variables.map(variable => variable.name)), ["visited", "order", "stack"]);
assert(["pop()", "append()", "reversed()"].every(token => content.hints.tokens.includes(token)));
assert.deepEqual(plain(content.hints.skeletonLines.map(line => line.id)), ["while-stack", "for-neighbor-reversed", "if-unvisited"]);
for (const line of content.hints.skeletonLines) assert.equal(line, dfsCode.lines.find(candidate => candidate.id === line.id));
const practice = render(ParsonsBoard, { question: content.hints.parsonsQuestion, code: dfsCode });
assert.equal((practice.match(/data-parsons-line-id=/g) || []).length, dfsCode.lines.length);
assert(!practice.includes("data-parsons-fixed") && !practice.includes("この順序で回答する"));

const sample = actual => render(VisitOrderOutput, { expected: ["A", "B"], actual });
assert(sample(["B", "A"]).includes("訪問順が期待値と異なります"));
assert(sample(["B", "B"]).includes("不足している場所（A）") && sample(["B", "B"]).includes("余分に入っている場所（B）"));
assert(sample({ A: 0 }).includes("場所の名前を並べたリストを返してください"));
assert(sample(["A", "B"]).includes("A → B"));
const rendered = render(DfsImplementationResults, { outcomes: [
  { id: "D1", passed: false, actual: ["B", "A"] },
  { id: "J1", passed: false, actual: ["PRIVATE_HIDDEN_RESULT"] },
  { id: "J3", passed: false, error: "runtime", errorLine: 8 },
] });
assert.equal((rendered.match(/data-test-id=/g) || []).length, 5);
assert.equal((rendered.match(/期待する訪問順/g) || []).length, 2);
assert(rendered.includes("結果が期待と違う") && rendered.includes("実行時エラー") && rendered.includes("8行目付近"));
assert(!rendered.includes("PRIVATE_HIDDEN_RESULT"));

const workerPath = path.resolve(__dirname, "../public/pyodide-course-worker.mjs");
const workerSource = fs.readFileSync(workerPath, "utf8")
  .replace(/^import .+\r?\n/u, "")
  .replace("await getPyodide()", "runtime");
const requests = [];
// Worker の採点ハーネスはそのまま使い、Python 実行だけローカルの CPython に差し替える。
runner.runCourseMissionTests = async (code, tests, output) => {
  requests.push(plain(tests.map(test => test.id)));
  const messages = [];
  const self = { postMessage: message => messages.push(message) };
  let stdout;
  const runtime = {
    setStdout: options => { stdout = options.batched; },
    setStderr: () => {},
    runPythonAsync: script => {
      const result = spawnSync(process.env.PYTHON || "python3", ["-c", script + "\nprint(json.dumps(__eq_results))"],
        { encoding: "utf8", timeout: 5000 });
      assert.ifError(result.error);
      if (result.status !== 0) throw new Error(result.stderr);
      const lines = result.stdout.trimEnd().split(/\r?\n/u);
      const json = lines.pop();
      for (const line of lines) stdout(line);
      return json;
    },
  };
  vm.runInNewContext(workerSource, { self, runtime }, { filename: workerPath });
  await self.onmessage({ data: { id: 1, kind: "run", code, tests } });
  for (const message of messages) if (typeof message.stdout === "string") output?.onStdout?.(message.stdout);
  const result = messages.at(-1);
  if (result.error) throw new Error(result.error);
  return result;
};

(async () => {
  const progress = [];
  const outcomes = await runImplementationTests(dfsCodeSource, content.tests, current => progress.push(current.length));
  assert.deepEqual(progress, [1, 2, 3, 4, 5]);
  assert(allTestsPassed(content.tests, outcomes));
  assert.deepEqual(plain(outcomes.slice(0, 2).map(result => result.actual)), plain(content.tests.slice(0, 2).map(test => test.expected)));
  assert(outcomes.slice(2).every(result => !Object.hasOwn(result, "actual")));
  const wrongOrder = dfsCodeSource.replace("reversed(graph.get(node, []))", "graph.get(node, [])");
  const wrong = await runImplementationTests(wrongOrder, content.tests, () => {});
  assert.equal(wrong[0].passed, false);
  assert.equal(wrong[1].passed, false);
  assert(!allTestsPassed(content.tests, wrong));
  const missingNeighbor = dfsCodeSource.replace("graph.get(node, [])", "graph[node]");
  const indexed = await runImplementationTests(missingNeighbor, content.tests, () => {});
  assert(indexed.slice(0, 4).every(result => result.passed));
  assert.equal(indexed[4].error, "runtime");
  for (const template of Object.values(content.templates)) {
    const results = await runImplementationTests(template, content.tests.slice(0, 1), () => {});
    assert(!results[0].passed && results[0].error !== "syntax");
  }

  let prepared = false;
  runner.disposePyodideRunner = () => { prepared = false; };
  runner.preparePyodide = async () => { prepared = true; };
  const free = await runFreeDisplayCase(freeDisplayCase, dfsCodeSource + "\nprint('D1 only')", () => assert(prepared));
  assert.equal(free.stdout, "D1 only");
  assert.equal(free.error, null);
  assert.deepEqual(plain(free.actual), plain(freeDisplayCase.expected));
  assert.deepEqual(requests.at(-1), ["D1"]);
  assert(allTestsPassed(content.tests, outcomes) && !allTestsPassed(content.tests, outcomes.slice(0, 4)));
  console.log("DFS implementation verified: real Python test harness, ordered results, three templates, hints, hidden-case redaction, D1 console and all-pass gate.");
})().catch(error => { console.error(error); process.exitCode = 1; });
