const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const ts = require("typescript");
const { createElement } = require("react"), { renderToStaticMarkup } = require("react-dom/server");
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
const feature = `${root}/wall-extension/execution`;
const plain = value => JSON.parse(JSON.stringify(value));
const { wallExtensionExecutionContent: content } = load(`${feature}/execution.content.ts`);
const { validateWallExtensionExecutionCanvas: validate } = load(`${feature}/execution.types.ts`);
const maze = load(`${root}/wall-extension/wallExtensionMaze.ts`);
const { WallExtensionExecutionCanvas } = load(`${feature}/WallExtensionExecutionCanvas.tsx`);
const { WallExtensionExecutionPreview } = load(`${feature}/WallExtensionExecutionPreview.tsx`);
const { steps } = content;
const keySet = keys => new Set(keys);

// 契約 wall-extension-v1 を独立に再実装し、教材の壁と突き合わせる（基準データ §1）。
function referenceWalls(size, choices) {
  const walls = new Set();
  for (let i = 0; i < size; i++) { walls.add(`${i},0`); walls.add(`${i},${size - 1}`); walls.add(`0,${i}`); walls.add(`${size - 1},${i}`); }
  const pillars = [];
  for (let y = 2; y < size - 1; y += 2) for (let x = 2; x < size - 1; x += 2) { walls.add(`${x},${y}`); pillars.push([x, y]); }
  const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  pillars.forEach(([x, y], index) => {
    const allowed = y === 2 ? ["up", "down", "left", "right"] : ["down", "left", "right"];
    const [dx, dy] = delta[allowed[choices[index]]];
    const target = `${x + dx},${y + dy}`;
    assert(!walls.has(target), `Reference target already walled: ${target}`);
    walls.add(target);
  });
  return walls;
}
const expectedMain = referenceWalls(9, [3, 1, 2, 0, 2, 0, 2, 2, 0]);
assert.equal(expectedMain.size, 50);

// 基準データ §1 の検証済みトレース（柱・方向・壁になるマス）。
const expectedTrace = [
  { pillar: "2,2", direction: "right", target: "3,2" },
  { pillar: "4,2", direction: "down", target: "4,3" },
  { pillar: "6,2", direction: "left", target: "5,2" },
  { pillar: "2,4", direction: "down", target: "2,5" },
  { pillar: "4,4", direction: "right", target: "5,4" },
  { pillar: "6,4", direction: "down", target: "6,5" },
  { pillar: "2,6", direction: "right", target: "3,6" },
  { pillar: "4,6", direction: "right", target: "5,6" },
  { pillar: "6,6", direction: "down", target: "6,7" },
];
assert.deepEqual(plain(maze.wallExtensionExtensions(9, maze.wallExtensionMainChoices)), expectedTrace,
  "Maze builder reproduces the verified trace");

assert.equal(content.id, "wall-extension-execution"); assert.equal(content.phase, 2); assert.equal(content.stageName, "動きの説明");
assert(content.intervalMs >= 2500);
assert.equal(steps.length, 13, "Phase 2 keeps all 13 steps");
assert.deepEqual(plain(steps.map(step => step.id)), [
  "empty-board", "border-walls", "pillars",
  ...expectedTrace.map(({ pillar }) => `extend-${pillar.split(",").join("-")}`),
  "complete",
]);
assert.deepEqual(plain(steps.map(step => step.caption)), [
  "9×9の空の盤面を用意します。",
  "外側を壁で囲みます。",
  "2マスおきに、柱を9本立てます。",
  "一番上の段の左の柱から、右へ壁を伸ばします。",
  "一番上の段の真ん中の柱から、下へ壁を伸ばします。",
  "一番上の段の右の柱から、左へ壁を伸ばします。",
  "真ん中の段の左の柱からは、上には伸ばさず、下へ壁を伸ばします。",
  "真ん中の段の真ん中の柱から、右へ壁を伸ばします。",
  "真ん中の段の右の柱から、下へ壁を伸ばします。",
  "一番下の段の左の柱から、右へ壁を伸ばします。",
  "一番下の段の真ん中の柱から、右へ壁を伸ばします。",
  "一番下の段の右の柱から、下へ壁を伸ばします。",
  "迷路が完成し、すべてのマスがつながりました。",
]);
assert(steps.every(step => (step.caption.match(/。/gu) ?? []).length === 1), "One sentence per step");
for (const step of steps) {
  validate(step.canvas);
  assert.equal(step.canvas.data.size, 9);
  assert.equal(step.canvas.state.target, null);
  assert.deepEqual(plain(step.canvas.state.path), []);
  assert.equal(step.canvas.state.start, null); assert.equal(step.canvas.state.goal, null);
}

