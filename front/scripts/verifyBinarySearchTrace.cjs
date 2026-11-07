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
const { binarySearchCodeSource } = load(`${root}/binary-search/code-mapping/binarySearchCode.ts`);
const { binarySearchImplementationContent } = load(`${root}/binary-search/implementation/implementation.content.ts`);
const { binarySearchExecutionContent } = load(`${root}/binary-search/execution/execution.content.ts`);
const { convertBinarySearchTrace } = load(`${root}/binary-search/trace/convertTrace.ts`);
const { traceBinarySearchCode, binarySearchTraceEventLimit } = load(`${root}/binary-search/trace/acquireTrace.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const plain = value => JSON.parse(JSON.stringify(value));
const code = binarySearchCodeSource;
const d1 = binarySearchImplementationContent.tests.find(test => test.id === "D1");
const projected = canvas => ({
  values: canvas.state.values, target: canvas.state.target, lo: canvas.state.lo, hi: canvas.state.hi,
  mid: canvas.state.mid, cells: canvas.state.cells, highlights: canvas.highlights,
});
(async () => {
  const { buildPythonTraceHarness } = await import(pathToFileURL(path.resolve(__dirname, "../public/python-trace-harness.mjs")));
  function trace(source, functionName = "binary_search", args = d1.args, maxEvents = binarySearchTraceEventLimit) {
    const harness = buildPythonTraceHarness({ code: source, functionName, args, maxEvents });
    const result = spawnSync(process.env.PYTHON || "python3", ["-c", "import ast,sys\ntree=ast.parse(sys.stdin.read())\nexec(compile(ast.Module(body=tree.body[:-1],type_ignores=[]),'<harness>','exec'))\nprint(eval(compile(ast.Expression(tree.body[-1].value),'<harness>','eval')))"], { input: harness, encoding: "utf8", timeout: 10000 });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  }
  // ---- ハーネス加算: 二分探索の変数が記録され、既存単元のコードには何も混入しない ----
  const normal = trace(code);
  assert.equal(normal.status, "returned");
  assert.equal(normal.result, null, "Integer results stay unrecorded; discovery is judged from the final comparison");
  assert.equal(normal.ambiguous, false);
  assert(normal.events.some(event => event.locals.lo === 0 && event.locals.hi === 6 && event.locals.mid === 3 && event.locals.target === 25 && Array.isArray(event.locals.array)),
    "harness records the range, the centre, the target and the working list");
  const { bubbleSortCodeSource } = load(`${root}/bubble-sort/code-mapping/bubbleSortCode.ts`);
  const bubbleArgs = load(`${root}/bubble-sort/implementation/implementation.content.ts`).bubbleSortImplementationContent.tests.find(test => test.id === "D1").args;
  const bubble = trace(bubbleSortCodeSource, "bubble_sort", bubbleArgs);
  assert.equal(bubble.status, "returned");
  assert(bubble.events.every(event => !("lo" in event.locals) && !("hi" in event.locals) && !("mid" in event.locals) && !("target" in event.locals)),
    "The added passthrough records nothing for units without those variable names");
  assert(bubble.events.some(event => Array.isArray(event.locals.array) && typeof event.locals.i === "number" && typeof event.locals.j === "number"),
    "Existing passthrough entries are unchanged");
  // ---- 正解コード: フェーズ2の正準11コマと盤面・強調・キャプションまで一致する ----
  const playback = convertBinarySearchTrace(normal);
  assert.equal(playback.mode, "replay");
  assert.equal(playback.notice, null);
  assert.equal(binarySearchExecutionContent.steps.length, 11, "phase 2 canonical sequence has 11 steps");
  assert.deepEqual(plain(playback.content.steps.map(step => projected(step.canvas))),
    plain(binarySearchExecutionContent.steps.map(step => projected(step.canvas))),
    "Trace must equal the canonical phase-2 board sequence");
  assert.deepEqual(plain(playback.content.steps.map(step => step.caption)),
    plain(binarySearchExecutionContent.steps.map(step => step.caption)),
    "Trace captions must equal the canonical phase-2 captions");
  for (let index = 1; index < playback.content.steps.length; index++) {
    assert.notDeepEqual(projected(playback.content.steps[index - 1].canvas), projected(playback.content.steps[index].canvas), "No consecutive duplicate boards");
  }
  // スナップショットはコピーであり、過去イベントの書き換えが後続へ波及しない。
  const copiedIndex = normal.events.findIndex(event => event.locals.array?.length);
  assert(copiedIndex >= 0);
  normal.events[copiedIndex].locals.array.push(999);
  assert(!normal.events.slice(copiedIndex + 1).some(event => event.locals.array?.includes(999)), "Snapshot values are copies");
  // ---- 比較の向きを逆にした誤探索も、正しい探索へ差し替えずそのまま再生する ----
  const wrongDirection = trace(code.replace("elif values[mid] < target:", "elif values[mid] > target:"));
  assert.equal(wrongDirection.status, "returned");
  const wrongView = convertBinarySearchTrace(wrongDirection);
  assert.equal(wrongView.mode, "replay");
  assert(wrongView.content.steps.at(-1).caption.includes("見つかりませんでした"), "A reversed search ends as not found");
  assert(wrongView.content.steps.every(step => !step.canvas.state.cells.includes("found")), "A reversed search never marks a cell as found");
  assert(wrongView.content.steps.some(step => step.caption.includes("右側には")), "The wrongly dropped side is replayed as executed");
  // ---- lo = mid の誤り（捨てる側に中央を含める）も、結果として見つけた位置を発見として示す ----
  const stallFind = trace(code.replace("lo = mid + 1", "lo = mid"));
  const stallView = convertBinarySearchTrace(stallFind);
  assert.equal(stallView.mode, "replay");
  assert.equal(stallView.content.steps.at(-1).canvas.state.cells[4], "found", "The position actually reached is marked as found");
  // ---- 途中のエラーは停止行・種別だけを示し、本文は出さない ----
  const errorCode = code.replace("lo = mid + 1", 'raise RuntimeError("PRIVATE_MIDWAY_MESSAGE")');
  const midway = trace(errorCode);
  assert.equal(midway.status, "error"); assert.equal(midway.error.line, 9); assert.equal(midway.error.kind, "RuntimeError");
  assert(!JSON.stringify(midway).includes("PRIVATE_MIDWAY_MESSAGE"));
  const midwayView = convertBinarySearchTrace(midway);
  assert.equal(midwayView.mode, "replay");
  assert(midwayView.content.steps.at(-1).caption.includes("9行目"));
  assert.equal(midwayView.content.steps.at(-1).canvas.state.mid, 3, "The comparison being attempted when it stopped stays visible");
  // ---- 盤面として描けない並びが途中で現れたら、変換できた範囲までを途中表示として明示する ----
  const corrupt = `def binary_search(values, target):
    lo = 0
    hi = len(values) - 1
    count = 0
    while lo <= hi:
        mid = (lo + hi) // 2
        if values[mid] == target:
            return mid
        elif values[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
        count += 1
        if count == 2:
            values[0] = 999
    return -1`;
  const corruptView = convertBinarySearchTrace(trace(corrupt));
  assert.equal(corruptView.mode, "replay");
  assert(corruptView.notice.includes("途中まで"));
  assert(!corruptView.content.steps.some(step => step.canvas.state.values.includes(999)), "Undrawable boards never enter the replay");
  // ---- 打ち切り ----
  const loopCode = `def binary_search(values, target):
    lo = 0
    hi = len(values) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if values[mid] == target:
            return mid
    return -1`;
  const loop = trace(loopCode, "binary_search", d1.args, 40);
  assert.equal(loop.status, "truncated"); assert(loop.events.length <= 40); assert.equal(loop.eventCount, 40);
  const limited = convertBinarySearchTrace(loop);
  assert.equal(limited.mode, "replay");
  assert(limited.content.steps.at(-1).caption.includes("途中まで"));
  // ---- 構文エラーは最終状態表示へ落とす ----
  const syntax = trace("def binary_search(values, target)\n    pass");
  assert.equal(syntax.error.kind, "SyntaxError");
  assert.equal(convertBinarySearchTrace(syntax).mode, "final");
  // ---- 候補が曖昧なら推測せず最終状態だけを示す ----
  const ambiguousCode = `def binary_search(values, target):
    a = list(values)
    b = list(values)
    lo = 0
    hi = len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        elif a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`;
  const ambiguous = trace(ambiguousCode);
  assert.equal(ambiguous.ambiguous, true); assert(ambiguous.ambiguousKinds.includes("array"));
  const ambiguousView = convertBinarySearchTrace(ambiguous);
  assert.equal(ambiguousView.mode, "final"); assert.equal(ambiguousView.content.steps.length, 1);
  assert.deepEqual(plain(ambiguousView.content.steps[0].canvas.state.values), plain(d1.args[0]));
  assert.equal(ambiguousView.content.steps[0].canvas.state.lo, null);
  // ---- lo・hi・mid を使わない実装（線形探索・別名・再帰）は最終状態表示へ落とす ----
  const linear = trace(`def binary_search(values, target):
    for k in range(len(values)):
        if values[k] == target:
            return k
    return -1`);
  assert.equal(convertBinarySearchTrace(linear).mode, "final");
  const renamed = trace(code.replaceAll("lo", "left").replaceAll("hi", "right").replaceAll("mid", "center"));
  assert.equal(convertBinarySearchTrace(renamed).mode, "final");
  const recursive = trace(`def binary_search(values, target):
    def go(lo, hi):
        if lo > hi:
            return -1
        mid = (lo + hi) // 2
        if values[mid] == target:
            return mid
        if values[mid] < target:
            return go(mid + 1, hi)
        return go(lo, mid - 1)
    return go(0, len(values) - 1)`);
  assert.equal(convertBinarySearchTrace(recursive).mode, "final", "Nested frames are not part of the root trace");
  // ---- キャンバス描画: バーの本数・状態・発見の強調が図に出る ----
  const { renderToStaticMarkup } = require("react-dom/server"), { createElement } = require("react");
  const { BinarySearchExecutionCanvas } = load(`${root}/binary-search/execution/BinarySearchExecutionCanvas.tsx`);
  const probeHtml = renderToStaticMarkup(createElement(BinarySearchExecutionCanvas, { canvas: playback.content.steps[2].canvas }));
  assert.equal((probeHtml.match(/data-array-bar=/g) || []).length, 7);
  assert(probeHtml.includes('data-array-status="processing"'), "The centre bar is marked as processing");
  const foundHtml = renderToStaticMarkup(createElement(BinarySearchExecutionCanvas, { canvas: playback.content.steps[9].canvas }));
  assert(foundHtml.includes("data-array-highlight="), "The found position keeps its emphasis ring");
  // ---- 取得はD1だけを新しいWorkerへ送る ----
  let disposed = false, prepared = false, calls = 0;
  runner.disposePyodideRunner = () => { disposed = true; };
  runner.preparePyodide = async () => { assert(disposed); prepared = true; };
  runner.tracePythonFunction = async options => {
    calls++; assert(prepared); assert.equal(options.code, "current editor code"); assert.equal(options.functionName, "binary_search");
    assert.deepEqual(plain(options.args), plain(d1.args)); assert.equal(options.maxEvents, 500);
    assert(!("tests" in options)); assert(!("expected" in options)); return { trace: ambiguous };
  };
  assert.equal(await traceBinarySearchCode("current editor code"), ambiguous);
  await assert.rejects(() => traceBinarySearchCode("cancelled", () => false), /cancelled/);
  assert.equal(calls, 1, "An unmounted owner cannot start a later trace request");
  // ---- ソースpin: 変換は教材の正準データを流用して状態を作らない ----
  const convertSource = fs.readFileSync(`${root}/binary-search/trace/convertTrace.ts`, "utf8");
  assert(!convertSource.includes("binarySearchExecutionContent"), "converter must not substitute canonical phase-2 data");
  assert(!convertSource.includes("binarySearchProbes"), "converter must not re-run the reference procedure");
  console.log("Binary-search trace: harness passthrough addition with no leakage into existing units, canonical phase-2 board/caption equality, copied snapshots, reversed-search and lo=mid replays, midway error stop line, undrawable-board partial notice, truncation, syntax fallback, ambiguous final-only mode, non-lo/hi/mid implementations final-only, canvas rendering and isolated D1-only acquisition passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
