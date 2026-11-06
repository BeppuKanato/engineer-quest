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
const feature = "wall-extension/code-mapping";
const plain = value => JSON.parse(JSON.stringify(value));
const { wallExtensionCodeMappingContent: content } = load(file(`${feature}/codeMapping.content.ts`));
const { wallExtensionCode, wallExtensionCodeSource, wallExtensionCodeLineNumber } = load(file(`${feature}/wallExtensionCode.ts`));
const { validateWallExtensionCodeMappingCanvas: validate, defineWallExtensionCodeMappingContent } = load(file(`${feature}/codeMapping.types.ts`));
const { codeVariableRows } = load(file(`${feature}/codeMapping.presentation.ts`));
const { wallExtensionExecutionContent: execution } = load(file("wall-extension/execution/execution.content.ts"));
const maze = load(file("wall-extension/wallExtensionMaze.ts"));
const { CodeDisplay } = load(file("code/CodeDisplay.tsx"));
const { WallExtensionCodeMappingCanvas } = load(file(`${feature}/WallExtensionCodeMappingCanvas.tsx`));
const { WallExtensionCodeMappingPreview } = load(file(`${feature}/WallExtensionCodeMappingPreview.tsx`));

assert.equal(content.id, "wall-extension-code-mapping"); assert.equal(content.phase, 4);
assert.equal(content.stageName, "動きとコードの対応"); assert.equal(content.intervalMs, 3500);
assert.equal(wallExtensionCode.id, "wall-extension-v1"); assert.equal(wallExtensionCode.version, 1);

// 基準データ §2 の参照コード（契約 wall-extension-v1）。行の追加・変更・言い換えがないことを照合する。
const expectedLines = [
  ["define-function", "def generate_maze(size, choices):"],
  ["initialize-grid", "    grid = [[0] * size for _ in range(size)]"],
  ["for-border", "    for i in range(size):"],
  ["border-top", "        grid[0][i] = 1"],
  ["border-bottom", "        grid[size - 1][i] = 1"],
  ["border-left", "        grid[i][0] = 1"],
  ["border-right", "        grid[i][size - 1] = 1"],
  ["initialize-pillars", "    pillars = []"],
  ["for-pillar-row", "    for y in range(2, size - 1, 2):"],
  ["for-pillar-column", "        for x in range(2, size - 1, 2):"],
  ["place-pillar", "            grid[y][x] = 1"],
  ["append-pillar", "            pillars.append((x, y))"],
  ["define-directions", "    directions = {\"up\": (0, -1), \"down\": (0, 1), \"left\": (-1, 0), \"right\": (1, 0)}"],
  ["for-extension", "    for (x, y), choice in zip(pillars, choices):"],
  ["if-first-row", "        if y == 2:"],
  ["allowed-four", "            allowed = [\"up\", \"down\", \"left\", \"right\"]"],
  ["else-branch", "        else:"],
  ["allowed-three", "            allowed = [\"down\", \"left\", \"right\"]"],
  ["lookup-delta", "        dx, dy = directions[allowed[choice]]"],
  ["write-wall", "        grid[y + dy][x + dx] = 1"],
  ["return-grid", "    return grid"],
];
assert.deepEqual(plain(wallExtensionCode.lines), expectedLines.map(([id, text]) => ({ id, text })),
  "Stable IDs and exact source indentation match the baseline §2 contract");
assert(Buffer.from(wallExtensionCodeSource, "utf8").equals(Buffer.from(expectedLines.map(([, text]) => text).join("\n"), "utf8")),
  "Byte-exact code contract");

// 参照コードを CPython で実際に実行し、全実行行とローカル変数を教材フレームと突き合わせる。
const run = spawnSync(process.env.PYTHON || "python3", [path.join(__dirname, "fixtures/wallExtensionCodeMappingTrace.py")], {
  input: JSON.stringify({ code: wallExtensionCodeSource, size: maze.wallExtensionMainSize, choices: maze.wallExtensionMainChoices }),
  encoding: "utf8", timeout: 10000, env: { ...process.env, PYTHONUTF8: "1" },
});
assert.ifError(run.error); assert.equal(run.status, 0, run.stderr);
const actual = JSON.parse(run.stdout);
const resultWalls = new Set();
actual.result.forEach((row, y) => row.forEach((cell, x) => { if (cell === 1) resultWalls.add(`${x},${y}`); }));
assert.equal(resultWalls.size, 50, "Executed reference code builds the verified 9x9 maze");
assert.deepEqual(new Set(execution.steps.at(-1).canvas.state.walls), resultWalls,
  "Phase-2 final board equals the executed result");