// 盤面の積み上がり: 空→外周（32）→柱（+9）→伸長ごとにちょうど1マス→完成。
const wallCounts = steps.map(step => step.canvas.state.walls.length);
assert.deepEqual(wallCounts, [0, 32, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 50]);
steps.forEach((step, index) => {
  if (index === 0) return;
  const before = keySet(steps[index - 1].canvas.state.walls), after = keySet(step.canvas.state.walls);
  assert([...before].every(key => after.has(key)), `Step ${step.id}: walls only grow`);
});
const borderOnly = new Set([...expectedMain].filter(key => { const [x, y] = key.split(",").map(Number); return x === 0 || y === 0 || x === 8 || y === 8; }));
assert.equal(borderOnly.size, 32);
assert.deepEqual(keySet(steps[1].canvas.state.walls), borderOnly);
assert.deepEqual(keySet(steps[2].canvas.state.walls),
  new Set([...borderOnly, ...expectedTrace.map(({ pillar }) => pillar)]));

// 伸長ステップ: processing は柱、highlights は今回壁になったマス、増えた壁はその1マスだけ。
expectedTrace.forEach((expected, i) => {
  const step = steps[3 + i];
  assert.equal(step.canvas.state.processing, expected.pillar, `Step ${step.id}: processing pillar`);
  assert.deepEqual(plain(step.canvas.highlights), [{ kind: "cell", id: expected.target }], `Step ${step.id}: highlight`);
  const before = keySet(steps[2 + i].canvas.state.walls);
  const added = step.canvas.state.walls.filter(key => !before.has(key));
  assert.deepEqual(added, [expected.target], `Step ${step.id}: exactly one new wall`);
});
for (const step of [steps[0], steps[1], steps[2], steps[12]]) {
  assert.equal(step.canvas.state.processing, null, `Step ${step.id}: no processing`);
  assert.deepEqual(plain(step.canvas.highlights), [], `Step ${step.id}: no highlight`);
}
assert.deepEqual(keySet(steps[12].canvas.state.walls), expectedMain, "Final step is the verified completed maze");
assert.deepEqual(keySet(steps[11].canvas.state.walls), expectedMain, "Last extension already completes the maze");

// 完成迷路は完全迷路（全通路がつながる）。
const seen = new Set(["1,1"]), queue = ["1,1"];
while (queue.length) {
  const [x, y] = queue.shift().split(",").map(Number);
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const next = `${x + dx},${y + dy}`;
    if (!expectedMain.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
  }
}
assert.equal(seen.size, 81 - 50, "Completed maze is fully connected (perfect maze)");

// 実描画: 壁の数と、伸長ステップの highlight 枠が SVG に現れる。
for (const step of steps) {
  const html = renderToStaticMarkup(createElement(WallExtensionExecutionCanvas, { canvas: step.canvas }));
  assert(html.includes('viewBox="0 0 600 450"'));
  assert.equal((html.match(/data-maze-wall="true"/g) ?? []).length, step.canvas.state.walls.length, `Step ${step.id}: wall count`);
  const highlights = [...html.matchAll(/data-maze-highlight="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(highlights, plain(step.canvas.highlights.map(highlight => highlight.id)), `Step ${step.id}: rendered highlight`);
  // 壁マスの highlight は実線の枠（破線にしない）。
  if (highlights.length) assert(!/data-maze-highlight[^>]*stroke-dasharray/.test(html), `Step ${step.id}: wall highlight is a solid frame`);
}
const previewHtml = renderToStaticMarkup(createElement(WallExtensionExecutionPreview));
assert(previewHtml.includes('aria-label="動きの説明"') && previewHtml.includes(steps[0].caption));
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "wall-extension-execution"'));
const drawingSource = fs.readFileSync(`${root}/player/MazeGridDrawing.tsx`, "utf8");
assert(drawingSource.includes("data-maze-highlight") && drawingSource.includes("wallSet.has(key) ? undefined"));

// フェーズ2の検証は、壁でないマスの highlight と target の使用を弾く。
const settled = plain(steps[3].canvas);
assert.throws(() => validate({ ...settled, highlights: [{ kind: "cell", id: "1,1" }] }), /just became a wall/);
assert.throws(() => validate({ ...settled, highlights: [], state: { ...settled.state, target: "1,1" } }), /target must be null/);
console.log("Wall-extension execution: 13 steps, verified 9x9 trace (pillars, directions, one new wall per extension), perfect maze, solid wall highlight frames and standalone preview passed.");
