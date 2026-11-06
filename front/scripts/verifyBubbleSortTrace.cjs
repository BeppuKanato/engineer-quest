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
const { bubbleSortCodeSource } = load(`${root}/bubble-sort/code-mapping/bubbleSortCode.ts`);
const { bubbleSortImplementationContent } = load(`${root}/bubble-sort/implementation/implementation.content.ts`);
const { bubbleSortExecutionContent } = load(`${root}/bubble-sort/execution/execution.content.ts`);
const { convertBubbleSortTrace } = load(`${root}/bubble-sort/trace/convertTrace.ts`);
const { traceBubbleSortCode, bubbleSortTraceEventLimit } = load(`${root}/bubble-sort/trace/acquireTrace.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const plain = value => JSON.parse(JSON.stringify(value));
const code = bubbleSortCodeSource;
const d1 = bubbleSortImplementationContent.tests.find(test => test.id === "D1");
const projected = canvas => ({ values: canvas.state.values, comparing: canvas.state.comparing, fixedFrom: canvas.state.fixedFrom });
(async () => {
  const { buildPythonTraceHarness } = await import(pathToFileURL(path.resolve(__dirname, "../public/python-trace-harness.mjs")));
  function trace(source, maxEvents = bubbleSortTraceEventLimit) {
    const harness = buildPythonTraceHarness({ code: source, functionName: "bubble_sort", args: d1.args, maxEvents });
    const result = spawnSync(process.env.PYTHON || "python3", ["-c", "import ast,sys\ntree=ast.parse(sys.stdin.read())\nexec(compile(ast.Module(body=tree.body[:-1],type_ignores=[]),'<harness>','exec'))\nprint(eval(compile(ast.Expression(tree.body[-1].value),'<harness>','eval')))"], { input: harness, encoding: "utf8", timeout: 10000 });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  }
  // ---- 正解コード: フェーズ2の正準16コマと一致する ----
  const normal = trace(code);
  assert.equal(normal.status, "returned");
  assert.deepEqual(normal.result, plain(d1.expected));
  assert.equal(normal.ambiguous, false);
  assert(normal.events.some(event => Array.isArray(event.locals.array) && event.locals.j === 0 && event.locals.i === 0), "harness records the working array and indices");
  const playback = convertBubbleSortTrace(normal);
  assert.equal(playback.mode, "replay");
  assert.equal(playback.notice, null);
  const expected = plain(bubbleSortExecutionContent.steps.map(step => projected(step.canvas)));
  assert.equal(expected.length, 16, "phase 2 canonical sequence has 16 steps");
  assert.deepEqual(plain(playback.content.steps.map(step => projected(step.canvas))), expected, "Trace must equal the canonical phase-2 state sequence");
  assert.deepEqual(plain(playback.content.steps.map(step => step.canvas.highlights)), plain(bubbleSortExecutionContent.steps.map(step => step.canvas.highlights)), "Swapped pairs are highlighted exactly as in phase 2");
  for (let index = 1; index < playback.content.steps.length; index++) {
    assert.notDeepEqual(projected(playback.content.steps[index - 1].canvas), projected(playback.content.steps[index].canvas), "No consecutive duplicate states");
  }
  // スナップショットはコピーであり、過去イベントの書き換えが後続へ波及しない。
  const copiedIndex = normal.events.findIndex(event => event.locals.array?.length);
  assert(copiedIndex >= 0);
  normal.events[copiedIndex].locals.array.push(999);
  assert(!normal.events.slice(copiedIndex + 1).some(event => event.locals.array?.includes(999)), "Snapshot values are copies");
  // ---- インプレース実装（values を直接並び替える）も型・内容の検出で再生できる ----
  const inPlace = `def bubble_sort(values):\n    n = len(values)\n    for i in range(n - 1):\n        for j in range(n - 1 - i):\n            if values[j] > values[j + 1]:\n                values[j], values[j + 1] = values[j + 1], values[j]\n    return values`;
  const inPlaceView = convertBubbleSortTrace(trace(inPlace));
  assert.equal(inPlaceView.mode, "replay");
  assert.deepEqual(plain(inPlaceView.content.steps.map(step => projected(step.canvas))), expected, "In-place code replays the same states");
  // ---- 誤った比較（逆向き）も、正しい並びへ差し替えずそのまま再生する ----
  const reversed = trace(code.replace("result[j] > result[j + 1]", "result[j] < result[j + 1]"));
  assert.deepEqual(reversed.result, [5, 4, 3, 2, 1]);
  const reversedView = convertBubbleSortTrace(reversed);
  assert.equal(reversedView.mode, "replay");
  assert.deepEqual(plain(reversedView.content.steps.at(-1).canvas.state.values), [5, 4, 3, 2, 1], "Replay the learner's descending result");
  assert(reversedView.content.steps.some(step => step.caption.includes("入れ替えます")), "Actual swaps are captioned as swaps");
  // ---- 交換しないコードは「そのまま」のコマ列になる ----
  const noSwap = convertBubbleSortTrace(trace(code.replace("result[j] > result[j + 1]", "False")));
  assert.equal(noSwap.mode, "replay");
  assert.deepEqual(plain(noSwap.content.steps.at(-1).canvas.state.values), plain(d1.args[0]), "No-swap code ends with the input order");
  assert(noSwap.content.steps.filter(step => step.canvas.state.comparing !== null).every(step => step.caption.includes("そのままにします")), "Non-swapping comparisons are captioned as kept");
  // ---- 途中のエラーは停止行・種別だけを示し、本文は出さない ----
  const errorCode = code.replace("result[j], result[j + 1] = result[j + 1], result[j]", 'raise RuntimeError("PRIVATE_MIDWAY_MESSAGE")');
  const midway = trace(errorCode);
  assert.equal(midway.status, "error"); assert.equal(midway.error.line, 7); assert.equal(midway.error.kind, "RuntimeError");
  assert(!JSON.stringify(midway).includes("PRIVATE_MIDWAY_MESSAGE"));
  const midwayView = convertBubbleSortTrace(midway);
  assert.equal(midwayView.mode, "replay");
  assert(midwayView.content.steps.at(-1).caption.includes("7行目"));
  assert.deepEqual(plain(midwayView.content.steps.at(-1).canvas.state.values), plain(d1.args[0]), "States before the error are retained");
  assert.deepEqual(plain(midwayView.content.steps.at(-1).canvas.state.comparing), [0, 1], "The comparison being attempted when it stopped stays visible");
  // ---- 描けない状態（負数）が末尾に残れば、途中まで表示として明示する ----
  const negativeTail = trace(code.replace("    return result", "    result[0] = -999\n    return result"));
  const negativeView = convertBubbleSortTrace(negativeTail);
  assert.equal(negativeView.mode, "replay");
  assert(negativeView.notice.includes("途中まで"));
  assert.deepEqual(plain(negativeView.content.steps.at(-1).canvas.state.values), plain(d1.expected), "The last drawable state is retained");
  // ---- 打ち切り ----
  const loop = trace("def bubble_sort(values):\n    result = list(values)\n    while True:\n        result[0] = result[0]", 20);
  assert.equal(loop.status, "truncated"); assert(loop.events.length <= 20); assert.equal(loop.eventCount, 20);
  const limited = convertBubbleSortTrace(loop);
  assert(limited.content.steps.at(-1).caption.includes("途中まで"));
  // ---- 構文エラーは最終状態表示へ落とす ----
  const syntax = trace("def bubble_sort(values)\n    pass");
  assert.equal(syntax.error.kind, "SyntaxError");
  assert.equal(convertBubbleSortTrace(syntax).mode, "final");
  // ---- 候補が曖昧なら推測せず最終状態だけを示す ----
  const ambiguousCode = `def bubble_sort(values):\n    a = list(values)\n    b = list(values)\n    for i in range(len(a) - 1):\n        for j in range(len(a) - 1 - i):\n            if a[j] > a[j + 1]:\n                a[j], a[j + 1] = a[j + 1], a[j]\n    return a`;
  const ambiguous = trace(ambiguousCode);
  assert.equal(ambiguous.ambiguous, true);
  const ambiguousView = convertBubbleSortTrace(ambiguous);
  assert.equal(ambiguousView.mode, "final"); assert.equal(ambiguousView.content.steps.length, 1);
  assert.deepEqual(plain(ambiguousView.content.steps[0].canvas.state.values), plain(d1.expected), "Final-only mode shows the returned list");
  assert.equal(ambiguousView.content.steps[0].canvas.state.comparing, null);
  // ---- 作業リストと戻り値が食い違う実装では、終端は戻り値を示す ----
  const builtin = convertBubbleSortTrace(trace("def bubble_sort(values):\n    return sorted(values)"));
  assert.equal(builtin.mode, "replay");
  assert.deepEqual(plain(builtin.content.steps.at(-1).canvas.state.values), plain(d1.expected), "Terminal frame shows the returned list, not the untouched input");
  // ---- キャンバス描画: バーの本数と値が図に出る ----
  const { renderToStaticMarkup } = require("react-dom/server"), { createElement } = require("react");
  const { BubbleSortExecutionCanvas } = load(`${root}/bubble-sort/execution/BubbleSortExecutionCanvas.tsx`);
  const html = renderToStaticMarkup(createElement(BubbleSortExecutionCanvas, { canvas: playback.content.steps[1].canvas }));
  assert.equal((html.match(/data-array-bar=/g) || []).length, 5);
  assert.equal((html.match(/data-array-comparing/g) || []).length, 2, "The compared pair is marked on the bars");
  // ---- 取得はD1だけを新しいWorkerへ送る ----
  let disposed = false, prepared = false, calls = 0;
  runner.disposePyodideRunner = () => { disposed = true; };
  runner.preparePyodide = async () => { assert(disposed); prepared = true; };
  runner.tracePythonFunction = async options => {
    calls++; assert(prepared); assert.equal(options.code, "current editor code"); assert.equal(options.functionName, "bubble_sort");
    assert.deepEqual(plain(options.args), plain(d1.args)); assert.equal(options.maxEvents, 500);
    assert(!("tests" in options)); assert(!("expected" in options)); return { trace: ambiguous };
  };
  assert.equal(await traceBubbleSortCode("current editor code"), ambiguous);
  await assert.rejects(() => traceBubbleSortCode("cancelled", () => false), /cancelled/);
  assert.equal(calls, 1, "An unmounted owner cannot start a later trace request");
  // ---- ソースpin: 変換は教材の正準データを流用して状態を作らない ----
  const convertSource = fs.readFileSync(`${root}/bubble-sort/trace/convertTrace.ts`, "utf8");
  assert(!convertSource.includes("bubbleSortExecutionContent"), "converter must not substitute canonical phase-2 data");
  assert(!convertSource.includes("bubbleSortComparisons"), "converter must not re-run the reference procedure");
  console.log("Bubble-sort trace: real CPython harness, canonical phase-2 state sequence, copied snapshots, in-place detection, wrong-comparison replay, midway error stop line, undrawable tail partial notice, truncation, syntax fallback, ambiguous final-only mode, returned-list terminal frame, canvas rendering and isolated D1-only acquisition passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