// else: 行は CPython が行イベントを発しないため、説明フレームを分けて数える。
const elseFrames = content.steps.filter(step => step.canvas.highlights[0].id === "else-branch");
assert.equal(elseFrames.length, 6, "One else frame per non-first-row pillar");
const executedFrames = content.steps.slice(1).filter(step => step.canvas.highlights[0].id !== "else-branch");
assert.equal(content.steps.length, 1 + actual.trace.length + elseFrames.length,
  "One frame per executed Python line, plus the define frame and the else explanations");
assert.equal(content.steps[0].canvas.highlights[0].id, "define-function");
assert.deepEqual(plain(content.steps[0].canvas.state.variables),
  { size: 9, i: null, y: null, x: null, pillars: null, choice: null, allowed: null, dx: null, dy: null });
for (const [index, step] of executedFrames.entries()) {
  assert.equal(wallExtensionCodeLineNumber(step.canvas.highlights[0].id), actual.trace[index].line, step.id);
  assert.deepEqual(plain(step.canvas.state.variables), actual.trace[index].variables, `${step.id}: actual CPython locals`);
}
for (const step of elseFrames) {
  const index = content.steps.indexOf(step);
  assert.equal(content.steps[index - 1].canvas.highlights[0].id, "if-first-row", `${step.id}: follows the failed if`);
  assert.equal(content.steps[index + 1].canvas.highlights[0].id, "allowed-three", `${step.id}: precedes the else body`);
  assert.notEqual(step.canvas.state.variables.y, 2);
  assert.deepEqual(plain(step.canvas.state.variables), plain(content.steps[index - 1].canvas.state.variables),
    `${step.id}: else itself changes no variable`);
}

// フェーズ2の13ステップがすべて、順番どおりチェックポイントとして現れる。
const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
assert.equal(checkpoints.length, 13);
assert.deepEqual(plain(checkpoints.map(step => step.canvas.state.executionStepId)), plain(execution.steps.map(step => step.id)));
const checkpointLines = { "empty-board": "initialize-grid", "border-walls": "border-right", pillars: "append-pillar", complete: "for-extension" };
for (const step of checkpoints) {
  const reference = execution.steps.find(candidate => candidate.id === step.canvas.state.executionStepId);
  assert.equal(step.canvas.state.execution, reference.canvas, `${step.id}: board is the phase-2 snapshot itself`);
  assert.equal(step.caption, reference.caption, `${step.id}: checkpoint caption is the phase-2 caption`);
  assert.equal(step.canvas.highlights[0].id, checkpointLines[step.canvas.state.executionStepId] ?? "write-wall",
    `${step.id}: the line that completes the phase-2 step (extensions show the write line)`);
}

