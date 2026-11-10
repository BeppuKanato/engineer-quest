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
const { wallExtensionCode, wallExtensionCodeLineNumber } = load(`${root}/wall-extension/code-mapping/wallExtensionCode.ts`);
const { wallExtensionImplementationContent } = load(`${root}/wall-extension/implementation/implementation.content.ts`);
const { wallExtensionExecutionContent } = load(`${root}/wall-extension/execution/execution.content.ts`);
const { convertWallExtensionTrace } = load(`${root}/wall-extension/trace/convertTrace.ts`);
const { traceWallExtensionCode, wallExtensionTraceEventLimit } = load(`${root}/wall-extension/trace/acquireTrace.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const plain = value => JSON.parse(JSON.stringify(value));
const code = wallExtensionCode.lines.map(line => line.text).join("\n");
const d1 = wallExtensionImplementationContent.tests.find(test => test.id === "D1");
const wallsOf = canvas => [...canvas.state.walls].sort();
const dedupe = values => values.filter((value, index) => index === 0 || JSON.stringify(value) !== JSON.stringify(values[index - 1]));
// 再生が一致すべき正準列は、フェーズ2のコード対応ステップ（説明専用を除く）。
// 説明専用ステップの盤面（仮定・別解）は実行からは生まれない（#314）。
const { codeMappedSteps } = load(`${root}/player/content.types.ts`);
const expectedSequence = dedupe(plain(codeMappedSteps(wallExtensionExecutionContent).map(step => wallsOf(step.canvas))));
(async () => {
  const { buildPythonTraceHarness } = await import(pathToFileURL(path.resolve(__dirname, "../public/python-trace-harness.mjs")));
  function trace(source, maxEvents = wallExtensionTraceEventLimit) {
    const harness = buildPythonTraceHarness({ code: source, functionName: "generate_maze", args: d1.args, maxEvents });
    const result = spawnSync(process.env.PYTHON || "python3", ["-c", "import ast,sys\ntree=ast.parse(sys.stdin.read())\nexec(compile(ast.Module(body=tree.body[:-1],type_ignores=[]),'<harness>','exec'))\nprint(eval(compile(ast.Expression(tree.body[-1].value),'<harness>','eval')))"], { input: harness, encoding: "utf8", timeout: 10000 });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  }
  // 参照コード: 戻り値がD1の期待グリッドと一致し、再生の壁列がフェーズ2の正準列と一致する。
  const normal = trace(code);
  assert.equal(normal.status, "returned"); assert.deepEqual(normal.result, plain(d1.expected));
  const playback = convertWallExtensionTrace(normal);
  assert.equal(playback.mode, "replay"); assert.equal(playback.notice, null);
  assert.deepEqual(dedupe(plain(playback.content.steps.map(step => wallsOf(step.canvas)))), expectedSequence,
    "Normalized trace must equal the canonical phase-2 wall sequence");
  assert(playback.content.steps.at(-1).caption.includes("実行が終わりました"));
  const extensionSteps = playback.content.steps.filter(step => step.canvas.state.processing !== null);
  assert.equal(extensionSteps.length, 9, "Each of the 9 extensions marks its pillar as processing");
  for (const step of extensionSteps) {
    assert.equal(step.canvas.highlights.length, 1);
    const [hx, hy] = step.canvas.highlights[0].id.split(",").map(Number);
    const [px, py] = step.canvas.state.processing.split(",").map(Number);
    assert.equal(Math.abs(hx - px) + Math.abs(hy - py), 1, "Highlighted cell is adjacent to the processing pillar");
    assert(step.canvas.state.walls.includes(step.canvas.highlights[0].id));
  }
  // スナップショットはコピーであり、過去イベントの書き換えが後続へ波及しない。
  const copiedIndex = normal.events.findIndex(event => event.locals.grid?.some(row => row.some(cell => cell === 1)));
  assert(copiedIndex >= 0);
  normal.events[copiedIndex].locals.grid[0][0] = 99;
  assert(!normal.events.slice(copiedIndex + 1).some(event => event.locals.grid?.some(row => row.some(cell => cell === 99))), "Snapshot values are copies");
  // 盤面変数を改名しても形で検出して再生できる。
  const renamed = convertWallExtensionTrace(trace(code.replace(/\bgrid\b/gu, "board")));
  assert.equal(renamed.mode, "replay");
  assert.deepEqual(dedupe(plain(renamed.content.steps.map(step => wallsOf(step.canvas)))), expectedSequence);
  // 誤った方向の対応（down の移動量の符号違い）は、そのままの盤面で再生する（正しい迷路へ差し替えない）。
  const wrong = trace(code.replace('"down": (0, 1)', '"down": (0, -1)'));
  const wrongView = convertWallExtensionTrace(wrong);
  assert.equal(wrongView.mode, "replay");
  assert.notDeepEqual(wallsOf(wrongView.content.steps.at(-1).canvas), expectedSequence.at(-1), "Replay the learner's wrong maze instead of substituting the correct one");
  // 途中のエラー: 停止行と種別だけを示し、生の例外本文は含めない。
  const writeLine = wallExtensionCodeLineNumber("write-wall");
  const midway = trace(code.replace("        grid[y + dy][x + dx] = 1", '        raise RuntimeError("PRIVATE_MIDWAY_MESSAGE")'));
  assert.equal(midway.status, "error"); assert.equal(midway.error.line, writeLine); assert.equal(midway.error.kind, "RuntimeError");
  const midwayView = convertWallExtensionTrace(midway);
  assert.equal(midwayView.mode, "replay");
  assert(midwayView.content.steps.at(-1).caption.includes(`${writeLine}行目`));
  assert(!JSON.stringify(midway).includes("PRIVATE_MIDWAY_MESSAGE"));
  // 盤面を補助関数の中でだけ作るコードは再生せず、最終状態（戻り値の盤面）だけを表示する。
  const helper = code.replace("def generate_maze(size, choices):", "def build_maze(size, choices):") +
    "\ndef generate_maze(size, choices):\n    return build_maze(size, choices)";
  const helperTrace = trace(helper);
  assert.deepEqual(helperTrace.result, plain(d1.expected));
  const final = convertWallExtensionTrace(helperTrace);
  assert.equal(final.mode, "final"); assert.equal(final.content.steps.length, 1); assert(final.notice.includes("結果だけ"));
  assert.deepEqual(wallsOf(final.content.steps[0].canvas), expectedSequence.at(-1));
  assert.equal(final.content.steps[0].canvas.highlights.length, 0, "Final-only output does not invent a highlight");
  // 構文エラーは最終状態表示へ落ち、盤面は捏造しない。
  const syntax = trace("def generate_maze(size, choices)\n    pass");
  assert.equal(syntax.error.kind, "SyntaxError"); assert.equal(convertWallExtensionTrace(syntax).mode, "final");
  assert.equal(convertWallExtensionTrace(syntax).content.steps[0].canvas.state.walls.length, 0);
  // 形の候補が複数ある場合は推測せず最終状態だけにする。
  const ambiguousSource = "def generate_maze(size, choices):\n    board = [[0] * size for _ in range(size)]\n    other = [[0] * size for _ in range(size)]\n    board[0][0] = 1\n    return board";
  const ambiguous = trace(ambiguousSource);
  assert.equal(ambiguous.ambiguous, true); assert.equal(convertWallExtensionTrace(ambiguous).mode, "final", "Ambiguous candidates must not produce even a guessed partial replay");
  // 末尾だけ描けない盤面（行を足して形が崩れる）場合は、描けたところまでを部分再生として明示する。
  const tail = trace(code.replace("    return grid", "    grid.append([0] * size)\n    return grid"));
  const partial = convertWallExtensionTrace(tail);
  assert.equal(partial.mode, "replay"); assert(partial.notice.includes("途中まで"));
  assert(partial.content.steps.at(-1).caption.includes("途中まで"));
  assert.deepEqual(dedupe(plain(partial.content.steps.map(step => wallsOf(step.canvas)))), expectedSequence);
  // 打ち切り: 盤面を用意した後の無限ループは途中まで表示になる。
  const loop = trace("def generate_maze(size, choices):\n    grid = [[0] * size for _ in range(size)]\n    while True:\n        pass", 20);
  assert.equal(loop.status, "truncated"); assert(loop.events.length <= 20);
  const limited = convertWallExtensionTrace(loop);
  assert.equal(limited.mode, "replay"); assert(limited.content.steps.at(-1).caption.includes("途中まで"));
  // 実描画: 最終ステップの盤面が全マス分のセルで描ける。
  const { renderToStaticMarkup } = require("react-dom/server"), { createElement } = require("react");
  const { WallExtensionExecutionCanvas } = load(`${root}/wall-extension/execution/WallExtensionExecutionCanvas.tsx`);
  const html = renderToStaticMarkup(createElement(WallExtensionExecutionCanvas, { canvas: playback.content.steps.at(-1).canvas }));
  assert.equal((html.match(/data-maze-cell=/g) || []).length, 81);
  assert.equal((html.match(/data-maze-wall=/g) || []).length, expectedSequence.at(-1).length);
  // 取得経路: 新しいWorkerへD1の引数だけを送り、判定用情報は送らない。キャンセル時は開始しない。
  let disposed = false, prepared = false, calls = 0;
  runner.disposePyodideRunner = () => { disposed = true; };
  runner.preparePyodide = async () => { assert(disposed); prepared = true; };
  runner.tracePythonFunction = async options => {
    calls++; assert(prepared); assert.equal(options.code, "current editor code"); assert.equal(options.functionName, "generate_maze");
    assert.deepEqual(plain(options.args), plain(d1.args)); assert.equal(options.maxEvents, 500);
    assert(!("tests" in options)); assert(!("expected" in options)); return { trace: helperTrace };
  };
  assert.equal(await traceWallExtensionCode("current editor code"), helperTrace);
  await assert.rejects(() => traceWallExtensionCode("cancelled", () => false), /cancelled/);
  assert.equal(calls, 1, "An unmounted owner cannot start a later trace request");
  // 画面接続のピン: フェーズ7画面がダイアログと取得・変換を使う。
  const preview = fs.readFileSync(`${root}/wall-extension/implementation/WallExtensionImplementationPreview.tsx`, "utf8");
  assert(preview.includes("WallExtensionTraceDialog")); assert(preview.includes("traceWallExtensionCode")); assert(preview.includes("convertWallExtensionTrace"));
  const traceText = fs.readFileSync(`${root}/wall-extension/trace/trace.content.ts`, "utf8");
  assert(traceText.includes("盤面で動きを見る"));
  console.log("Wall-extension trace: CPython harness grid detection, canonical phase-2 wall sequence, renamed grid, wrong-maze fidelity, midway error/stop line, helper-built final-only fallback, syntax error, ambiguity, invalid tail partial replay, truncation, real rendering and isolated D1-only acquisition passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
