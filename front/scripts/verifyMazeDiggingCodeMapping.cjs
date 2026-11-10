const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const ts = require("typescript"), React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {}; cache.set(filename, exports);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { exports, require: name => {
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const file = name => `${root}/${name}`;
const feature = "maze-digging/code-mapping";
const plain = value => JSON.parse(JSON.stringify(value));
const { mazeDiggingCodeMappingContent: content } = load(file(`${feature}/codeMapping.content.ts`));
const { mazeDiggingCode, mazeDiggingCodeSource, mazeDiggingCodeLineNumber } = load(file(`${feature}/mazeDiggingCode.ts`));
const { validateMazeDiggingCodeMappingCanvas: validate, defineMazeDiggingCodeMappingContent } = load(file(`${feature}/codeMapping.types.ts`));
const { codeVariableRows } = load(file(`${feature}/codeMapping.presentation.ts`));
const { mazeDiggingExecutionContent: execution } = load(file("maze-digging/execution/execution.content.ts"));
const maze = load(file("maze-digging/mazeDiggingMaze.ts"));
const { CodeDisplay } = load(file("code/CodeDisplay.tsx"));
const { MazeDiggingCodeMappingCanvas } = load(file(`${feature}/MazeDiggingCodeMappingCanvas.tsx`));
const { MazeDiggingCodeMappingPreview } = load(file(`${feature}/MazeDiggingCodeMappingPreview.tsx`));

assert.equal(content.id, "maze-digging-code-mapping"); assert.equal(content.phase, 4);
assert.equal(content.stageName, "動きとコードの対応"); assert.equal(content.intervalMs, 3500);
assert.equal(mazeDiggingCode.id, "maze-digging-v1"); assert.equal(mazeDiggingCode.version, 1);

// 基準データ §2 の参照コード（契約 maze-digging-v1）。行の追加・変更・言い換えがないことを照合する。
const expectedLines = [
  ["define-function", "def dig_maze(size, choices):"],
  ["initialize-grid", "    grid = [[1] * size for _ in range(size)]"],
  ["define-directions", "    directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]"],
  ["dig-start", "    grid[1][1] = 0"],
  ["initialize-stack", "    stack = [(1, 1)]"],
  ["initialize-step", "    step = 0"],
  ["while-stack", "    while stack:"],
  ["current-room", "        x, y = stack[-1]"],
  ["initialize-candidates", "        candidates = []"],
  ["for-direction", "        for dx, dy in directions:"],
  ["compute-next", "            nx, ny = x + 2 * dx, y + 2 * dy"],
  ["if-diggable", "            if 1 <= nx < size - 1 and 1 <= ny < size - 1 and grid[ny][nx] == 1:"],
  ["append-candidate", "                candidates.append((nx, ny))"],
  ["if-candidates", "        if candidates:"],
  ["choose-candidate", "            nx, ny = candidates[choices[step]]"],
  ["advance-step", "            step += 1"],
  ["dig-between", "            grid[(y + ny) // 2][(x + nx) // 2] = 0"],
  ["dig-room", "            grid[ny][nx] = 0"],
  ["push-stack", "            stack.append((nx, ny))"],
  ["else-branch", "        else:"],
  ["pop-stack", "            stack.pop()"],
  ["return-grid", "    return grid"],
];
assert.deepEqual(plain(mazeDiggingCode.lines), expectedLines.map(([id, text]) => ({ id, text })),
  "Stable IDs and exact source indentation match the baseline §2 contract");
assert(Buffer.from(mazeDiggingCodeSource, "utf8").equals(Buffer.from(expectedLines.map(([, text]) => text).join("\n"), "utf8")),
  "Byte-exact code contract");

// 参照コードを CPython で実際に実行し、全実行行とローカル変数を教材フレームと突き合わせる。
const run = spawnSync(process.env.PYTHON || "python3", [path.join(__dirname, "fixtures/mazeDiggingCodeMappingTrace.py")], {
  input: JSON.stringify({ code: mazeDiggingCodeSource, size: maze.mazeDiggingMainSize, choices: maze.mazeDiggingMainChoices }),
  encoding: "utf8", timeout: 10000, env: { ...process.env, PYTHONUTF8: "1" },
});
assert.ifError(run.error); assert.equal(run.status, 0, run.stderr);
const actual = JSON.parse(run.stdout);
assert.deepEqual(plain(actual.result), plain(maze.runMazeDigging(maze.mazeDiggingMainSize, maze.mazeDiggingMainChoices).grid),
  "Executed reference code returns the canonical maze");
const resultWalls = new Set();
actual.result.forEach((row, y) => row.forEach((cell, x) => { if (cell === 1) resultWalls.add(`${x},${y}`); }));
assert.equal(resultWalls.size, 50, "Executed reference code builds the verified 9x9 maze");
assert.deepEqual(new Set(execution.steps.find(step => step.id === "complete").canvas.state.walls), resultWalls,
  "Phase-2 completed board equals the executed result");

// else: 行は CPython が行イベントを発しないため、説明フレームを分けて数える。
const elseFrames = content.steps.filter(step => step.canvas.highlights[0].id === "else-branch");
assert.equal(elseFrames.length, 16, "One else frame per stack.pop() (15 digs leave 16 pops in total)");
const executedFrames = content.steps.slice(1).filter(step => step.canvas.highlights[0].id !== "else-branch");
assert.equal(content.steps.length, 1 + actual.trace.length + elseFrames.length,
  "One frame per executed Python line, plus the define frame and the else explanations");
assert.equal(content.steps[0].canvas.highlights[0].id, "define-function");
assert.deepEqual(plain(content.steps[0].canvas.state.variables),
  { size: 9, step: null, x: null, y: null, dx: null, dy: null, nx: null, ny: null, candidates: null, stack: null });
for (const [index, step] of executedFrames.entries()) {
  assert.equal(mazeDiggingCodeLineNumber(step.canvas.highlights[0].id), actual.trace[index].line, step.id);
  assert.deepEqual(plain(step.canvas.state.variables), actual.trace[index].variables, `${step.id}: actual CPython locals`);
}
for (const step of elseFrames) {
  const index = content.steps.indexOf(step);
  assert.equal(content.steps[index - 1].canvas.highlights[0].id, "if-candidates", `${step.id}: follows the failed if`);
  assert.deepEqual(plain(content.steps[index - 1].canvas.state.variables.candidates), [], `${step.id}: candidates were empty`);
  assert(["pop-stack"].includes(content.steps[index + 1].canvas.highlights[0].id), `${step.id}: precedes the pop`);
  assert.deepEqual(plain(step.canvas.state.variables), plain(content.steps[index - 1].canvas.state.variables),
    `${step.id}: else itself changes no variable`);
}

// フェーズ2のコード対応21ステップがすべて、順番どおりチェックポイントとして現れる。
// 説明専用ステップ（Issue #334）はフェーズ4に現れない。
const { codeMappedSteps } = load(file("player/content.types.ts"));
const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
assert.equal(checkpoints.length, 21);
assert.deepEqual(plain(checkpoints.map(step => step.canvas.state.executionStepId)), plain(codeMappedSteps(execution).map(step => step.id)));
assert(!checkpoints.some(step => ["no-loops", "loop-what-if"].includes(step.canvas.state.executionStepId)),
  "Explanation-only steps never become checkpoints");
const checkpointLine = stepId => stepId === "all-walls" ? "initialize-grid"
  : stepId === "dig-start" ? "dig-start"
  : stepId === "complete" ? "while-stack"
  : stepId.startsWith("dig-") ? "push-stack" : "pop-stack";
for (const step of checkpoints) {
  const reference = execution.steps.find(candidate => candidate.id === step.canvas.state.executionStepId);
  assert.equal(step.canvas.state.execution, reference.canvas, `${step.id}: board is the phase-2 snapshot itself`);
  assert.equal(step.caption, reference.caption, `${step.id}: checkpoint caption is the phase-2 caption`);
  assert.equal(step.canvas.highlights[0].id, checkpointLine(step.canvas.state.executionStepId),
    `${step.id}: the line that completes the phase-2 step`);
}

// 座標表示は (y, x) 順（Issue #326）: キャプションと変数表示が grid[y][x] の添字順と一致する。
const currentRoom2 = content.steps.find(step => step.id === "current-room-2");
assert(currentRoom2.caption.includes("(1, 3) を現在マスとします"), "Caption coordinates use (y, x) order");
const pairRows = codeVariableRows({ size: 9, step: 0, x: 3, y: 1, dx: null, dy: null, nx: null, ny: null, candidates: [[5, 1], [3, 3]], stack: [[1, 1]] });
assert.equal(pairRows.find(row => row.name === "candidates").value, "[(1, 5), (3, 3)]", "Variable pairs display in (y, x) order");
assert.equal(pairRows.find(row => row.name === "stack").value, "[(1, 1)]", "Stack pairs display in (y, x) order");

const savedExecution = JSON.stringify(execution);
for (const step of [...content.steps].reverse()) {
  validate(step.canvas);
  assert.equal(step.canvas.state.execution, execution.steps.find(reference => reference.id === step.canvas.state.executionStepId).canvas);
  assert.equal(step.canvas.data.code, mazeDiggingCode);
  assert.equal((step.caption.match(/。/gu) || []).length, 1, `${step.id}: one sentence`);
  assert(!/行目|フェーズ/u.test(step.caption), `${step.id}: no meta wording`);
  const variables = step.canvas.state.variables;
  const index = content.steps.indexOf(step);
  const previous = content.steps[index - 1]?.canvas.state.variables;
  for (const row of codeVariableRows(variables, previous)) {
    assert.equal(row.changed, JSON.stringify(variables[row.name]) !== JSON.stringify(previous?.[row.name] ?? null),
      `${step.id}: changed ${row.name}`);
  }
}
assert.equal(JSON.stringify(execution), savedExecution, "Intermediates never mutate the phase-2 snapshots");
assert.equal(new Set(content.steps.map(step => step.id)).size, content.steps.length, "Frame ids are unique");

const frame = id => { const step = content.steps.find(step => step.id === id); assert(step, id); return step.canvas; };
const firstDig = frame("execution-dig-1");
assert.deepEqual(plain(firstDig.state.variables.stack), [[1, 1], [3, 1]]);
assert.deepEqual(plain(firstDig.state.variables.candidates), [[3, 1], [1, 3]]);
assert.equal(firstDig.state.variables.step, 1);
assert.equal(firstDig.state.variables.nx, 3); assert.equal(firstDig.state.variables.ny, 1);
assert.equal(firstDig.state.execution.state.walls.length, 78);
const firstBacktrack = frame("execution-backtrack-1");
assert.deepEqual(plain(firstBacktrack.state.variables.stack), [[1, 1], [3, 1], [3, 3], [5, 3], [7, 3]]);
assert.equal(firstBacktrack.state.execution.state.processing, "7,3");
assert.match(content.steps.find(step => step.id === "choose-candidate-4").caption, /番号1/u);
assert.equal(frame("execution-complete").state.execution.state.walls.length, 50);
assert.equal(content.steps.at(-1).canvas.highlights[0].id, "return-grid");
assert.deepEqual(plain(frame("execution-complete").state.variables.stack), []);

for (const step of [content.steps[0], { canvas: firstDig }, { canvas: content.steps.find(step => step.canvas.highlights[0].id === "else-branch").canvas }, content.steps.at(-1)]) {
  const html = renderToStaticMarkup(React.createElement(CodeDisplay, { code: mazeDiggingCode, label: "dig_mazeのコード", activeLineId: step.canvas.highlights[0].id }));
  assert.equal((html.match(/aria-current="step"/gu) || []).length, 1);
  // renderToStaticMarkup は " を &quot; にエスケープする。実体参照を戻してから原文と照合する。
  const unescape = text => text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
  assert.equal([...html.matchAll(/<code[^>]*>([^<]*)<\/code>/gu)].map(match => unescape(match[1])).join("\n"), mazeDiggingCodeSource,
    "Rendered code stays byte-exact");
  const canvas = renderToStaticMarkup(React.createElement(MazeDiggingCodeMappingCanvas, { canvas: step.canvas }));
  assert.match(canvas, /穴掘り法の図とコードの対応/u); assert.match(canvas, /コードの変数/u);
  for (const name of ["size", "step", "x", "y", "dx", "dy", "nx", "ny", "candidates", "stack"]) {
    assert(canvas.includes(`data-variable="${name}"`), `variable row ${name}`);
  }
  assert.equal((canvas.match(/data-maze-wall="true"/g) ?? []).length, step.canvas.state.execution.state.walls.length,
    "Rendered board matches the referenced phase-2 snapshot");
}
const preview = renderToStaticMarkup(React.createElement(MazeDiggingCodeMappingPreview));
assert.match(preview, /aria-label="動きとコードの対応"/u);
assert.match(preview, /ステップ位置/u);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "maze-digging-code-mapping"'));

assert.throws(() => validate({ ...firstDig, state: { ...firstDig.state, execution: plain(firstDig.state.execution) } }), /canonical/u);
assert.throws(() => validate({ ...firstDig, highlights: [{ kind: "code-line", id: "missing" }] }), /Unknown/u);
assert.throws(() => validate({ ...firstDig, state: { ...firstDig.state, variables: { ...firstDig.state.variables, dx: 2 } } }), /delta/u);
assert.throws(() => validate({ ...firstDig, state: { ...firstDig.state, variables: { ...firstDig.state.variables, candidates: [[4, 4]] } } }), /Candidates/u);
assert.throws(() => validate({ ...firstDig, state: { ...firstDig.state, variables: { ...firstDig.state.variables, stack: [[1, 1], [5, 5]] } } }), /Stack/u);
assert.throws(() => validate({ ...firstDig, state: { ...firstDig.state, variables: { ...firstDig.state.variables, step: 99 } } }), /step/u);
assert.throws(() => defineMazeDiggingCodeMappingContent({ ...content, steps: content.steps.filter(step => step.id !== "execution-dig-4") }), /21/u);

const renderer = fs.readFileSync(file(`${feature}/MazeDiggingCodeMappingCanvas.tsx`), "utf8");
assert.match(renderer, /prefers-reduced-motion: reduce/u);
assert.match(renderer, /bgcolor: changed \? playerTokens.focus : "transparent"/u);
assert.match(renderer, /Math.max\(620/u);
const entry = fs.readFileSync(file(`${feature}/MazeDiggingCodeMappingPreview.tsx`), "utf8");
assert.match(entry, /84vw/u); assert.match(entry, /84dvh/u);
// 接続ポートは単元フロー向けの任意 props。単品では未指定で従来どおり動き、外部通信や保存は持たない。
assert.match(entry, /onComplete\?: \(\) => void/u); assert.match(entry, /endAction/u);
assert(!/fetch\(|localStorage/u.test(entry));
console.log(`Maze-digging code mapping verified: ${content.steps.length} frames, byte-exact 22-line contract maze-digging-v1, all CPython lines/locals, 21 phase-2 checkpoints (digs on the push line, backtracks on the final pop, completion on the while exit), else explanations, shared rendering and standalone preview.`);
