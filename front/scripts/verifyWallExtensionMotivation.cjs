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
const feature = `${root}/wall-extension/motivation`;
const plain = value => JSON.parse(JSON.stringify(value));
const { wallExtensionMotivationContent: content } = load(`${feature}/motivation.content.ts`);
const { validateWallExtensionMotivationCanvas: validate } = load(`${feature}/motivation.types.ts`);
const { validateMazeGridCanvas } = load(`${root}/player/mazeGrid.types.ts`);
const maze = load(`${root}/wall-extension/wallExtensionMaze.ts`);
const { WallExtensionMotivationCanvas } = load(`${feature}/WallExtensionMotivationCanvas.tsx`);
const { WallExtensionMotivationPreview } = load(`${feature}/WallExtensionMotivationPreview.tsx`);
const { steps } = content;
const get = id => { const step = steps.find(step => step.id === id); assert(step, `Missing scene: ${id}`); return step.canvas; };
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
const expectedSmall = referenceWalls(7, [1, 2, 2, 0]);
assert.equal(expectedMain.size, 50); assert.equal(expectedSmall.size, 32);

assert.equal(content.id, "wall-extension-motivation"); assert.equal(content.phase, 1); assert.equal(content.stageName, "導入");
assert(content.intervalMs >= 2500);
assert.deepEqual(plain(steps.map(step => step.id)), [
  "maze-question", "another-maze", "empty-board", "border-walls", "pillars", "first-extension", "complete-and-exit",
]);
assert(steps.every(step => (step.caption.match(/[。？]/gu) ?? []).length === 1), "One sentence per scene");
assert(!steps.some(step => /棒倒し法|フェーズ/u.test(step.caption)), "No algorithm name or developer terms in phase 1");
assert(steps.slice(0, -1).every(step => step.canvas.state.exit === null), "Exit only on the last scene");
assert.deepEqual(plain(steps.at(-1).canvas.state.exit), { label: "動きの説明へ進む", nextPhase: 2 });
assert.equal(content.vocabulary.length, new Set(content.vocabulary.map(entry => entry.concept)).size);
assert(content.vocabulary.every(entry => steps.some(step => step.id === entry.firstStepId)));
for (const step of steps) validate(step.canvas);

// 完成迷路は検証済みトレースと一致する（手書きの壁リストではない）。
assert.equal(get("maze-question").data.size, 9);
assert.deepEqual(keySet(get("maze-question").state.walls), expectedMain);
assert.deepEqual(keySet(maze.buildWallExtensionWalls(9, maze.wallExtensionMainChoices)), expectedMain);
assert.deepEqual(keySet(get("another-maze").state.walls), expectedSmall);
assert.deepEqual(keySet(get("complete-and-exit").state.walls), expectedSmall);
assert.deepEqual(keySet(maze.buildWallExtensionWalls(7, maze.wallExtensionSmallChoices)), expectedSmall);

// 途中状態は外周→柱→最初の伸長の順に積み上がる。
const borderOnly = new Set([...expectedSmall].filter(key => { const [x, y] = key.split(",").map(Number); return x === 0 || y === 0 || x === 6 || y === 6; }));
assert.equal(borderOnly.size, 24);
assert.deepEqual(keySet(get("empty-board").state.walls), new Set());
assert.deepEqual(keySet(get("border-walls").state.walls), borderOnly);
const withPillars = new Set([...borderOnly, "2,2", "4,2", "2,4", "4,4"]);
assert.deepEqual(keySet(get("pillars").state.walls), withPillars);
assert.deepEqual(keySet(get("first-extension").state.walls), withPillars);
assert.equal(get("first-extension").state.processing, "2,2");
assert.equal(get("first-extension").state.target, "2,3");

// 主教材の経路はスタートからゴールまで壁を避けてつながる（独立に到達可能性も確認する）。
const main = get("maze-question");
assert.equal(main.state.start, "1,7"); assert.equal(main.state.goal, "7,7");
const route = main.state.path;
assert.equal(route[0], "1,7"); assert.equal(route.at(-1), "7,7");
route.forEach((key, index) => {
  assert(!expectedMain.has(key), `Route must avoid walls: ${key}`);
  if (index > 0) {
    const [px, py] = route[index - 1].split(",").map(Number), [x, y] = key.split(",").map(Number);
    assert.equal(Math.abs(px - x) + Math.abs(py - y), 1, "Route moves one cell at a time");
  }
});
const seen = new Set(["1,7"]), queue = ["1,7"];
while (queue.length) {
  const [x, y] = queue.shift().split(",").map(Number);
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const next = `${x + dx},${y + dy}`;
    if (!expectedMain.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
  }
}
assert(seen.has("7,7") && seen.size === 81 - 50, "Main maze is fully connected (perfect maze)");

