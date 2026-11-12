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
// 32ステップ = コード対応29（空1＋外周9＋柱9＋伸長9＋完成1）＋説明専用3（#314）。
assert.equal(steps.length, 32, "Phase 2 has 32 steps");
const pillarIds = expectedTrace.map(({ pillar }) => `pillar-${pillar.split(",").join("-")}`);
assert.deepEqual(plain(steps.map(step => step.id)), [
  "empty-board",
  ...Array.from({ length: 9 }, (_, i) => `border-${i}`),
  ...pillarIds,
  "directions-rule",
  ...expectedTrace.map(({ pillar }) => `extend-${pillar.split(",").join("-")}`),
  "complete",
  "loop-what-if",
  "another-maze",
]);
// 説明専用ステップは3つだけで、コード対応ステップが29であることを共有ヘルパーでも確認する。
const { codeMappedSteps } = load(`${root}/player/content.types.ts`);
assert.deepEqual(plain(steps.filter(step => step.explanationOnly).map(step => step.id)),
  ["directions-rule", "loop-what-if", "another-maze"]);
assert.equal(codeMappedSteps(content).length, 29, "29 code-mapped steps feed phase-4 checkpoints");
assert.deepEqual(plain(steps.map(step => step.caption)), [
  "9×9の空の盤面を用意します。",
  "外側の壁を、端から1マス目まで作ります。",
  "外側の壁を、端から2マス目まで広げます。",
  "外側の壁を、端から3マス目まで広げます。",
  "外側の壁を、端から4マス目まで広げます。",
  "外側の壁を、端から5マス目まで広げます。",
  "外側の壁を、端から6マス目まで広げます。",
  "外側の壁を、端から7マス目まで広げます。",
  "外側の壁を、端から8マス目まで広げます。",
  "外側を、すべて壁で囲みました。",
  "外側から1マス空けて2マスおきに柱を立てるのは、間に壁を伸ばす場所と通路を残すためです。",
  "一番上の段の真ん中に、柱を立てます。",
  "一番上の段の右に、柱を立てます。",
  "真ん中の段の左に、柱を立てます。",
  "真ん中の段の真ん中に、柱を立てます。",
  "真ん中の段の右に、柱を立てます。",
  "一番下の段の左に、柱を立てます。",
  "一番下の段の真ん中に、柱を立てます。",
  "一番下の段の右に、柱を立てます。",
  "一番上の段の柱は上下左右の4方向へ、それ以外の柱は、上へ伸ばすと輪ができるため上を除く3方向へ、壁を伸ばせます。",
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
  "下の段の柱から上へ伸ばすと、壁がつながって輪になり、間のマスが囲まれてしまうため、上には伸ばしません。",
  "倒す方向をランダムに選ぶと、作るたびに違う形の迷路になります。",
]);
assert(steps.every(step => (step.caption.match(/。/gu) ?? []).length === 1), "One sentence per step");
for (const step of steps) {
  validate(step.canvas);
  assert.equal(step.canvas.data.size, 9);
  assert.equal(step.canvas.state.target, null);
  assert.deepEqual(plain(step.canvas.state.path), []);
  assert.equal(step.canvas.state.start, null); assert.equal(step.canvas.state.goal, null);
}

// 盤面の積み上がり: 空→外周はループ1周ごとに最大4マス→柱は1本ごと→方向ステップは変化なし
// →伸長ごとにちょうど1マス→完成。完成後（index 29）まで壁は単調に増える。
const wallCounts = steps.map(step => step.canvas.state.walls.length);
assert.deepEqual(plain(wallCounts), [
  0, 3, 7, 11, 15, 19, 23, 27, 31, 32,
  33, 34, 35, 36, 37, 38, 39, 40, 41,
  41,
  42, 43, 44, 45, 46, 47, 48, 49, 50,
  50, 50, 50,
]);
steps.forEach((step, index) => {
  if (index === 0 || index > 29) return;
  const before = keySet(steps[index - 1].canvas.state.walls), after = keySet(step.canvas.state.walls);
  assert([...before].every(key => after.has(key)), `Step ${step.id}: walls only grow`);
});
const borderOnly = new Set([...expectedMain].filter(key => { const [x, y] = key.split(",").map(Number); return x === 0 || y === 0 || x === 8 || y === 8; }));
assert.equal(borderOnly.size, 32);
assert.deepEqual(keySet(steps[9].canvas.state.walls), borderOnly, "Border loop completes the full border at border-8");
assert.deepEqual(keySet(steps[18].canvas.state.walls),
  new Set([...borderOnly, ...expectedTrace.map(({ pillar }) => pillar)]));

