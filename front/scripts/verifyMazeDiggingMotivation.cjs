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
    if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
    const base = name.startsWith("@/") ? path.resolve(__dirname, "../src", name.slice(2)) : path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const feature = `${root}/units/maze-digging/motivation`;
const plain = value => JSON.parse(JSON.stringify(value));
const { mazeDiggingMotivationContent: content } = load(`${feature}/motivation.content.ts`);
const { validateMazeDiggingMotivationCanvas: validate } = load(`${feature}/motivation.types.ts`);
const { validateMazeGridCanvas } = load(`${root}/player/mazeGrid.types.ts`);
const { validateMazeDiggingCanvas } = load(`${root}/units/maze-digging/mazeDiggingCanvas.ts`);
const maze = load(`${root}/units/maze-digging/mazeDiggingMaze.ts`);
const { MazeDiggingMotivationCanvas } = load(`${feature}/MazeDiggingMotivationCanvas.tsx`);
const { MazeDiggingMotivationPreview } = load(`${feature}/MazeDiggingMotivationPreview.tsx`);
const { steps } = content;
const get = id => { const step = steps.find(step => step.id === id); assert(step, `Missing scene: ${id}`); return step.canvas; };
const keySet = keys => new Set(keys);

// 契約 maze-digging-v1 を独立に再実装し、教材の盤面と突き合わせる（基準データ §1・§2）。
function referenceDig(size, choices) {
  const grid = Array.from({ length: size }, () => Array(size).fill(1));
  grid[1][1] = 0;
  const stack = [[1, 1]];
  const snapshots = [];
  let step = 0;
  const wallsOf = () => {
    const walls = new Set();
    grid.forEach((row, y) => row.forEach((cell, x) => { if (cell === 1) walls.add(`${x},${y}`); }));
    return walls;
  };
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const candidates = [];
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + 2 * dx, ny = y + 2 * dy;
      if (nx >= 1 && nx < size - 1 && ny >= 1 && ny < size - 1 && grid[ny][nx] === 1) candidates.push([nx, ny]);
    }
    if (candidates.length) {
      const [nx, ny] = candidates[choices[step]]; step += 1;
      grid[(y + ny) / 2][(x + nx) / 2] = 0; grid[ny][nx] = 0;
      stack.push([nx, ny]);
      const stackPath = [];
      stack.forEach(([rx, ry], index) => {
        if (index > 0) { const [px, py] = stack[index - 1]; stackPath.push(`${(px + rx) / 2},${(py + ry) / 2}`); }
        stackPath.push(`${rx},${ry}`);
      });
      snapshots.push({ walls: wallsOf(), from: `${x},${y}`, room: `${nx},${ny}`, between: `${(x + nx) / 2},${(y + ny) / 2}`, stackPath });
    } else {
      stack.pop();
    }
  }
  assert.equal(step, choices.length, "Reference consumes every choice");
  return { walls: wallsOf(), snapshots };
}
const expectedMain = referenceDig(9, [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0]);
const expectedSmall = referenceDig(7, [0, 0, 0, 1, 0, 1, 0, 0]);
assert.equal(expectedMain.walls.size, 50); assert.equal(expectedSmall.walls.size, 32);
assert.equal(expectedMain.snapshots.length, 15); assert.equal(expectedSmall.snapshots.length, 8);

assert.equal(content.id, "maze-digging-motivation"); assert.equal(content.phase, 1); assert.equal(content.stageName, "導入");
assert(content.intervalMs >= 2500);
assert.deepEqual(plain(steps.map(step => step.id)), [
  "maze-question", "another-maze", "all-walls", "dig-start", "first-dig", "backtrack", "complete-and-exit",
]);
assert(steps.every(step => (step.caption.match(/[。？]/gu) ?? []).length === 1), "One sentence per scene");
assert(!steps.some(step => /穴掘り法|フェーズ/u.test(step.caption)), "No algorithm name or developer terms in phase 1");
assert(steps.slice(0, -1).every(step => step.canvas.state.exit === null), "Exit only on the last scene");
assert.deepEqual(plain(steps.at(-1).canvas.state.exit), { label: "動きの説明へ進む", nextPhase: 2 });
assert.equal(content.vocabulary.length, new Set(content.vocabulary.map(entry => entry.concept)).size);
assert(content.vocabulary.every(entry => steps.some(step => step.id === entry.firstStepId)));
for (const step of steps) validate(step.canvas);

// 完成迷路は検証済みトレースと一致する（手書きの盤面ではない）。
assert.equal(get("maze-question").data.size, 9);
assert.deepEqual(keySet(get("maze-question").state.walls), expectedMain.walls);
assert.deepEqual(keySet(maze.mazeDiggingWalls(maze.buildMazeDiggingGrid(9, maze.mazeDiggingMainChoices))), expectedMain.walls);
assert.deepEqual(keySet(get("another-maze").state.walls), expectedSmall.walls);
assert.deepEqual(keySet(maze.mazeDiggingWalls(maze.buildMazeDiggingGrid(7, maze.mazeDiggingSmallChoices))), expectedSmall.walls);
assert.deepEqual(keySet(get("complete-and-exit").state.walls), expectedMain.walls);

