const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { pathToFileURL } = require("node:url");
const { spawnSync } = require("node:child_process");
const ts = require("typescript");
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {}; cache.set(filename, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename }); return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const { bfsCode } = load(`${root}/units/bfs/code-mapping/bfsCode.ts`);
const { bfsImplementationContent } = load(`${root}/units/bfs/implementation/implementation.content.ts`);
const { bfsExecutionContent } = load(`${root}/units/bfs/execution/execution.content.ts`);
const { convertBfsTrace } = load(`${root}/units/bfs/trace/convertTrace.ts`);
const { traceBfsCode, bfsTraceEventLimit } = load(`${root}/units/bfs/trace/acquireTrace.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const plain = value => JSON.parse(JSON.stringify(value));
const code = bfsCode.lines.map(line => line.text).join("\n");
const d1 = bfsImplementationContent.tests.find(test => test.id === "D1");
const projected = canvas => ({ current: canvas.state.current, queue: canvas.state.queue.map(item => item.nodeId), distances: Object.fromEntries(canvas.state.nodes.filter(node => node.distance !== null).map(node => [node.id, node.distance])) });
const dedupe = values => values.filter((value, index) => index === 0 || JSON.stringify(value) !== JSON.stringify(values[index - 1]));
(async () => {
  const { buildPythonTraceHarness } = await import(pathToFileURL(path.resolve(__dirname, "../public/python-trace-harness.mjs")));
  function trace(source, maxEvents = bfsTraceEventLimit) {
    const harness = buildPythonTraceHarness({ code: source, functionName: "bfs_distances", args: d1.args, maxEvents });
    const result = spawnSync(process.env.PYTHON || "python3", ["-c", "import ast,sys\ntree=ast.parse(sys.stdin.read())\nexec(compile(ast.Module(body=tree.body[:-1],type_ignores=[]),'<harness>','exec'))\nprint(eval(compile(ast.Expression(tree.body[-1].value),'<harness>','eval')))"], { input: harness, encoding: "utf8", timeout: 10000 });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  }
  const normal = trace(code);
  assert.equal(normal.status, "returned"); assert.deepEqual(normal.result, plain(d1.expected));
  const playback = convertBfsTrace(normal);
  assert.equal(playback.mode, "replay");
  const expected = dedupe(plain(bfsExecutionContent.steps.map(step => projected(step.canvas))));
  const actual = plain(playback.content.steps.map(step => projected(step.canvas)));
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fs.writeFileSync('/tmp/bfs76-states.json', JSON.stringify({ actual, expected, events: normal.events }, null, 2));
  }
  assert.deepEqual(actual, expected, "Normalized trace must equal the canonical phase-2 state sequence");
  const copiedIndex = normal.events.findIndex(event => event.locals.queue?.length);
  assert(copiedIndex >= 0);
  normal.events[copiedIndex].locals.queue.push("MUTATED");
  assert(!normal.events.slice(copiedIndex + 1).some(event => event.locals.queue?.includes("MUTATED")), "Snapshot values are copies");
  const listBased = convertBfsTrace(trace(code.replace("deque([start])", "[start]").replace("queue.popleft()", "queue.pop(0)")));
  assert.deepEqual(plain(listBased.content.steps.map(step => projected(step.canvas))), expected);
  const swapped = code.replace("    distances = {start: 0}\n    queue = deque([start])", "    queue = deque([start])\n    distances = {start: 0}");
  assert.deepEqual(plain(convertBfsTrace(trace(swapped)).content.steps.map(step => projected(step.canvas))), expected);
  const lifo = convertBfsTrace(trace(code.replace("queue.popleft()", "queue.pop()")));
  const lifoNodes = lifo.content.steps.map(step => step.canvas.state.current).filter((node, index, values) => node !== null && node !== values[index - 1]);
  assert.deepEqual(plain(lifoNodes), ["A", "C", "E", "F", "D", "B"], "Replay the learner's LIFO bug instead of substituting correct BFS states");
  const errorCode = code.replace('    return distances', '    return 1 / 0');
  const error = trace(errorCode);
  assert.equal(error.status, "error"); assert.equal(error.error.line, 11); assert.equal(error.error.kind, "ZeroDivisionError");
  const errorView = convertBfsTrace(error);
  assert.equal(errorView.mode, "replay"); assert(errorView.content.steps.at(-1).caption.includes("11行目"));
  assert(!JSON.stringify(error).includes("Traceback"));
  const midway = trace(code.replace("                queue.append(neighbor)", '                raise RuntimeError("PRIVATE_MIDWAY_MESSAGE")'));
  const midwayView = convertBfsTrace(midway);
  assert.equal(midway.error.line, 10); assert.equal(midwayView.mode, "replay");
  assert.equal(midwayView.content.steps.at(-1).canvas.state.current, "A");
  assert.equal(midwayView.content.steps.at(-1).canvas.state.nodes.find(node => node.id === "B").distance, 1);
  assert(!JSON.stringify(midway).includes("PRIVATE_MIDWAY_MESSAGE"));
  for (let index = 1; index < playback.content.steps.length; index++) {
    assert.notDeepEqual(projected(playback.content.steps[index - 1].canvas), projected(playback.content.steps[index].canvas));
  }
  const recursive = `def bfs_distances(graph, start):\n    result = {start: 0}\n    def visit(node):\n        for neighbor in graph.get(node, []):\n            if neighbor not in result or result[neighbor] > result[node] + 1:\n                result[neighbor] = result[node] + 1\n                visit(neighbor)\n    visit(start)\n    return result`;
  const unsupported = trace(recursive);
  assert.deepEqual(unsupported.result, plain(d1.expected));
  const final = convertBfsTrace(unsupported);
  assert.equal(final.mode, "final"); assert.equal(final.content.steps.length, 1); assert(final.notice.includes("結果だけ"));
  assert.equal(final.content.steps[0].canvas.highlights.length, 0, "Final-only output does not invent an active node highlight");
  assert.deepEqual(plain(projected(final.content.steps[0].canvas).distances), plain(d1.expected));
  const loop = trace('def bfs_distances(graph, start):\n    from collections import deque\n    distances = {start: 0}\n    queue = deque([start])\n    while queue:\n        node = queue[0]', 20);
  assert.equal(loop.status, "truncated"); assert(loop.events.length <= 20); assert.equal(loop.eventCount, 20);
  const limited = convertBfsTrace(loop); assert(limited.content.steps.at(-1).caption.includes("途中まで"));
  assert(limited.content.steps.some(step => step.canvas.state.current === "A"));
  assert(!limited.content.steps.some(step => step.caption.includes("取り出しました")), "Peeking at queue[0] is not dequeueing");
  const syntax = trace('def bfs_distances(graph, start)\n    pass');
  assert.equal(syntax.error.kind, "SyntaxError"); assert.equal(syntax.error.line, 1); assert.equal(convertBfsTrace(syntax).mode, "final");
  const unsupportedError = trace('def bfs_distances(graph, start):\n    raise ValueError("DO_NOT_EXPOSE_THIS")');
  assert.equal(convertBfsTrace(unsupportedError).mode, "final"); assert.equal(unsupportedError.error.line, 2);
  assert(!JSON.stringify(unsupportedError).includes("DO_NOT_EXPOSE_THIS"));
  const swallowed = trace("def bfs_distances(graph, start):\n    try:\n        while True:\n            pass\n    except BaseException:\n        return {}", 20);
  assert.equal(swallowed.status, "truncated", "Catching the limit must not turn a cut trace into a successful execution");
  for (const renamed of [code.replace(/\bqueue\b/gu, "que"), code.replace(/\bqueue\b/gu, "q").replace(/\bdistances\b/gu, "dist")]) {
    const result = trace(renamed), view = convertBfsTrace(result);
    assert.equal(result.ambiguous, false); assert.equal(view.mode, "replay");
    assert.deepEqual(plain(view.content.steps.map(step => projected(step.canvas))), expected, "Shape-detected variables and while boundaries preserve canonical states");
  }
  const canonicalPriority = trace(code.replace("    while queue:", "    another_queue = []\n    another_distances = {}\n    while queue:"));
  assert.equal(canonicalPriority.ambiguous, false, "Canonical names take priority over other shape-compatible locals");
  assert.deepEqual(plain(convertBfsTrace(canonicalPriority).content.steps.map(step => projected(step.canvas))), expected);
  for (const source of [
    code.replace(/\bqueue\b/gu, "q").replace("    while q:", "    other = []\n    while q:"),
    code.replace(/\bdistances\b/gu, "dist").replace("    while queue:", "    other = {}\n    while queue:"),
  ]) {
    const result = trace(source);
    assert.equal(result.ambiguous, true); assert.equal(convertBfsTrace(result).mode, "final", "Ambiguous candidates must not produce even a guessed partial replay");
  }
  const trialCall = trace(code + '\nbfs_distances({"A": []}, "A")');
  assert.deepEqual(trialCall.result, plain(d1.expected));
  assert.deepEqual(trialCall.events, trace(code).events, "Only the harness D1 call is recorded");
  const topWork = trace(code + '\nfor _ in range(1000):\n    bfs_distances({"A": []}, "A")');
  assert.equal(topWork.eventCount, trace(code).eventCount, "Top-level work cannot consume the D1 budget");
  assert.deepEqual(topWork.events, trace(code).events);
  const topError = trace(code + '\nraise RuntimeError("PRIVATE_TOP_LEVEL_ERROR")');
  assert.equal(topError.status, "returned"); assert.deepEqual(topError.events, trace(code).events);
  assert(!JSON.stringify(topError).includes("PRIVATE_TOP_LEVEL_ERROR"));
  const missingFunction = trace('raise ValueError("PRIVATE_TOP_LEVEL_ERROR")\n' + code);
  assert.equal(missingFunction.status, "error"); assert.equal(missingFunction.error.line, 1);
  assert.equal(missingFunction.error.kind, "ValueError"); assert.equal(missingFunction.events.length, 0);
  assert(!JSON.stringify(missingFunction).includes("PRIVATE_TOP_LEVEL_ERROR"));
  // Invalid tails retain real, drawable frames rather than discarding the entire replay.
  const invalidTail = trace(code.replace("    return distances", '    queue.extend(["A", "A"])\n    return distances'));
  const partial = convertBfsTrace(invalidTail);
  assert.equal(partial.mode, "replay"); assert(partial.notice.includes("途中まで"));
  assert(partial.content.steps.at(-1).caption.includes("途中まで"));
  assert.deepEqual(plain(partial.content.steps.map(step => projected(step.canvas))), expected);
  assert.deepEqual(plain(partial.content.steps.at(-1).canvas.trace.variables.queue), [], "The last displayed variables come from a drawable snapshot");
  assert.equal(partial.content.steps.at(-1).canvas.trace.line, 5, "Retain the last displayed while-boundary line instead of pairing valid variables with the invalid return line");
  const recovered = trace(code.replace("    return distances", '    queue.extend(["A", "A"])\n    queue.clear()\n    return distances'));
  assert.equal(convertBfsTrace(recovered).mode, "replay"); assert.equal(convertBfsTrace(recovered).notice, null, "An individual invalid snapshot may be skipped when the tail is drawable");
  const wrongDistances = trace(code.replace("distances[node] + 1", "distances[node] - 1"));
  const wrongView = convertBfsTrace(wrongDistances);
  assert.equal(wrongView.mode, "replay");
  assert(wrongView.content.steps.some(step => step.canvas.state.nodes.some(node => node.distance < 0)));
  assert.equal(wrongView.content.steps.at(-1).canvas.data.graph.layers.length, 0, "Do not label wrong distances with canonical bands");
  const { renderToStaticMarkup } = require("react-dom/server"), { createElement } = require("react");
  const { BfsExecutionCanvas } = load(`${root}/units/bfs/execution/BfsExecutionCanvas.tsx`);
  const html = renderToStaticMarkup(createElement(BfsExecutionCanvas, { canvas: wrongView.content.steps.at(-1).canvas }));
  assert.equal((html.match(/data-node-id=/g) || []).length, 6);
  assert(html.includes("-1歩"), "Keep the learner's wrong distance visible");
  let disposed = false, prepared = false, calls = 0;
  runner.disposePyodideRunner = () => { disposed = true; };
  runner.preparePyodide = async () => { assert(disposed); prepared = true; };
  runner.tracePythonFunction = async options => {
    calls++; assert(prepared); assert.equal(options.code, "current editor code"); assert.equal(options.functionName, "bfs_distances");
    assert.deepEqual(plain(options.args), plain(d1.args)); assert.equal(options.maxEvents, 500);
    assert(!("tests" in options)); assert(!("expected" in options)); return { trace: unsupported };
  };
  assert.equal(await traceBfsCode("current editor code"), unsupported);
  await assert.rejects(() => traceBfsCode("cancelled", () => false), /cancelled/);
  assert.equal(calls, 1, "An unmounted owner cannot start a later trace request");
  console.log("BFS trace: real CPython harness, canonical phase-2 normalized states, copied locals, renamed/ambiguous locals, D1-only root and event budget, partial invalid tails, stop line, recursive final-only fallback, truncation, syntax/runtime redaction and isolated D1-only acquisition passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