// 方向ステップ（説明専用）: 盤面は完成した柱まで、処理中の柱は一番上の段の柱。
assert.equal(steps[19].canvas.state.processing, "2,2");
assert.deepEqual(plain(steps[19].canvas.highlights), []);
assert.deepEqual(keySet(steps[19].canvas.state.walls), keySet(steps[18].canvas.state.walls));

// 伸長ステップ: processing は柱、highlights は今回壁になったマス、増えた壁はその1マスだけ。
expectedTrace.forEach((expected, i) => {
  const step = steps[20 + i];
  assert.equal(step.canvas.state.processing, expected.pillar, `Step ${step.id}: processing pillar`);
  assert.deepEqual(plain(step.canvas.highlights), [{ kind: "cell", id: expected.target }], `Step ${step.id}: highlight`);
  const before = keySet(steps[19 + i].canvas.state.walls);
  const added = step.canvas.state.walls.filter(key => !before.has(key));
  assert.deepEqual(plain(added), [expected.target], `Step ${step.id}: exactly one new wall`);
});
for (const step of [steps[0], ...steps.slice(1, 19), steps[29], steps[31]]) {
  assert.equal(step.canvas.state.processing, null, `Step ${step.id}: no processing`);
  assert.deepEqual(plain(step.canvas.highlights), [], `Step ${step.id}: no highlight`);
}
assert.deepEqual(keySet(steps[29].canvas.state.walls), expectedMain, "Complete step is the verified completed maze");
assert.deepEqual(keySet(steps[28].canvas.state.walls), expectedMain, "Last extension already completes the maze");

// 輪の実演（説明専用）: 柱（6, 4）が上へ伸ばした仮定の盤面。正本との差は (6,5)→(6,3) のみで、
// (5,3) が四方を壁に囲まれ、残りの通路はすべてつながったままになる。
const whatIf = steps[30];
assert.equal(whatIf.canvas.state.processing, "6,4");
assert.deepEqual(plain(whatIf.canvas.highlights), [{ kind: "cell", id: "6,3" }]);
const whatIfWalls = keySet(whatIf.canvas.state.walls);
assert.deepEqual(whatIfWalls, new Set([...expectedMain].filter(key => key !== "6,5").concat("6,3")),
  "What-if board swaps exactly one extension target");
assert(!whatIfWalls.has("5,3"), "Enclosed cell stays a passage");
for (const neighbor of ["5,2", "5,4", "4,3", "6,3"]) assert(whatIfWalls.has(neighbor), `(5,3) is enclosed: ${neighbor} is a wall`);
const whatIfSeen = new Set(["1,1"]), whatIfQueue = ["1,1"];
while (whatIfQueue.length) {
  const [x, y] = whatIfQueue.shift().split(",").map(Number);
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const next = `${x + dx},${y + dy}`;
    if (!whatIfWalls.has(next) && !whatIfSeen.has(next)) { whatIfSeen.add(next); whatIfQueue.push(next); }
  }
}
assert.equal(whatIfSeen.size, 30, "All passages except the enclosed one stay connected");
assert(!whatIfSeen.has("5,3"), "Enclosed cell is unreachable");

// 別の迷路（説明専用）: 主教材と違う形で、通路がすべてつながる完全迷路である。
const anotherWalls = keySet(steps[31].canvas.state.walls);
assert.equal(anotherWalls.size, 50);
assert.notDeepEqual(anotherWalls, expectedMain, "Another maze differs from the main maze");
const anotherSeen = new Set(["1,1"]), anotherQueue = ["1,1"];
while (anotherQueue.length) {
  const [x, y] = anotherQueue.shift().split(",").map(Number);
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const next = `${x + dx},${y + dy}`;
    if (!anotherWalls.has(next) && !anotherSeen.has(next)) { anotherSeen.add(next); anotherQueue.push(next); }
  }
}
assert.equal(anotherSeen.size, 31, "Another maze is a perfect maze (all passages connected)");

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
const settled = plain(steps[20].canvas);
assert.throws(() => validate({ ...settled, highlights: [{ kind: "cell", id: "1,1" }] }), /just became a wall/);
assert.throws(() => validate({ ...settled, highlights: [], state: { ...settled.state, target: "1,1" } }), /target must be null/);
console.log("Wall-extension execution: 32 steps (29 code-mapped + 3 explanation-only), per-iteration border growth, one pillar at a time, verified 9x9 trace, loop what-if enclosure, another perfect maze, solid wall highlight frames and standalone preview passed.");
