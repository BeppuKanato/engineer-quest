const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");
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
const { dfsCodeSource: code } = load(root + "/dfs/code-mapping/dfsCode.ts");
const { dfsExecutionContent } = load(root + "/dfs/execution/execution.content.ts");
const { DfsExecutionCanvas } = load(root + "/dfs/execution/DfsExecutionCanvas.tsx");
const { freeDisplayCase: d1 } = load(root + "/dfs/implementation/implementation.content.ts");
const { convertDfsTrace } = load(root + "/dfs/trace/convertTrace.ts");
const { traceDfsCode, dfsTraceEventLimit } = load(root + "/dfs/trace/acquireTrace.ts");
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const plain = value => JSON.parse(JSON.stringify(value));
const projected = canvas => ({ ...canvas.state, operation: canvas.operation ?? canvas.state.operation, highlights: canvas.highlights });
const states = playback => plain(playback.content.steps.map(step => projected(step.canvas)));

(async () => {
  const { buildPythonTraceHarness } = await import(pathToFileURL(path.resolve(__dirname, "../public/python-trace-harness.mjs")));
  function trace(source, maxEvents = dfsTraceEventLimit, traceKind = "dfs") {
    const harness = buildPythonTraceHarness({ code: source, functionName: d1.functionName, args: d1.args, maxEvents, traceKind });
    const result = spawnSync(process.env.PYTHON || "python3", ["-c", [
      "import ast,sys",
      "tree=ast.parse(sys.stdin.read())",
      "exec(compile(ast.Module(body=tree.body[:-1],type_ignores=[]),'<harness>','exec'))",
      "print(eval(compile(ast.Expression(tree.body[-1].value),'<harness>','eval')))",
    ].join("\n")], { input: harness, encoding: "utf8", timeout: 10000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  }

  const normal = trace(code);
  assert.equal(normal.status, "returned");
  assert.deepEqual(normal.visitOrder, plain(d1.expected));
  const playback = convertDfsTrace(normal);
  assert.equal(playback.mode, "replay");
  assert.equal(playback.notice, null);
  assert.equal(playback.content.steps.length, 17);
  const expected = plain(dfsExecutionContent.steps.map(step => projected(step.canvas)));
  assert.deepEqual(states(playback), expected);
  assert.deepEqual(plain(playback.content.steps[12].canvas.trace.variables.visited), ["A", "B", "C", "D", "E", "F"]);
  const html = renderToStaticMarkup(createElement(DfsExecutionCanvas, { canvas: playback.content.steps[12].canvas }));
  assert.match(html, /スタックの中身/);
  assert.match(html, /末尾、次に取り出す/);

  const renamed = code.replace(/\bstack\b/gu, "pending").replace(/\border\b/gu, "result")
    .replace(/\bvisited\b/gu, "seen").replace(/\bnode\b/gu, "place").replace(/\bneighbor\b/gu, "candidate");
  assert.deepEqual(states(convertDfsTrace(trace(renamed))), expected);
  const guessed = trace(renamed.replace("    while pending:", "    backup = set()\n    while pending:"));
  assert(guessed.ambiguousKinds.includes("visited"));
  assert.equal(convertDfsTrace(guessed).mode, "final");
  const fifo = convertDfsTrace(trace(code.replace("stack.pop()", "stack.pop(0)")));
  assert.equal(fifo.mode, "replay");
  assert.deepEqual(plain(fifo.order), ["A", "C", "B", "E", "D", "F"]);
  assert.notDeepEqual(states(fifo), expected);
  assert.equal(convertDfsTrace(trace(code + '\ndfs_order({"A": []}, "A")')).content.steps.length, 17);
  assert.deepEqual(trace(code + '\ndfs_order({"A": []}, "A")').events, normal.events);

  const midway = trace(code.replace("                stack.append(neighbor)", '                raise RuntimeError("PRIVATE_LEARNER_ERROR")'));
  assert.equal(midway.error.line, 11);
  assert(!JSON.stringify(midway).includes("PRIVATE_LEARNER_ERROR"));
  const interrupted = convertDfsTrace(midway);
  assert.equal(interrupted.mode, "replay");
  const stop = interrupted.content.steps.at(-1);
  assert.equal(stop.canvas.trace.line, 11);
  assert.equal(stop.canvas.state.current, "A");
  assert.deepEqual(plain(stop.canvas.trace.variables.visited), ["A", "C"]);
  const cut = convertDfsTrace(trace(code, 15));
  assert.equal(cut.mode, "replay");
  assert.match(cut.notice, /上限/);
  const syntax = convertDfsTrace(trace("def dfs_order(graph, start)\n    pass"));
  assert.equal(syntax.mode, "final");
  assert.equal(syntax.content.steps[0].canvas.trace.line, 1);
  assert.equal(syntax.content.steps[0].canvas.trace.showGraph, false);
  const direct = convertDfsTrace(trace('def dfs_order(graph, start):\n    return ["A","B"]'));
  assert.equal(direct.mode, "final");
  assert.deepEqual(plain(direct.content.steps[0].canvas.state.order), ["A", "B"]);
  const invalid = convertDfsTrace(trace(code.replace("    return order", '    stack.append("X")\n    return order')));
  assert.equal(invalid.mode, "replay");
  assert.match(invalid.notice, /図にできない状態/);
  assert(!invalid.content.steps.some(step => step.canvas.state.stack.includes("X")));

  const legacy = trace(code, dfsTraceEventLimit, "legacy");
  assert(!Object.hasOwn(legacy, "visitOrder"));
  assert(!legacy.events.some(event => Object.hasOwn(event.locals, "stack") || event.boundary === "if"));
  let disposals = 0;
  runner.disposePyodideRunner = () => { disposals++; };
  runner.preparePyodide = async () => { assert.equal(disposals, 1); };
  let callCount = 0;
  runner.tracePythonFunction = async request => {
    callCount++;
    assert.deepEqual(plain(request), { code, functionName: d1.functionName, args: plain(d1.args), maxEvents: dfsTraceEventLimit, traceKind: "dfs" });
    return { trace: normal };
  };
  assert.equal(await traceDfsCode(code), normal);
  assert.equal(callCount, 1);
  runner.preparePyodide = async () => {};
  await assert.rejects(traceDfsCode(code, () => false), /cancelled/);
  assert.equal(callCount, 1);
  const workspace = fs.readFileSync(root + "/dfs/implementation/DfsImplementationPreview.tsx", "utf8");
  assert.match(workspace, /visualDebug: \{ acquire: traceDfsCode, convert: convertDfsTrace, Dialog: DfsTraceDialog \}/);
  console.log("DFS trace verified: 17 exact lesson snapshots, actual reordered visits, renamed variables, safe fallbacks, shared canvas and isolated D1 acquisition.");
})().catch(error => { console.error(error); process.exitCode = 1; });