const savedExecution = JSON.stringify(execution);
for (const step of [...content.steps].reverse()) {
  validate(step.canvas);
  assert.equal(step.canvas.state.execution, execution.steps.find(reference => reference.id === step.canvas.state.executionStepId).canvas);
  assert.equal(step.canvas.data.code, wallExtensionCode);
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

const frame = id => { const step = content.steps.find(step => step.id === id); assert(step, id); return step.canvas; };
const firstExtension = frame("execution-extend-2-2");
assert.deepEqual(plain(firstExtension.state.variables.allowed), ["up", "down", "left", "right"]);
assert.equal(firstExtension.state.variables.choice, 3);
assert.equal(firstExtension.state.variables.dx, 1); assert.equal(firstExtension.state.variables.dy, 0);
assert.equal(firstExtension.state.execution.state.walls.length, 42);
const middleExtension = frame("execution-extend-4-4");
assert.equal(middleExtension.state.variables.x, 4); assert.equal(middleExtension.state.variables.y, 4);
assert.equal(middleExtension.state.variables.choice, 2);
assert.deepEqual(plain(middleExtension.state.variables.allowed), ["down", "left", "right"]);
assert.equal(middleExtension.state.variables.dx, 1); assert.equal(middleExtension.state.variables.dy, 0);
assert.equal(middleExtension.state.execution.state.walls.length, 46);
assert.equal(frame("execution-pillars").state.variables.pillars.length, 9);
assert.match(content.steps.find(step => step.id === "lookup-delta-4-4").caption, /右/u);
assert.equal(content.steps.at(-1).canvas.highlights[0].id, "return-grid");
assert.equal(frame("execution-complete").state.execution.state.walls.length, 50);

for (const step of [content.steps[0], { canvas: middleExtension }, { canvas: frame("else-branch-2-4") }, content.steps.at(-1)]) {
  const html = renderToStaticMarkup(React.createElement(CodeDisplay, { code: wallExtensionCode, label: "generate_mazeのコード", activeLineId: step.canvas.highlights[0].id }));
  assert.equal((html.match(/aria-current="step"/gu) || []).length, 1);
  // renderToStaticMarkup は " を &quot; にエスケープする。実体参照を戻してから原文と照合する。
  const unescape = text => text.replace(/&quot;/g, "\"").replace(/&amp;/g, "&");
  assert.equal([...html.matchAll(/<code[^>]*>([^<]*)<\/code>/gu)].map(match => unescape(match[1])).join("\n"), wallExtensionCodeSource,
    "Rendered code stays byte-exact");
  const canvas = renderToStaticMarkup(React.createElement(WallExtensionCodeMappingCanvas, { canvas: step.canvas }));
  assert.match(canvas, /棒倒し法の図とコードの対応/u); assert.match(canvas, /コードの変数/u);
  for (const name of ["size", "i", "y", "x", "pillars", "choice", "allowed", "dx", "dy"]) {
    assert(canvas.includes(`data-variable="${name}"`), `variable row ${name}`);
  }
  assert.equal((canvas.match(/data-maze-wall="true"/g) ?? []).length, step.canvas.state.execution.state.walls.length,
    "Rendered board matches the referenced phase-2 snapshot");
}
const preview = renderToStaticMarkup(React.createElement(WallExtensionCodeMappingPreview));
assert.match(preview, /aria-label="動きとコードの対応"/u);
assert.match(preview, /ステップ位置/u);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "wall-extension-code-mapping"'));

assert.throws(() => validate({ ...middleExtension, state: { ...middleExtension.state, execution: plain(middleExtension.state.execution) } }), /canonical/u);
assert.throws(() => validate({ ...middleExtension, highlights: [{ kind: "code-line", id: "missing" }] }), /Unknown/u);
assert.throws(() => validate({ ...middleExtension, state: { ...middleExtension.state, variables: { ...middleExtension.state.variables, pillars: [[4, 2]] } } }), /prefix/u);
assert.throws(() => validate({ ...middleExtension, state: { ...middleExtension.state, variables: { ...middleExtension.state.variables, allowed: ["up"] } } }), /allowed/u);
assert.throws(() => validate({ ...middleExtension, state: { ...middleExtension.state, variables: { ...middleExtension.state.variables, dx: 2 } } }), /delta/u);
assert.throws(() => defineWallExtensionCodeMappingContent({ ...content, steps: content.steps.filter(step => step.id !== "execution-extend-4-4") }), /13/u);

const renderer = fs.readFileSync(file(`${feature}/WallExtensionCodeMappingCanvas.tsx`), "utf8");
assert.match(renderer, /prefers-reduced-motion: reduce/u);
assert.match(renderer, /bgcolor: changed \? playerTokens.focus : "transparent"/u);
assert.match(renderer, /Math.max\(620/u);
const entry = fs.readFileSync(file(`${feature}/WallExtensionCodeMappingPreview.tsx`), "utf8");
assert.match(entry, /84vw/u); assert.match(entry, /84dvh/u);
assert(!/onLearningEvent|onComplete|endAction|fetch\(|localStorage/u.test(entry));
console.log(`Wall-extension code mapping verified: ${content.steps.length} frames, byte-exact 21-line contract wall-extension-v1, all CPython lines/locals, 13 phase-2 checkpoints (extensions on the write line), else explanations, shared rendering and standalone preview.`);