// 途中状態は「全部壁 → 開始マス → 最初の掘削 → バックトラック後の掘り直し」の順に積み上がる。
assert.equal(get("all-walls").state.walls.length, 81);
const digStart = get("dig-start");
assert.equal(digStart.state.walls.length, 80); assert(!digStart.state.walls.includes("1,1"));
assert.equal(digStart.state.processing, "1,1");
assert.deepEqual(plain(digStart.highlights.map(highlight => highlight.id)), ["1,1"]);
const firstDig = get("first-dig");
assert.deepEqual(keySet(firstDig.state.walls), expectedMain.snapshots[0].walls);
assert.equal(firstDig.state.processing, "3,1");
assert.deepEqual(keySet(firstDig.highlights.map(highlight => highlight.id)), new Set(["2,1", "3,1"]));
const backtrack = get("backtrack");
assert.deepEqual(keySet(backtrack.state.walls), expectedMain.snapshots[6].walls);
assert.equal(backtrack.state.processing, "7,5");
assert.deepEqual(plain(backtrack.state.path), ["1,1", "2,1", "3,1", "3,2", "3,3", "4,3", "5,3", "6,3", "7,3", "7,4", "7,5"]);
assert.deepEqual(plain(backtrack.state.path), expectedMain.snapshots[6].stackPath);
assert.deepEqual(keySet(backtrack.highlights.map(highlight => highlight.id)), new Set(["7,4", "7,5"]));

// 主教材の経路はスタートからゴールまで壁を避けてつながる（独立に到達可能性も確認する）。
const main = get("maze-question");
assert.equal(main.state.start, "1,1"); assert.equal(main.state.goal, "7,7");
const route = main.state.path;
assert.equal(route.length, 17);
assert.equal(route[0], "1,1"); assert.equal(route.at(-1), "7,7");
assert.deepEqual(plain(route), plain(maze.solveMazeDiggingPath(maze.buildMazeDiggingGrid(9, maze.mazeDiggingMainChoices), "1,1", "7,7")));
route.forEach((key, index) => {
  assert(!expectedMain.walls.has(key), `Route must avoid walls: ${key}`);
  if (index > 0) {
    const [px, py] = route[index - 1].split(",").map(Number), [x, y] = key.split(",").map(Number);
    assert.equal(Math.abs(px - x) + Math.abs(py - y), 1, "Route moves one cell at a time");
  }
});
const seen = new Set(["1,1"]), queue = ["1,1"];
while (queue.length) {
  const [x, y] = queue.shift().split(",").map(Number);
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const next = `${x + dx},${y + dy}`;
    if (!expectedMain.walls.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
  }
}
assert(seen.has("7,7") && seen.size === 81 - 50, "Main maze is fully connected (perfect maze)");

// 検証は単元側の意味で行う。共有バリデータ（棒倒し法の前提）では穴掘り法の状態と矛盾することも固定する。
assert.throws(() => validateMazeGridCanvas(plain(digStart)), /Processing cell must be a wall/);
const wallProcessing = plain(digStart);
wallProcessing.state = { ...wallProcessing.state, processing: "0,0" };
assert.throws(() => validateMazeDiggingCanvas(wallProcessing), /Processing cell must be an open cell/);
const openTarget = plain(firstDig);
openTarget.state = { ...openTarget.state, target: "3,1" };
assert.throws(() => validateMazeDiggingCanvas(openTarget), /Target cell must still be a wall/);
const wallTarget = plain(firstDig);
wallTarget.state = { ...wallTarget.state, target: "5,1" };
validateMazeDiggingCanvas(wallTarget);

// 実描画: 壁の数・経路・旗・出口ボタンが SVG に現れる。
for (const step of steps) {
  const html = renderToStaticMarkup(createElement(MazeDiggingMotivationCanvas, { canvas: step.canvas }));
  assert(html.includes('viewBox="0 0 600 450"') && html.includes('preserveAspectRatio="xMidYMid meet"'));
  assert.equal((html.match(/data-maze-wall="true"/g) ?? []).length, step.canvas.state.walls.length);
  assert(!html.includes("フェーズ"));
  if (step.canvas.state.exit) assert.match(html, /<button[^>]+disabled=""[^>]*>動きの説明へ進む<\/button>/);
}
const firstHtml = renderToStaticMarkup(createElement(MazeDiggingMotivationCanvas, { canvas: main }));
assert(firstHtml.includes("data-maze-path="));
assert.equal((firstHtml.match(/data-maze-flag=/g) ?? []).length, 2);
const backtrackHtml = renderToStaticMarkup(createElement(MazeDiggingMotivationCanvas, { canvas: backtrack }));
assert(backtrackHtml.includes("data-maze-path="));
const previewHtml = renderToStaticMarkup(createElement(MazeDiggingMotivationPreview));
assert(previewHtml.includes('aria-label="導入"') && previewHtml.includes(steps[0].caption));

// 描画は共有基盤へ委譲し、色は playerTokens のみで決める。
const canvasSource = fs.readFileSync(`${feature}/MazeDiggingMotivationCanvas.tsx`, "utf8");
assert(canvasSource.includes("MazeGridDrawing") && canvasSource.includes("PhaseNextButton"));
const previewSource = fs.readFileSync(`${feature}/MazeDiggingMotivationPreview.tsx`, "utf8");
assert.match(previewSource, /width: "84vw", height: "84dvh"/);
// 接続ポートは単元フロー（接続Issue）向けの任意 props。単品では未指定で従来どおり動き、外部通信や保存は持たない。
assert.match(previewSource, /onComplete\?: \(\) => void/);
assert.doesNotMatch(previewSource, /fetch\(|localStorage/);

console.log("Maze-digging motivation: canonical digging trace (15 digs on 9x9, 8 on 7x7), reversed grid semantics with unit-side validation, compressed first backtrack, scene sequence, rendering and preview registration checks passed.");
