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
const { wallExtensionImplementationContent: content } = load(`${root}/wall-extension/implementation/implementation.content.ts`);
const { wallExtensionCode, wallExtensionCodeSource } = load(`${root}/wall-extension/code-mapping/wallExtensionCode.ts`);
const { wallExtensionConsolidationContent } = load(`${root}/wall-extension/consolidation/consolidation.content.ts`);
const { wallExtensionExecutionContent } = load(`${root}/wall-extension/execution/execution.content.ts`);
const { ImplementationResults } = load(`${root}/wall-extension/implementation/ImplementationResults.tsx`);
const { ImplementationHints } = load(`${root}/wall-extension/implementation/ImplementationHints.tsx`);
const { FreeExecutionConsole } = load(`${root}/wall-extension/implementation/FreeExecutionConsole.tsx`);
const { ParsonsBoard } = load(`${root}/bfs/consolidation/ParsonsBoard.tsx`);
const {
  recordHintUsage, resultKinds, classifyExecutionError, runningMessage, allTestsPassed, runImplementationTests,
  isMazeGridValue, mazeGridCanvas, gridDifferences,
} = load(`${root}/wall-extension/implementation/implementation.ts`);
const { freeDisplayCase, runWallExtensionFreeCode } = load(`${root}/wall-extension/implementation/freeExecution.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const plain = value => JSON.parse(JSON.stringify(value));

// ---- コンテンツの基本契約 ----
assert.equal(content.id, "wall-extension-implementation"); assert.equal(content.phase, 7); assert.equal(content.version, 1);
assert.match(content.template, /^def generate_maze\(size, choices\):\n/u);
assert.match(content.template, /directions = \{"up": \(0, -1\), "down": \(0, 1\), "left": \(-1, 0\), "right": \(1, 0\)\}/u);
assert.match(content.template, /\n +pass$/u);
assert.equal(wallExtensionCode.id, "wall-extension-v1"); assert.equal(wallExtensionCode.version, 1);
assert.deepEqual(plain(content.hints.skeletonLineIds), ["for-pillar-row", "for-pillar-column", "if-first-row"]);
content.hints.skeletonLines.forEach((line, index) => assert.equal(line, wallExtensionCode.lines.find(line => line.id === content.hints.skeletonLineIds[index])));
assert.equal(content.hints.labels.length, 4);
assert.deepEqual(plain(content.hints.flow), ["外周を壁にする", "2マスおきに柱を立てる", "柱ごとに許される方向から1つ選び、隣のマスを壁にする"]);
assert.equal(new Set(content.hints.tokens).size, content.hints.tokens.length);
assert.equal(content.hints.parsonsQuestion, wallExtensionConsolidationContent.questions.find(question => question.kind === "parsons"));
for (const file of fs.readdirSync(`${root}/wall-extension/implementation`).filter(file => /\.tsx?$/u.test(file))) {
  assert(!/codeDiff|diffLines|from ["']diff["']|diffTitle|referenceCode/u.test(fs.readFileSync(`${root}/wall-extension/implementation/${file}`, "utf8")), "No diff hint dependency remains in the feature");
}

// ---- テストの入力は基準データの確定値 ----
assert.deepEqual(plain(content.tests.map(test => test.id)), ["D1", "D2", "J1", "J2", "J3"]);
assert.deepEqual(plain(content.tests.map(test => test.visibility)), ["display", "display", "judgement", "judgement", "judgement"]);
assert.deepEqual(plain(content.tests.map(test => plain(test.args))), [
  [9, [3, 1, 2, 0, 2, 0, 2, 2, 0]],
  [7, [1, 2, 2, 0]],
  [9, [0, 3, 1, 2, 0, 1, 1, 0, 2]],
  [7, [0, 1, 1, 2]],
  [11, [0, 1, 2, 3, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0]],
]);
for (const test of content.tests) assert.equal(test.functionName, "generate_maze");

// ---- 期待グリッドを基準データの規則から独立に再計算し、完全迷路の性質を確認 ----
function generateExpected(size, choices) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0));
  for (let i = 0; i < size; i++) { grid[0][i] = 1; grid[size - 1][i] = 1; grid[i][0] = 1; grid[i][size - 1] = 1; }
  const pillars = [];
  for (let y = 2; y < size - 1; y += 2) for (let x = 2; x < size - 1; x += 2) { grid[y][x] = 1; pillars.push([x, y]); }
  const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  pillars.forEach(([x, y], index) => {
    const allowed = y === 2 ? ["up", "down", "left", "right"] : ["down", "left", "right"];
    const [dx, dy] = dirs[allowed[choices[index]]];
    assert.equal(grid[y + dy][x + dx], 0, `choice must not hit an existing wall (${x},${y})`);
    grid[y + dy][x + dx] = 1;
  });
  return grid;
}
function assertPerfectMaze(grid) {
  const size = grid.length;
  for (let i = 0; i < size; i++) {
    assert.equal(grid[0][i], 1); assert.equal(grid[size - 1][i], 1); assert.equal(grid[i][0], 1); assert.equal(grid[i][size - 1], 1);
  }
  let pillarCount = 0;
  for (let y = 2; y < size - 1; y += 2) for (let x = 2; x < size - 1; x += 2) { assert.equal(grid[y][x], 1, "pillar must be a wall"); pillarCount++; }
  const walls = grid.flat().reduce((sum, cell) => sum + cell, 0);
  assert.equal(walls, (4 * size - 4) + pillarCount * 2, "walls = border + pillars + one extension per pillar");
  const passages = [];
  grid.forEach((row, y) => row.forEach((cell, x) => { if (cell === 0) passages.push([x, y]); }));
  const seen = new Set([passages[0].join(",")]);
  const queue = [passages[0]];
  let edges = 0;
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size || grid[ny][nx] !== 0) continue;
      edges++;
      if (!seen.has(`${nx},${ny}`)) { seen.add(`${nx},${ny}`); queue.push([nx, ny]); }
    }
  }
  assert.equal(seen.size, passages.length, "all passages are connected");
  assert.equal(edges / 2, passages.length - 1, "passages form a tree (no loops)");
}
for (const test of content.tests) {
  const [size, choices] = plain(test.args);
  assert.deepEqual(generateExpected(size, choices), plain(test.expected), test.id);
  assertPerfectMaze(plain(test.expected));
}
// D1の期待グリッドはフェーズ2の完成盤面と一致する。
{
  const complete = wallExtensionExecutionContent.steps.find(step => step.id === "complete");
  assert(complete, "phase 2 complete step exists");
  const walls = new Set(complete.canvas.state.walls);
  const fromCanvas = Array.from({ length: 9 }, (_, y) => Array.from({ length: 9 }, (_, x) => (walls.has(`${x},${y}`) ? 1 : 0)));
  assert.deepEqual(fromCanvas, plain(content.tests[0].expected), "D1 matches the phase 2 completed board");
}

// ---- Python で参照コード・テンプレート・典型的な誤りを実行検証 ----
const variants = {
  reference: wallExtensionCodeSource,
  stepOne: wallExtensionCodeSource.split("range(2, size - 1, 2)").join("range(2, size - 1, 1)"),
  upSign: wallExtensionCodeSource.replace('"up": (0, -1)', '"up": (0, 1)'),
  alwaysFour: wallExtensionCodeSource.replace('allowed = ["down", "left", "right"]', 'allowed = ["up", "down", "left", "right"]'),
};
assert.notEqual(variants.stepOne, variants.reference); assert.notEqual(variants.upSign, variants.reference); assert.notEqual(variants.alwaysFour, variants.reference);
const python = spawnSync(process.env.PYTHON || "python3", ["-c", `
import ast, json, sys
data = json.load(sys.stdin)
ast.parse(data["template"])
def run(code):
    ns = {}
    exec(code, ns)
    out = {}
    for test in data["tests"]:
        try:
            out[test["id"]] = ns[test["functionName"]](*test["args"]) == test["expected"]
        except Exception:
            out[test["id"]] = False
    return out
print(json.dumps({name: run(code) for name, code in data["variants"].items()}))
`], {
  input: JSON.stringify({ template: content.template, tests: plain(content.tests), variants }), encoding: "utf8",
});
assert.equal(python.status, 0, python.stderr);
const results = JSON.parse(python.stdout);
assert.deepEqual(results.reference, { D1: true, D2: true, J1: true, J2: true, J3: true }, "reference code passes all five tests");
assert.equal(results.stepOne.D1, false, "pillar step 1 must fail");
assert.equal(results.upSign.D1, true); assert.equal(results.upSign.D2, true);
assert.equal(results.upSign.J1, false, "up-delta sign error must fail J1");
assert.equal(results.upSign.J2, false, "up-delta sign error must fail J2");
assert.equal(results.upSign.J3, false, "up-delta sign error must fail J3");
assert.equal(results.alwaysFour.D1, false, "allowing four directions below the first row must fail");

// ---- ヒント利用・エラー分類・進捗文言（BFSフェーズ7と同じ契約） ----
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
// ---- エラー行の抽出と表示（#325）: 行番号は学習者コード基準で持ち回り、表示と検証に使う ----
const { analyzeExecutionError, extractExecutionErrorLine } = load(path.resolve(root, "../../lib/executionError.ts"));
const syntaxTrace = ["Traceback (most recent call last):", '  File "<exec>", line 3, in <module>', '  File "<string>", line 2', "    def solve(a, b)", "                 ^", "SyntaxError: expected ':'"].join("\n");
assert.deepEqual(plain(analyzeExecutionError(new Error(syntaxTrace))), { kind: "syntax", line: 2 }, "syntax errors carry the learner line from the traceback");
const runtimeTrace = ["Traceback (most recent call last):", '  File "<exec>", line 12, in <module>', '  File "<string>", line 5, in solve', '  File "<string>", line 3, in helper', "NameError: name 'x' is not defined"].join("\n");
assert.deepEqual(plain(analyzeExecutionError(new Error(runtimeTrace))), { kind: "runtime", line: 3 }, "runtime errors use the deepest learner frame");
assert.deepEqual(plain(analyzeExecutionError(new Error('Traceback (most recent call last):\n  File "<exec>", line 8, in <module>\nNameError: HIDDEN'))), { kind: "runtime" }, "harness-only frames give no learner line");
assert.deepEqual(plain(analyzeExecutionError(new Error(timeoutMessage))), { kind: "timeout" }, "timeouts carry no line");
assert.equal(extractExecutionErrorLine("SyntaxError: no traceback"), undefined);
const { wallExtensionEditorText: editorText } = load(`${root}/wall-extension/implementation/editor.content.ts`);
const syntaxFreeHtml = renderToStaticMarkup(createElement(FreeExecutionConsole, {
  result: { stdout: "", outputTruncated: false, returned: false, error: "syntax", errorLine: 2 }, busy: false,
}));
assert(syntaxFreeHtml.includes(editorText.errors.syntax + "（2行目付近）"), "console error text names the learner line");
assert(syntaxFreeHtml.includes(editorText.syntaxNote), "syntax errors explain that not even print runs");
assert(syntaxFreeHtml.includes('data-free-error-line="2"'), "console exposes the error line");
const runtimeFreeHtml = renderToStaticMarkup(createElement(FreeExecutionConsole, {
  result: { stdout: "", outputTruncated: false, returned: false, error: "runtime" }, busy: false,
}));
assert(!runtimeFreeHtml.includes("行目付近"), "no line note when the line is unknown");
assert(!runtimeFreeHtml.includes(editorText.syntaxNote), "the nothing-runs note is syntax-only");
const lineSummaryHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [{ id: "D1", passed: false, error: "runtime", errorLine: 7 }] }));
assert(lineSummaryHtml.includes(content.display.messages.runtime + "（7行目付近）"), "test summary names the learner line");
assert(lineSummaryHtml.includes('data-error-line="7"'), "test summary exposes the error line");
const errorLinePreviewSource = fs.readFileSync(`${root}/wall-extension/implementation/WallExtensionImplementationPreview.tsx`, "utf8");
assert.match(errorLinePreviewSource, /useErrorLineDecoration/, "preview highlights the error line in the editor (#325)");
assert.match(errorLinePreviewSource, /setErrorLine\(undefined\)/, "changing code or rerunning clears the error line");
assert(fs.readFileSync(path.resolve(root, "../../app/globals.css"), "utf8").includes(".eq-error-line-highlight"), "the error line highlight has a global style");

assert.deepEqual(plain(resultKinds([{ id: "D1", passed: false }, { id: "D2", passed: false, error: "timeout" }])), ["timeout", "mismatch"]);
for (let done = 0; done < 5; done++) assert.equal(runningMessage(done, 5), `テストを実行中です（${done + 1}/5件目）`);
const passedOutcomes = content.tests.map(test => ({ id: test.id, passed: true }));
assert(allTestsPassed(content.tests, passedOutcomes)); assert(!allTestsPassed(content.tests, passedOutcomes.slice(1)));
assert(!allTestsPassed(content.tests, passedOutcomes.map(test => test.id === "J3" ? { ...test, passed: false } : test)));
assert(!allTestsPassed([], []));

// ---- 盤面ヘルパー ----
const d1Expected = plain(content.tests[0].expected);
assert(isMazeGridValue(d1Expected));
assert(!isMazeGridValue({ A: 0 })); assert(!isMazeGridValue([[0, 1], [1]])); assert(!isMazeGridValue([[0, 2], [1, 0]])); assert(!isMazeGridValue([]));
assert.deepEqual(plain(gridDifferences(d1Expected, d1Expected)), []);
const flipped = d1Expected.map(row => [...row]); flipped[1][1] = 1;
assert.deepEqual(plain(gridDifferences(d1Expected, flipped)), [{ x: 1, y: 1, expected: 0, actual: 1 }]);
assert.equal(gridDifferences(d1Expected, [[1]]), null, "different sizes are not cell differences");
assert.equal(gridDifferences(d1Expected, "not a grid"), null);
{
  const canvas = mazeGridCanvas(d1Expected, [{ x: 1, y: 1 }]);
  assert.equal(canvas.data.size, 9);
  assert.equal(canvas.state.walls.length, 50);
  assert(canvas.state.walls.includes("2,2") && canvas.state.walls.includes("3,2"), "pillars and extensions are walls");
  assert.deepEqual(plain(canvas.highlights), [{ kind: "cell", id: "1,1" }]);
}

// ---- 結果表示の描画契約 ----
const unchangedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [] }));
assert(!unchangedHtml.includes("data-error-kind"));
assert(unchangedHtml.includes(content.display.statuses.unexecuted.icon));
assert.equal((unchangedHtml.match(/<svg/g) || []).length, 2, "only the two display cases draw their expected mazes");
assert.equal((unchangedHtml.match(/data-maze-cell=/g) || []).length, 81 + 49);
assert(!unchangedHtml.includes("data-phase-result-check"), "unexecuted tests have no drawn check");
for (const test of content.tests) assert(!unchangedHtml.includes(`>${test.id} `), "Internal IDs stay out of visible headings");
for (const id of ["J1", "J2", "J3"]) {
  const item = unchangedHtml.match(new RegExp(`data-test-id="${id}"[\\s\\S]*?</li>`))[0];
  assert(!/期待する迷路|実際の迷路|data-maze-cell/u.test(item), "judgement cases show no input, expected or actual board");
}
const passedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: content.tests.map(test => ({ id: test.id, passed: true, actual: test.expected })) }));
assert(!passedHtml.includes("data-phase-result-check"), "result rows carry the text mark only; the drawn check belongs to the completion view");
assert.equal(passedHtml.split(content.display.statuses.passed.icon).length - 1, content.tests.length, "each passed test shows its text mark in the list");
assert(!passedHtml.includes("data-grid-different-count"), "matching boards report no different cells");
const mismatchedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [{ id: "D1", passed: false, actual: flipped }] }));
assert(mismatchedHtml.includes('data-grid-different-count="1"'));
assert(mismatchedHtml.includes('data-maze-highlight="1,1"'), "the different cell is framed on the actual board");
assert(mismatchedHtml.includes(content.display.statuses.failed.icon));
assert(!mismatchedHtml.includes("data-phase-result-check"), "failed tests have no drawn check");
const invalidHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [{ id: "D1", passed: false, actual: { PRIVATE_OUTPUT_SENTINEL: 9 } }] }));
assert(invalidHtml.includes(content.display.invalid));
assert(!invalidHtml.includes("PRIVATE_OUTPUT_SENTINEL"), "non-grid return values are never rendered raw");
assert.equal(typeof ImplementationHints, "function");
const review = renderToStaticMarkup(createElement(ParsonsBoard, { question: content.hints.parsonsQuestion, code: wallExtensionCode }));
assert.equal((review.match(/data-parsons-line-id=/g) || []).length, 21);
assert(!review.includes("この順序で回答する"), "Hint Parsons has no scoring action");

// ---- 試しに実行（D1）は戻り値の迷路を盤面で示す ----
assert.equal(freeDisplayCase, content.tests[0]);
const freeHtml = renderToStaticMarkup(createElement(FreeExecutionConsole, {
  result: { stdout: "", outputTruncated: false, returned: true, actual: content.tests[0].expected, error: null }, busy: false,
}));
assert(freeHtml.includes("data-free-return"));
assert.equal((freeHtml.match(/data-maze-cell=/g) || []).length, 81);
assert(!freeHtml.includes("data-grid-different-count"));
const freeMismatchHtml = renderToStaticMarkup(createElement(FreeExecutionConsole, {
  result: { stdout: "", outputTruncated: false, returned: true, actual: flipped, error: "mismatch" }, busy: false,
}));
assert(freeMismatchHtml.includes('data-grid-different-count="1"'));
assert(freeMismatchHtml.includes('data-free-error-kind="mismatch"'));

(async () => {
  // runImplementationTests: 例外後も続行し、判定用の値はUI状態へ渡さない。
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
  assert.equal(outcomes[1].errorLine, undefined, "label-only errors carry no line into outcomes");
  runner.runCourseMissionTests = async () => { throw new Error(runtimeTrace); };
  const tracedOutcomes = await runImplementationTests("learner code", content.tests.slice(0, 1), () => {});
  assert.equal(tracedOutcomes[0].error, "runtime"); assert.equal(tracedOutcomes[0].errorLine, 3, "test outcomes carry the learner line (#325)");
  assert(!JSON.stringify(outcomes.slice(2)).includes("HIDDEN"), "Judgement values never enter UI state");
  assert(!JSON.stringify(outcomes).includes("HIDDEN_EXCEPTION"));
  assert.equal(progress[0].length, 1, "Earlier progress snapshots stay unchanged");
  let active = true;
  const cancelled = await runImplementationTests("learner code", content.tests, () => { active = false; }, () => active);
  assert.equal(cancelled.length, 1, "Unmounting stops subsequent case requests");

  // 試しに実行: Workerを作り直し、D1だけで実行して戻り値をそのまま返す。
  let disposed = 0;
  runner.disposePyodideRunner = () => { disposed++; };
  runner.preparePyodide = async () => ({ ready: true });
  runner.runCourseMissionTests = async (code, tests) => {
    assert.equal(tests.length, 1); assert.equal(tests[0].id, "D1");
    return { results: [{ ...tests[0], passed: true, actual: d1Expected }], stdout: "", stderr: "" };
  };
  const free = await runWallExtensionFreeCode("learner code");
  assert.equal(disposed, 1, "free execution rebuilds the worker");
  assert.equal(free.returned, true); assert.equal(free.error, null);
  runner.runCourseMissionTests = async () => { throw new Error(syntaxTrace); };
  const freeError = await runWallExtensionFreeCode("learner code");
  assert.equal(freeError.returned, false); assert.equal(freeError.error, "syntax"); assert.equal(freeError.errorLine, 2, "free execution carries the learner line (#325)");
  assert.deepEqual(plain(free.actual), d1Expected);

  // 画面契約（#149）: エディタはライトテーマ＋枠と見出しで分離し、ダーク基調を持たない。ヒント2はフロー表示、結果の状態はアニメーションで現れる。
  const impl = (file) => fs.readFileSync(`${root}/wall-extension/implementation/${file}`, "utf8");
  const previewSource = impl("WallExtensionImplementationPreview.tsx");
  assert.match(previewSource, /theme={LEARNING_EDITOR_THEME}/, "editor uses the shared learning theme");
  assert.match(previewSource, /beforeMount={setupLearningEditor}/, "editor setup is shared");
  assert.match(previewSource, /learningEditorTextCursor/, "editor text cursor is the shared dark I-beam");
  assert(!previewSource.includes("vs-dark"), "editor is light themed");
  const editorSetupSource = fs.readFileSync(`${root}/code/learningEditor.ts`, "utf8");
  assert.match(editorSetupSource, /base: "vs"/, "shared editor theme is based on the light vs theme");
  assert.match(editorSetupSource, /"editorCursor\.foreground": "#111827"/, "shared editor theme pins a dark caret colour");
  assert.match(previewSource, /border: `2px solid \$\{colors\.focus\}`/, "editor area is framed in the focus colour");
  assert(!impl("editor.tokens.ts").includes("#1e1e1e"), "editor tokens are light");
  const hintsSource = impl("ImplementationHints.tsx");
  assert.match(hintsSource, /content\.hints\.loopLabel/, "hint 2 shows the loop as a flow");
  assert.match(hintsSource, /min\(92vw, 760px\)/, "hint dialog width is capped for readability");
  const resultsSource = impl("ImplementationResults.tsx");
  assert.match(resultsSource, /ImplementationTestResults/, "results render through the shared list-first component (#325)");
  assert(!resultsSource.includes("DrawnCheck"), "rows carry the text mark only; the drawn check belongs to the completion view");
  const sharedResultsSource = fs.readFileSync(`${root}/implementation/ImplementationTestResults.tsx`, "utf8");
  assert.match(sharedResultsSource, /data-test-status/, "test status changes animate in");
  assert.match(sharedResultsSource, /component=\{motion\.span\} key=\{row\.statusKey\}/, "a status change mounts its own short animation");
  assert.match(sharedResultsSource, /initial=\{reducedMotion \? false/, "reduced motion skips the initial animation state");
  assert.match(sharedResultsSource, /duration: reducedMotion \? 0 : 0\.3/, "reduced motion removes the transition");
  assert.match(sharedResultsSource, /statusKey !== "passed"/, "passed display figures start collapsed");
  assert.match(previewSource, /ResultConfetti/, "all-pass fires the phase confetti");
  assert.match(previewSource, /data-completion-banner/, "all-pass keeps the workspace and overlays the achievement banner (#305)");
  assert.match(previewSource, /DrawnCheck size=\{44\}/, "the completion banner leads with a drawn check");
  assert.match(previewSource, /onShowFinalResult/, "the final result is reached by the learner's button, not automatically (#305)");
  assert.match(previewSource, /answerCorrect/, "each newly passed test plays the small check sound (#305)");
  assert(previewSource.includes("WallExtensionTraceDialog"), "visual debugging is wired in issue #213");
  assert(previewSource.includes("traceWallExtensionCode"), "the preview acquires the learner trace");
  console.log("Wall-extension implementation: five cases verified against an independent generator and CPython reference, perfect-maze properties, typical-mistake mutations (pillar step, up-delta sign, four directions below the first row), canonical skeleton and Parsons reuse, hint gating, grid difference display, free-execution board rendering, hidden-case redaction, all-pass gate and runner progress/error/cancellation checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
