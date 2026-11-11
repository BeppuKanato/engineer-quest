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
const { greedyCoinsCodeSource } = load(`${root}/greedy-coins/code-mapping/greedyCoinsCode.ts`);
const { greedyCoinsImplementationContent } = load(`${root}/greedy-coins/implementation/implementation.content.ts`);
const { greedyCoinsExecutionContent } = load(`${root}/greedy-coins/execution/execution.content.ts`);
const { convertGreedyCoinsTrace } = load(`${root}/greedy-coins/trace/convertTrace.ts`);
const { traceGreedyCoinsCode, greedyCoinsTraceEventLimit } = load(`${root}/greedy-coins/trace/acquireTrace.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const plain = value => JSON.parse(JSON.stringify(value));
const code = greedyCoinsCodeSource;
const d1 = greedyCoinsImplementationContent.tests.find(test => test.id === "D1");
const projected = canvas => ({
  coins: canvas.state.coins, coinStatuses: canvas.state.coinStatuses, amount: canvas.state.amount,
  remaining: canvas.state.remaining, tray: canvas.state.tray, selectedCoin: canvas.state.selectedCoin,
  highlights: canvas.highlights,
});
(async () => {
  const { buildPythonTraceHarness } = await import(pathToFileURL(path.resolve(__dirname, "../public/python-trace-harness.mjs")));
  function trace(source, functionName = "greedy_coins", args = d1.args, maxEvents = greedyCoinsTraceEventLimit) {
    const harness = buildPythonTraceHarness({ code: source, functionName, args, maxEvents });
    const result = spawnSync(process.env.PYTHON || "python3", ["-c", "import ast,sys\ntree=ast.parse(sys.stdin.read())\nexec(compile(ast.Module(body=tree.body[:-1],type_ignores=[]),'<harness>','exec'))\nprint(eval(compile(ast.Expression(tree.body[-1].value),'<harness>','eval')))"], { input: harness, encoding: "utf8", timeout: 10000 });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  }
  // ---- ハーネス加算: 貪欲法の変数が記録され、既存単元のコードには何も混入しない ----
  const normal = trace(code);
  assert.equal(normal.status, "returned");
  assert.deepEqual(plain(normal.result), [500, 100, 100, 50, 10, 10, 10, 5, 1]);
  assert.equal(normal.ambiguous, false);
  assert(normal.events.some(event => event.locals.remaining === 286 && event.locals.coin === 500 && event.locals.amount === 786 && Array.isArray(event.locals.array)),
    "harness records remaining, coin, amount and the result list");
  const { binarySearchCodeSource } = load(`${root}/binary-search/code-mapping/binarySearchCode.ts`);
  const binaryArgs = load(`${root}/binary-search/implementation/implementation.content.ts`).binarySearchImplementationContent.tests.find(test => test.id === "D1").args;
  const binary = trace(binarySearchCodeSource, "binary_search", binaryArgs);
  assert.equal(binary.status, "returned");
  assert(binary.events.every(event => !("remaining" in event.locals) && !("coin" in event.locals) && !("amount" in event.locals)),
    "The added passthrough records nothing for units without those variable names");
  assert(binary.events.some(event => typeof event.locals.lo === "number" && Array.isArray(event.locals.array)),
    "Existing passthrough entries are unchanged");
  // ---- 正解コード: フェーズ2の正準11コマと盤面・キャプションまで一致する ----
  const playback = convertGreedyCoinsTrace(normal);
  assert.equal(playback.mode, "replay");
  assert.equal(playback.notice, null);
  assert.equal(greedyCoinsExecutionContent.steps.length, 11, "phase 2 canonical sequence has 11 steps");
  assert.deepEqual(plain(playback.content.steps.map(step => projected(step.canvas))),
    plain(greedyCoinsExecutionContent.steps.map(step => projected(step.canvas))),
    "Trace must equal the canonical phase-2 board sequence");
  assert.deepEqual(plain(playback.content.steps.map(step => step.caption)),
    plain(greedyCoinsExecutionContent.steps.map(step => step.caption)),
    "Trace captions must equal the canonical phase-2 captions");
  for (let index = 1; index < playback.content.steps.length; index++) {
    assert.notDeepEqual(projected(playback.content.steps[index - 1].canvas), projected(playback.content.steps[index].canvas), "No consecutive duplicate boards");
  }
  // スナップショットはコピーであり、過去イベントの書き換えが後続へ波及しない。
  const copiedIndex = normal.events.findIndex(event => event.locals.array?.length);
  assert(copiedIndex >= 0);
  normal.events[copiedIndex].locals.array.push(999);
  assert(!normal.events.slice(copiedIndex + 1).some(event => event.locals.array?.includes(999)), "Snapshot values are copies");
  // ---- 500円を飛ばす誤った選択も、正しい選択へ差し替えずそのまま再生する ----
  const smallestFirst = trace(`def greedy_coins(amount, coins):
    result = []
    remaining = amount
    for coin in coins:
        if coin == 500:
            continue
        while remaining >= coin:
            result.append(coin)
            remaining -= coin
    return result`);
  assert.equal(smallestFirst.status, "returned");
  const smallestView = convertGreedyCoinsTrace(smallestFirst);
  assert.equal(smallestView.mode, "replay");
  assert.equal(smallestView.content.steps[1].canvas.state.selectedCoin, 100, "The wrong first selection is replayed as executed");
  assert(smallestView.content.steps.at(-1).caption.includes("払えました"), "A completed payment still ends as a summary");
  // ---- 途中のエラーは停止行・種別だけを示し、本文は出さない ----
  const errorCode = `def greedy_coins(amount, coins):
    result = []
    remaining = amount
    for coin in coins:
        while remaining >= coin:
            result.append(coin)
            remaining -= coin
            if len(result) == 2:
                raise RuntimeError("PRIVATE_MIDWAY_MESSAGE")
    return result`;
  const midway = trace(errorCode);
  assert.equal(midway.status, "error"); assert.equal(midway.error.line, 9); assert.equal(midway.error.kind, "RuntimeError");
  assert(!JSON.stringify(midway).includes("PRIVATE_MIDWAY_MESSAGE"));
  const midwayView = convertGreedyCoinsTrace(midway);
  assert.equal(midwayView.mode, "replay");
  assert(midwayView.content.steps.at(-1).caption.includes("9行目"));
  assert.deepEqual(plain(midwayView.content.steps.at(-1).canvas.state.tray), [500, 100], "Selections confirmed before the error stay visible");
  // ---- トレイとして描けない並びが最後に現れたら、変換できた範囲までを途中表示として明示する ----
  const corruptCode = code.replace("    return result", "    result.append(999)\n    return result");
  const corruptView = convertGreedyCoinsTrace(trace(corruptCode));
  assert.equal(corruptView.mode, "replay");
  assert(corruptView.notice.includes("途中まで"));
  assert(!corruptView.content.steps.some(step => step.canvas.state.tray.includes(999)), "Undrawable boards never enter the replay");
  // ---- 打ち切り ----
  const loopCode = `def greedy_coins(amount, coins):
    result = []
    remaining = amount
    for coin in coins:
        while remaining >= coin:
            result.append(coin)
            remaining -= coin
            remaining += coin
            result.pop()
    return result`;
  const loop = trace(loopCode, "greedy_coins", d1.args, 40);
  assert.equal(loop.status, "truncated"); assert(loop.events.length <= 40); assert.equal(loop.eventCount, 40);
  const limited = convertGreedyCoinsTrace(loop);
  assert.equal(limited.mode, "replay");
  assert(limited.content.steps.at(-1).caption.includes("途中まで"));
  // ---- 構文エラーは最終状態表示へ落とす ----
  const syntax = trace("def greedy_coins(amount, coins)\n    pass");
  assert.equal(syntax.error.kind, "SyntaxError");
  assert.equal(convertGreedyCoinsTrace(syntax).mode, "final");
  // ---- 候補が曖昧なら推測せず最終状態だけを示す ----
  const ambiguousCode = `def greedy_coins(amount, coins):
    a = []
    b = []
    remaining = amount
    for coin in coins:
        while remaining >= coin:
            a.append(coin)
            remaining -= coin
    return a`;
  const ambiguous = trace(ambiguousCode);
  assert.equal(ambiguous.ambiguous, true); assert(ambiguous.ambiguousKinds.includes("array"));
  const ambiguousView = convertGreedyCoinsTrace(ambiguous);
  assert.equal(ambiguousView.mode, "final"); assert.equal(ambiguousView.content.steps.length, 1);
  // ---- remaining・coin を使わない実装（別名）は最終状態表示へ落とす ----
  const renamed = trace(code.replaceAll("remaining", "left")
    .replace("for coin in coins:", "for denom in coins:")
    .replace("while left >= coin:", "while left >= denom:")
    .replace("result.append(coin)", "result.append(denom)")
    .replace("left -= coin", "left -= denom"));
  const renamedView = convertGreedyCoinsTrace(renamed);
  assert.equal(renamedView.mode, "final", "Implementations without remaining/coin fall back to the final state");
  assert.deepEqual(plain(renamedView.content.steps[0].canvas.state.tray), plain(d1.expected), "The final state shows the returned tray");
  // ---- 盤面描画: 額面チップ・残額・トレイが図に出る ----
  const { renderToStaticMarkup } = require("react-dom/server"), { createElement } = require("react");
  const { GreedyCoinsExecutionCanvas } = load(`${root}/greedy-coins/execution/GreedyCoinsExecutionCanvas.tsx`);
  const firstHtml = renderToStaticMarkup(createElement(GreedyCoinsExecutionCanvas, { canvas: playback.content.steps[1].canvas }));
  assert.equal((firstHtml.match(/data-coin-chip=/g) || []).length, 6, "The figure shows the 6 denominations");
  assert.equal((firstHtml.match(/data-tray-coin=/g) || []).length, 1, "The tray shows the first selected coin");
  assert(firstHtml.includes('data-remaining="286"'), "The remaining amount is shown");
  assert(firstHtml.includes('data-coin-status="current"'), "The current denomination is marked as current");
  assert(firstHtml.includes('fill="#2563eb"'), "The current denomination renders in the processing blue");
  const summaryHtml = renderToStaticMarkup(createElement(GreedyCoinsExecutionCanvas, { canvas: playback.content.steps.at(-1).canvas }));
  assert.equal((summaryHtml.match(/data-tray-coin=/g) || []).length, 9, "The summary tray shows all 9 coins");
  // ---- 取得はD1だけを新しいWorkerへ送る ----
  let disposed = false, prepared = false, calls = 0;
  runner.disposePyodideRunner = () => { disposed = true; };
  runner.preparePyodide = async () => { assert(disposed); prepared = true; };
  runner.tracePythonFunction = async options => {
    calls++; assert(prepared); assert.equal(options.code, "current editor code"); assert.equal(options.functionName, "greedy_coins");
    assert.deepEqual(plain(options.args), plain(d1.args)); assert.equal(options.maxEvents, 500);
    assert(!("tests" in options)); assert(!("expected" in options)); return { trace: ambiguous };
  };
  assert.equal(await traceGreedyCoinsCode("current editor code"), ambiguous);
  await assert.rejects(() => traceGreedyCoinsCode("cancelled", () => false), /cancelled/);
  assert.equal(calls, 1, "An unmounted owner cannot start a later trace request");
  // ---- ソースpin: 変換は教材の正準データを流用して状態を作らない ----
  const convertSource = fs.readFileSync(`${root}/greedy-coins/trace/convertTrace.ts`, "utf8");
  assert(!convertSource.includes("greedyCoinsExecutionContent"), "converter must not substitute canonical phase-2 data");
  assert(!convertSource.includes("greedyCoinsSelections"), "converter must not re-run the reference procedure");
  console.log("Greedy-coins trace: harness passthrough addition with no leakage into existing units, canonical phase-2 board/caption equality, copied snapshots, wrong-selection replay, midway error stop line, undrawable-board partial notice, truncation, syntax fallback, ambiguous final-only mode, renamed-variable final-only, canvas rendering and isolated D1-only acquisition passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