// 実描画: 壁の数・経路・旗・出口ボタンが SVG に現れる。
for (const step of steps) {
  const html = renderToStaticMarkup(createElement(WallExtensionMotivationCanvas, { canvas: step.canvas }));
  assert(html.includes('viewBox="0 0 600 450"') && html.includes('preserveAspectRatio="xMidYMid meet"'));
  assert.equal((html.match(/data-maze-wall="true"/g) ?? []).length, step.canvas.state.walls.length);
  assert(!html.includes("フェーズ"));
  if (step.canvas.state.exit) assert.match(html, /<button[^>]+disabled=""[^>]*>動きの説明へ進む<\/button>/);
}
const firstHtml = renderToStaticMarkup(createElement(WallExtensionMotivationCanvas, { canvas: main }));
assert(firstHtml.includes("data-maze-path="));
assert.equal((firstHtml.match(/data-maze-flag=/g) ?? []).length, 2);
const previewHtml = renderToStaticMarkup(createElement(WallExtensionMotivationPreview));
assert(previewHtml.includes('aria-label="導入"') && previewHtml.includes(steps[0].caption));

// 描画基盤は playerTokens のみで色を決め、HEX を直書きしない。
const drawingSource = fs.readFileSync(`${root}/player/MazeGridDrawing.tsx`, "utf8");
assert(drawingSource.includes("playerTokens") && !/#[0-9a-fA-F]{6}/.test(drawingSource));
const canvasSource = fs.readFileSync(`${feature}/WallExtensionMotivationCanvas.tsx`, "utf8");
assert(canvasSource.includes("MazeGridDrawing") && canvasSource.includes("PhaseNextButton"));
const previewSource = fs.readFileSync(`${feature}/WallExtensionMotivationPreview.tsx`, "utf8");
assert.match(previewSource, /width: "84vw", height: "84dvh"/);
assert.doesNotMatch(previewSource, /onLearningEvent|onComplete|fetch\(|localStorage/);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8").includes('contentId === "wall-extension-motivation"'));

// 基盤の検証は不正な盤面を弾く。
const broken = { data: { kind: "maze-grid", size: 7 }, state: { walls: [], processing: null, target: null, path: [], start: null, goal: null }, highlights: [] };
assert.throws(() => validateMazeGridCanvas({ ...broken, data: { kind: "maze-grid", size: 8 } }), /odd integer/);
assert.throws(() => validateMazeGridCanvas({ ...broken, state: { ...broken.state, walls: ["7,0"] } }), /out of range/);
assert.throws(() => validateMazeGridCanvas({ ...broken, state: { ...broken.state, walls: ["0,0", "0,0"] } }), /Duplicate wall/);
assert.throws(() => validateMazeGridCanvas({ ...broken, state: { ...broken.state, walls: ["2,2"], target: "2,2" } }), /must not be a wall yet/);
assert.throws(() => validateMazeGridCanvas({ ...broken, state: { ...broken.state, processing: "2,2" } }), /must be a wall/);
assert.throws(() => validateMazeGridCanvas({ ...broken, state: { ...broken.state, walls: ["1,0"], start: "0,0", goal: "2,0", path: ["0,0", "1,0", "2,0"] } }), /must be open/);
assert.throws(() => validateMazeGridCanvas({ ...broken, state: { ...broken.state, start: "0,0", goal: "2,0", path: ["0,0", "2,0"] } }), /one cell at a time/);
assert.throws(() => validate({ ...get("complete-and-exit"), state: { ...get("complete-and-exit").state, exit: { label: "x", nextPhase: 3 } } }), /phase 2/);
console.log("Wall-extension motivation: 7 scenes, verified 9x9/7x7 mazes (50/32 walls), connected route, grid foundation validation, rendering and standalone exit passed.");
