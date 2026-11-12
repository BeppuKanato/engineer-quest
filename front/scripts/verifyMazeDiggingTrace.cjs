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
    if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
    const base = name.startsWith("@/") ? path.resolve(__dirname, "../src", name.slice(2)) : path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename }); return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const { mazeDiggingCodeLineNumber, mazeDiggingCodeSource } = load(`${root}/units/maze-digging/code-mapping/mazeDiggingCode.ts`);
const { mazeDiggingImplementationContent } = load(`${root}/units/maze-digging/implementation/implementation.content.ts`);
const { mazeDiggingExecutionContent } = load(`${root}/units/maze-digging/execution/execution.content.ts`);
const { codeMappedSteps } = load(`${root}/player/content.types.ts`);
const { convertMazeDiggingTrace } = load(`${root}/units/maze-digging/trace/convertTrace.ts`);
const { traceMazeDiggingCode, mazeDiggingTraceEventLimit } = load(`${root}/units/maze-digging/trace/acquireTrace.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const plain = value => JSON.parse(JSON.stringify(value));
const code = mazeDiggingCodeSource;
const d1 = mazeDiggingImplementationContent.tests.find(test => test.id === "D1");
const frameOf = step => ({
  walls: [...step.canvas.state.walls].sort(),
  processing: step.canvas.state.processing,
  path: [...step.canvas.state.path],
  highlights: step.canvas.highlights.map(highlight => highlight.id),
  start: step.canvas.state.start,
  goal: step.canvas.state.goal,
});
// トレース再生が対応するのはコード対応ステップだけ（説明専用ステップは実行に対応しない）。
const expectedFrames = plain(codeMappedSteps(mazeDiggingExecutionContent).map(frameOf));
const wallsOf = canvas => [...canvas.state.walls].sort();
const dedupe = values => values.filter((value, index) => index === 0 || JSON.stringify(value) !== JSON.stringify(values[index - 1]));
const expectedWallSequence = dedupe(plain(codeMappedSteps(mazeDiggingExecutionContent).map(step => wallsOf(step.canvas))));
(async () => {
  const { buildPythonTraceHarness } = await import(pathToFileURL(path.resolve(__dirname, "../public/python-trace-harness.mjs")));
  function trace(source, maxEvents = mazeDiggingTraceEventLimit) {
    const harness = buildPythonTraceHarness({ code: source, functionName: "dig_maze", args: d1.args, maxEvents });
    const result = spawnSync(process.env.PYTHON || "python3", ["-c", "import ast,sys\ntree=ast.parse(sys.stdin.read())\nexec(compile(ast.Module(body=tree.body[:-1],type_ignores=[]),'<harness>','exec'))\nprint(eval(compile(ast.Expression(tree.body[-1].value),'<harness>','eval')))"], { input: harness, encoding: "utf8", timeout: 10000 });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  }
  // 参照コード: 戻り値がD1の期待グリッドと一致し、再生がフェーズ2の正準フレーム列（盤面・処理中・経路・highlight・旗）と一致する。
  const normal = trace(code);
  assert.equal(normal.status, "returned"); assert.deepEqual(normal.result, plain(d1.expected));
  const playback = convertMazeDiggingTrace(normal);
  assert.equal(playback.mode, "replay"); assert.equal(playback.notice, null);
  assert.equal(playback.content.steps.length, 21, "setup + start room + 15 digs + 3 backtracks + complete");
  assert.deepEqual(plain(playback.content.steps.map(frameOf)), expectedFrames,
    "Trace playback must equal the canonical phase-2 frames");
  assert(playback.content.steps.at(-1).caption.includes("実行が終わりました"));
  const backtrackSteps = playback.content.steps.filter(step => step.caption.includes("行き止まり"));
  assert.equal(backtrackSteps.length, 3, "Each of the 3 backtracks becomes its own step");
  // スナップショットはコピーであり、過去イベントの書き換えが後続へ波及しない。
  const copiedIndex = normal.events.findIndex(event => event.locals.grid?.some(row => row.some(cell => cell === 1)));
  assert(copiedIndex >= 0);
  normal.events[copiedIndex].locals.grid[0][0] = 99;
  assert(!normal.events.slice(copiedIndex + 1).some(event => event.locals.grid?.some(row => row.some(cell => cell === 99))), "Snapshot values are copies");
  // 盤面変数を改名しても形で検出して再生できる。
  const renamed = convertMazeDiggingTrace(trace(code.replace(/\bgrid\b/gu, "board")));
  assert.equal(renamed.mode, "replay");
  assert.deepEqual(plain(renamed.content.steps.map(frameOf)), expectedFrames);
  // 間の壁を掘らない誤りは、そのままの盤面で再生する（正しい迷路へ差し替えない）。
  const wrong = trace(code.replace("            grid[(y + ny) // 2][(x + nx) // 2] = 0", "            pass"));
  assert.equal(wrong.status, "returned");
  const wrongView = convertMazeDiggingTrace(wrong);
  assert.equal(wrongView.mode, "replay");
  assert.notDeepEqual(wallsOf(wrongView.content.steps.at(-1).canvas), expectedWallSequence.at(-1), "Replay the learner's wrong maze instead of substituting the correct one");
  // 途中のエラー: 停止行と種別だけを示し、生の例外本文は含めない。
  const digRoomLine = mazeDiggingCodeLineNumber("dig-room");
  const midway = trace(code.replace("            grid[ny][nx] = 0", '            raise RuntimeError("PRIVATE_MIDWAY_MESSAGE")'));
  assert.equal(midway.status, "error"); assert.equal(midway.error.line, digRoomLine); assert.equal(midway.error.kind, "RuntimeError");
  const midwayView = convertMazeDiggingTrace(midway);
  assert.equal(midwayView.mode, "replay");
  assert(midwayView.content.steps.at(-1).caption.includes(`${digRoomLine}行目`));
  assert(!JSON.stringify(midway).includes("PRIVATE_MIDWAY_MESSAGE"));
  // 盤面を補助関数の中でだけ作るコードは再生せず、最終状態（戻り値の盤面）だけを表示する。
  const helper = code.replace("def dig_maze(size, choices):", "def build_maze(size, choices):") +
    "\ndef dig_maze(size, choices):\n    return build_maze(size, choices)";
  const helperTrace = trace(helper);
  assert.deepEqual(helperTrace.result, plain(d1.expected));
  const final = convertMazeDiggingTrace(helperTrace);
  assert.equal(final.mode, "final"); assert.equal(final.content.steps.length, 1); assert(final.notice.includes("結果だけ"));
  assert.deepEqual(wallsOf(final.content.steps[0].canvas), expectedWallSequence.at(-1));
  assert.equal(final.content.steps[0].canvas.highlights.length, 0, "Final-only output does not invent a highlight");
  // 構文エラーは最終状態表示へ落ち、盤面は捏造しない。
  const syntax = trace("def dig_maze(size, choices)\n    pass");
  assert.equal(syntax.error.kind, "SyntaxError"); assert.equal(convertMazeDiggingTrace(syntax).mode, "final");
  assert.equal(convertMazeDiggingTrace(syntax).content.steps[0].canvas.state.walls.length, 0);
  // 形の候補が複数ある場合は推測せず最終状態だけにする。
  const ambiguousSource = "def dig_maze(size, choices):\n    board = [[1] * size for _ in range(size)]\n    other = [[1] * size for _ in range(size)]\n    board[1][1] = 0\n    return board";
  const ambiguous = trace(ambiguousSource);
  assert.equal(ambiguous.ambiguous, true); assert.equal(convertMazeDiggingTrace(ambiguous).mode, "final", "Ambiguous candidates must not produce even a guessed partial replay");
  // 末尾だけ描けない盤面（行を足して形が崩れる）場合は、描けたところまでを部分再生として明示する。
  const tail = trace(code.replace("    return grid", "    grid.append([0] * size)\n    return grid"));
  const partial = convertMazeDiggingTrace(tail);
  assert.equal(partial.mode, "replay"); assert(partial.notice.includes("途中まで"));
  assert(partial.content.steps.at(-1).caption.includes("途中まで"));
  assert.deepEqual(dedupe(plain(partial.content.steps.map(step => wallsOf(step.canvas)))), expectedWallSequence);
  // 打ち切り: 盤面を用意した後の無限ループは途中まで表示になる。
  const loop = trace("def dig_maze(size, choices):\n    grid = [[1] * size for _ in range(size)]\n    while True:\n        pass", 20);
  assert.equal(loop.status, "truncated"); assert(loop.events.length <= 20);
  const limited = convertMazeDiggingTrace(loop);
  assert.equal(limited.mode, "replay"); assert(limited.content.steps.at(-1).caption.includes("途中まで"));
  // 実描画: 最終ステップの盤面が全マス分のセルで描ける。
  const { renderToStaticMarkup } = require("react-dom/server"), { createElement } = require("react");
  const { MazeDiggingExecutionCanvas } = load(`${root}/units/maze-digging/execution/MazeDiggingExecutionCanvas.tsx`);
  const html = renderToStaticMarkup(createElement(MazeDiggingExecutionCanvas, { canvas: playback.content.steps.at(-1).canvas }));
  assert.equal((html.match(/data-maze-cell=/g) || []).length, 81);
  assert.equal((html.match(/data-maze-wall=/g) || []).length, expectedWallSequence.at(-1).length);
  // 取得経路: 新しいWorkerへD1の引数だけを送り、判定用情報は送らない。キャンセル時は開始しない。
  let disposed = false, prepared = false, calls = 0;
  runner.disposePyodideRunner = () => { disposed = true; };
  runner.preparePyodide = async () => { assert(disposed); prepared = true; };
  runner.tracePythonFunction = async options => {
    calls++; assert(prepared); assert.equal(options.code, "current editor code"); assert.equal(options.functionName, "dig_maze");
    assert.deepEqual(plain(options.args), plain(d1.args)); assert.equal(options.maxEvents, mazeDiggingTraceEventLimit);
    assert(!("tests" in options)); assert(!("expected" in options)); return { trace: helperTrace };
  };
  assert.equal(await traceMazeDiggingCode("current editor code"), helperTrace);
  await assert.rejects(() => traceMazeDiggingCode("cancelled", () => false), /cancelled/);
  assert.equal(calls, 1, "An unmounted owner cannot start a later trace request");
  // 画面接続のピン: フェーズ7画面がダイアログと取得・変換を使う。
  const preview = fs.readFileSync(`${root}/units/maze-digging/implementation/MazeDiggingImplementationPreview.tsx`, "utf8");
  assert(preview.includes("MazeDiggingTraceDialog")); assert(preview.includes("traceMazeDiggingCode")); assert(preview.includes("convertMazeDiggingTrace"));
  const traceText = fs.readFileSync(`${root}/units/maze-digging/trace/trace.content.ts`, "utf8");
  assert(traceText.includes("盤面で掘る様子を見る"));
  console.log("Maze-digging trace: CPython harness grid detection, canonical phase-2 frame sequence (digs and backtracks), renamed grid, wrong-maze fidelity, midway error/stop line, helper-built final-only fallback, syntax error, ambiguity, invalid tail partial replay, truncation, real rendering and isolated D1-only acquisition passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
