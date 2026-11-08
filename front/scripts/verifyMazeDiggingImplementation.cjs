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
const { mazeDiggingImplementationContent: content } = load(`${root}/maze-digging/implementation/implementation.content.ts`);
const { mazeDiggingCode, mazeDiggingCodeSource } = load(`${root}/maze-digging/code-mapping/mazeDiggingCode.ts`);
const { mazeDiggingConsolidationContent } = load(`${root}/maze-digging/consolidation/consolidation.content.ts`);
const { mazeDiggingExecutionContent } = load(`${root}/maze-digging/execution/execution.content.ts`);
const { ImplementationResults } = load(`${root}/maze-digging/implementation/ImplementationResults.tsx`);
const { ImplementationHints } = load(`${root}/maze-digging/implementation/ImplementationHints.tsx`);
const { FreeExecutionConsole } = load(`${root}/maze-digging/implementation/FreeExecutionConsole.tsx`);
const { ParsonsBoard } = load(`${root}/bfs/consolidation/ParsonsBoard.tsx`);
const {
  recordHintUsage, resultKinds, classifyExecutionError, runningMessage, allTestsPassed, runImplementationTests,
  isMazeGridValue, mazeGridCanvas, gridDifferences,
} = load(`${root}/maze-digging/implementation/implementation.ts`);
const { freeDisplayCase, runMazeDiggingFreeCode } = load(`${root}/maze-digging/implementation/freeExecution.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const plain = value => JSON.parse(JSON.stringify(value));

// ---- コンテンツの基本契約 ----
assert.equal(content.id, "maze-digging-implementation"); assert.equal(content.phase, 7); assert.equal(content.version, 1);
assert.match(content.template, /^def dig_maze\(size, choices\):\n/u);
assert.match(content.template, /directions = \[\(0, -1\), \(1, 0\), \(0, 1\), \(-1, 0\)\]/u);
assert.match(content.template, /\n +pass$/u);
assert.equal(mazeDiggingCode.id, "maze-digging-v1"); assert.equal(mazeDiggingCode.version, 1);
assert.deepEqual(plain(content.hints.skeletonLineIds), ["while-stack", "if-diggable", "if-candidates", "else-branch"]);
content.hints.skeletonLines.forEach((line, index) => assert.equal(line, mazeDiggingCode.lines.find(line => line.id === content.hints.skeletonLineIds[index])));
assert.equal(content.hints.labels.length, 4);
assert.deepEqual(plain(content.hints.flow), [
  "全部を壁にして、開始マス（1, 1）を掘る",
  "今いる部屋から、2マス先が盤内でまだ壁のままの部屋を集める",
  "方向の番号で1つ選んで、間の壁ごと掘り、スタックに積む",
  "掘れる部屋がなければ、スタックから1つ戻る",
]);
assert.equal(new Set(content.hints.tokens).size, content.hints.tokens.length);
assert.equal(content.hints.parsonsQuestion, mazeDiggingConsolidationContent.questions.find(question => question.kind === "parsons"));
for (const file of fs.readdirSync(`${root}/maze-digging/implementation`).filter(file => /\.tsx?$/u.test(file))) {
  assert(!/codeDiff|diffLines|from ["']diff["']|diffTitle|referenceCode/u.test(fs.readFileSync(`${root}/maze-digging/implementation/${file}`, "utf8")), "No diff hint dependency remains in the feature");
}

// ---- テストの入力は基準データの確定値 ----
assert.deepEqual(plain(content.tests.map(test => test.id)), ["D1", "D2", "J1", "J2", "J3"]);
assert.deepEqual(plain(content.tests.map(test => test.visibility)), ["display", "display", "judgement", "judgement", "judgement"]);
assert.deepEqual(plain(content.tests.map(test => plain(test.args))), [
  [9, [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0]],
  [7, [0, 0, 0, 1, 0, 1, 0, 0]],
  [9, [1, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]],
  [7, [1, 1, 0, 1, 0, 0, 0, 0]],
  [11, [0, 1, 2, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0]],
]);
for (const test of content.tests) assert.equal(test.functionName, "dig_maze");

// ---- 期待グリッドを基準データ §2 の手続きから独立に再計算し、完全迷路の性質を確認 ----
function digExpected(size, choices) {
  const grid = Array.from({ length: size }, () => Array(size).fill(1));
  const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  grid[1][1] = 0;
  const stack = [[1, 1]];
  let step = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const candidates = [];
    for (const [dx, dy] of directions) {
      const nx = x + 2 * dx, ny = y + 2 * dy;
      if (nx >= 1 && nx < size - 1 && ny >= 1 && ny < size - 1 && grid[ny][nx] === 1) candidates.push([nx, ny]);
    }
    if (candidates.length) {
      const [nx, ny] = candidates[choices[step]];
      step++;
      grid[(y + ny) / 2][(x + nx) / 2] = 0;
      grid[ny][nx] = 0;
      stack.push([nx, ny]);
    } else {
      stack.pop();
    }
  }
  assert.equal(step, choices.length, "choices are consumed exactly");
  return grid;
}
function assertPerfectMaze(grid) {
  const size = grid.length;
  for (let i = 0; i < size; i++) {
    assert.equal(grid[0][i], 1); assert.equal(grid[size - 1][i], 1); assert.equal(grid[i][0], 1); assert.equal(grid[i][size - 1], 1);
  }
  const rooms = ((size - 1) / 2) ** 2;
  for (let y = 1; y < size - 1; y += 2) for (let x = 1; x < size - 1; x += 2) assert.equal(grid[y][x], 0, "every room is dug");
  const passages = [];
  grid.forEach((row, y) => row.forEach((cell, x) => { if (cell === 0) passages.push([x, y]); }));
  assert.equal(passages.length, 2 * rooms - 1, "passages = rooms + dug walls between rooms");
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
  assert.deepEqual(digExpected(size, choices), plain(test.expected), test.id);
  assertPerfectMaze(plain(test.expected));
}
// D1の期待グリッドはフェーズ2の完成盤面と一致する。
{
  const complete = mazeDiggingExecutionContent.steps.find(step => step.id === "complete");
  assert(complete, "phase 2 complete step exists");
  const walls = new Set(complete.canvas.state.walls);
  const fromCanvas = Array.from({ length: 9 }, (_, y) => Array.from({ length: 9 }, (_, x) => (walls.has(`${x},${y}`) ? 1 : 0)));
  assert.deepEqual(fromCanvas, plain(content.tests[0].expected), "D1 matches the phase 2 completed board");
}

// ---- Python で参照コード・テンプレート・典型的な誤りを実行検証 ----
const variants = {
  reference: mazeDiggingCodeSource,
  oneStep: mazeDiggingCodeSource.replace("x + 2 * dx, y + 2 * dy", "x + 1 * dx, y + 1 * dy"),
  directionOrder: mazeDiggingCodeSource.replace("(1, 0), (0, 1)", "(0, 1), (1, 0)"),
  dugCondition: mazeDiggingCodeSource.replace("grid[ny][nx] == 1", "grid[ny][nx] == 0"),
  noBetween: mazeDiggingCodeSource.replace("grid[(y + ny) // 2][(x + nx) // 2] = 0", "grid[(y + ny) // 2][(x + nx) // 2] = 1"),
};
for (const name of ["oneStep", "directionOrder", "dugCondition", "noBetween"]) assert.notEqual(variants[name], variants.reference, `${name} mutation must change the source`);
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
assert.equal(results.oneStep.D1, false, "digging only one cell ahead must fail");
assert.equal(results.directionOrder.D1, false, "candidate order is part of the contract and must change the maze");
assert.equal(results.dugCondition.D1, false, "treating dug rooms as candidates must fail");
assert.equal(results.noBetween.D1, false, "leaving the wall between rooms must fail");

// ---- ヒント利用・エラー分類・進捗文言（他単元フェーズ7と同じ契約） ----
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
  assert(canvas.state.walls.includes("0,0") && canvas.state.walls.includes("4,1"), "border and undug walls are walls");
  assert(!canvas.state.walls.includes("1,1"), "the start room is dug");
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
assert.equal((passedHtml.match(/data-phase-result-check/g) || []).length, content.tests.length, "each passed test draws in its own check");
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
const review = renderToStaticMarkup(createElement(ParsonsBoard, { question: content.hints.parsonsQuestion, code: mazeDiggingCode }));
assert.equal((review.match(/data-parsons-line-id=/g) || []).length, 22);
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
  const free = await runMazeDiggingFreeCode("learner code");
  assert.equal(disposed, 1, "free execution rebuilds the worker");
  assert.equal(free.returned, true); assert.equal(free.error, null);
  assert.deepEqual(plain(free.actual), d1Expected);

  // 画面契約（#149）: エディタはライトテーマ＋枠と見出しで分離し、ダーク基調を持たない。ヒント2はフロー表示、結果の状態はアニメーションで現れる。
  const impl = (file) => fs.readFileSync(`${root}/maze-digging/implementation/${file}`, "utf8");
  const previewSource = impl("MazeDiggingImplementationPreview.tsx");
  assert.match(previewSource, /theme="vs"/);
  assert(!previewSource.includes("vs-dark"), "editor is light themed");
  assert.match(previewSource, /border: `2px solid \$\{colors\.focus\}`/, "editor area is framed in the focus colour");
  assert(!impl("editor.tokens.ts").includes("#1e1e1e"), "editor tokens are light");
  const hintsSource = impl("ImplementationHints.tsx");
  assert.match(hintsSource, /content\.hints\.loopLabel/, "hint 2 shows the loop as a flow");
  assert.match(hintsSource, /min\(92vw, 760px\)/, "hint dialog width is capped for readability");
  const resultsSource = impl("ImplementationResults.tsx");
  assert.match(resultsSource, /data-test-status/, "test status changes animate in");
  assert.match(resultsSource, /component=\{motion\.span\} key=\{statusKey\}/, "a status change mounts its own short animation");
  assert.match(resultsSource, /initial=\{reducedMotion \? false/, "reduced motion skips the initial animation state");
  assert.match(resultsSource, /duration: reducedMotion \? 0 : 0\.3/, "reduced motion removes the transition");
  assert.match(resultsSource, /DrawnCheck/, "passed tests show the shared drawn check");
  assert.match(resultsSource, /outcome\?\.passed && /, "the drawn check is gated on passing");
  assert.match(previewSource, /ResultConfetti/, "all-pass fires the phase confetti");
  assert.match(previewSource, /data-completion-banner/, "all-pass keeps the workspace and overlays the achievement banner (#305)");
  assert.match(previewSource, /DrawnCheck size=\{44\}/, "the completion banner leads with a drawn check");
  assert.match(previewSource, /onShowFinalResult/, "the final result is reached by the learner's button, not automatically (#305)");
  assert.match(previewSource, /answerCorrect/, "each newly passed test plays the small check sound (#305)");
  assert.match(previewSource, /MazeDiggingTraceDialog/, "visual debugging is wired by issue #264");
  assert.match(previewSource, /traceMazeDiggingCode/, "visual debugging is wired by issue #264");
  console.log("Maze-digging implementation: five cases verified against an independent reimplementation and CPython reference, perfect-maze properties (J3 included), typical-mistake mutations (one-cell dig, candidate order, dug-room condition, undug between wall), canonical skeleton and Parsons reuse, hint gating, grid difference display, free-execution board rendering, hidden-case redaction, all-pass gate and runner progress/error/cancellation checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
