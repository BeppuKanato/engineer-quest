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
const feature = `${root}/maze-digging/execution`;
const plain = value => JSON.parse(JSON.stringify(value));
const { mazeDiggingExecutionContent: content } = load(`${feature}/execution.content.ts`);
const { codeMappedSteps } = load(`${root}/player/content.types.ts`);
const { validateMazeDiggingExecutionCanvas: validate } = load(`${feature}/execution.types.ts`);
const maze = load(`${root}/maze-digging/mazeDiggingMaze.ts`);
const { MazeDiggingExecutionCanvas } = load(`${feature}/MazeDiggingExecutionCanvas.tsx`);
const { MazeDiggingExecutionPreview } = load(`${feature}/MazeDiggingExecutionPreview.tsx`);
const { steps } = content;
const keySet = keys => new Set(keys);

// 契約 maze-digging-v1 を独立に再実装し、教材の盤面・ステップと突き合わせる（基準データ §1・§2）。
// バックトラックは「行き止まりから、掘れる部屋に着くまでの巻き戻し」を1イベントにまとめる。
function referenceRun(size, choices) {
  const grid = Array.from({ length: size }, () => Array(size).fill(1));
  grid[1][1] = 0;
  const stack = [[1, 1]];
  const digs = [], backtracks = [];
  let step = 0;
  const wallsOf = () => {
    const walls = new Set();
    grid.forEach((row, y) => row.forEach((cell, x) => { if (cell === 1) walls.add(`${x},${y}`); }));
    return walls;
  };
  const stackPathOf = () => {
    const stackPath = [];
    stack.forEach(([rx, ry], index) => {
      if (index > 0) { const [px, py] = stack[index - 1]; stackPath.push(`${(px + rx) / 2},${(py + ry) / 2}`); }
      stackPath.push(`${rx},${ry}`);
    });
    return stackPath;
  };
  const candidatesOf = ([x, y]) => {
    const candidates = [];
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + 2 * dx, ny = y + 2 * dy;
      if (nx >= 1 && nx < size - 1 && ny >= 1 && ny < size - 1 && grid[ny][nx] === 1) candidates.push([nx, ny]);
    }
    return candidates;
  };
  while (stack.length) {
    const top = stack[stack.length - 1];
    const candidates = candidatesOf(top);
    if (candidates.length) {
      const [nx, ny] = candidates[choices[step]]; step += 1;
      grid[(top[1] + ny) / 2][(top[0] + nx) / 2] = 0; grid[ny][nx] = 0;
      stack.push([nx, ny]);
      digs.push({
        from: `${top[0]},${top[1]}`, room: `${nx},${ny}`, between: `${(top[0] + nx) / 2},${(top[1] + ny) / 2}`,
        walls: wallsOf(), stackPath: stackPathOf(),
      });
    } else {
      const popped = [];
      while (stack.length) {
        popped.push(stack.pop().join(","));
        if (!stack.length || candidatesOf(stack[stack.length - 1]).length) break;
      }
      backtracks.push({
        afterDigIndex: digs.length - 1, popped,
        resume: stack.length ? stack[stack.length - 1].join(",") : null,
        walls: wallsOf(), stackPath: stackPathOf(),
      });
    }
  }
  assert.equal(step, choices.length, "Reference consumes every choice");
  return { walls: wallsOf(), digs, backtracks };
}
const reference = referenceRun(9, [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0]);
assert.equal(reference.walls.size, 50);
assert.equal(reference.digs.length, 15);

// 基準データ §1 の検証済みトレース（現在マス・方向・掘る部屋・間の壁）。
const expectedDigs = [
  { from: "1,1", direction: "右", room: "3,1", between: "2,1" },
  { from: "3,1", direction: "下", room: "3,3", between: "3,2" },
  { from: "3,3", direction: "右", room: "5,3", between: "4,3" },
  { from: "5,3", direction: "右", room: "7,3", between: "6,3" },
  { from: "7,3", direction: "上", room: "7,1", between: "7,2" },
  { from: "7,1", direction: "左", room: "5,1", between: "6,1" },
  { from: "7,3", direction: "下", room: "7,5", between: "7,4" },
  { from: "7,5", direction: "左", room: "5,5", between: "6,5" },
  { from: "5,5", direction: "下", room: "5,7", between: "5,6" },
  { from: "5,7", direction: "左", room: "3,7", between: "4,7" },
  { from: "3,7", direction: "左", room: "1,7", between: "2,7" },
  { from: "1,7", direction: "上", room: "1,5", between: "1,6" },
  { from: "1,5", direction: "上", room: "1,3", between: "1,4" },
  { from: "1,5", direction: "右", room: "3,5", between: "2,5" },
  { from: "5,7", direction: "右", room: "7,7", between: "6,7" },
];
const directionOf = (from, room) => {
  const [fx, fy] = from.split(",").map(Number), [rx, ry] = room.split(",").map(Number);
  return rx > fx ? "右" : rx < fx ? "左" : ry > fy ? "下" : "上";
};
reference.digs.forEach((dig, index) => {
  const expected = expectedDigs[index];
  assert.equal(dig.from, expected.from, `Reference dig ${index + 1}: from`);
  assert.equal(dig.room, expected.room, `Reference dig ${index + 1}: room`);
  assert.equal(dig.between, expected.between, `Reference dig ${index + 1}: between`);
  assert.equal(directionOf(dig.from, dig.room), expected.direction, `Reference dig ${index + 1}: direction`);
});

// 教材モジュールの掘削列とバックトラック導出も、独立再実装と一致する。
const moduleRun = maze.runMazeDigging(9, maze.mazeDiggingMainChoices);
assert.deepEqual(plain(moduleRun.digs.map(({ from, room, between }) => ({ from, room, between }))),
  expectedDigs.map(({ from, room, between }) => ({ from, room, between })), "Maze builder reproduces the verified digs");
reference.digs.forEach((dig, index) => {
  assert.deepEqual(keySet(moduleRun.digs[index].wallsAfter), dig.walls, `Dig ${index + 1}: module walls`);
  assert.deepEqual(plain(moduleRun.digs[index].stackPath), dig.stackPath, `Dig ${index + 1}: module stack path`);
});
// 途中のバックトラックは3回（戻るマス数 2・1・4）。最後の巻き戻し（スタックが空になる）は完成側で、ステップにはしない。
const resumable = reference.backtracks.filter(backtrack => backtrack.resume !== null);
assert.equal(reference.backtracks.length, 4);
assert.equal(reference.backtracks.at(-1).resume, null, "Final drain ends the algorithm, not a backtrack step");
assert.deepEqual(plain(resumable.map(({ afterDigIndex, popped, resume }) => ({ afterDigIndex, popped, resume }))), [
  { afterDigIndex: 5, popped: ["5,1", "7,1"], resume: "7,3" },
  { afterDigIndex: 12, popped: ["1,3"], resume: "1,5" },
  { afterDigIndex: 13, popped: ["3,5", "1,5", "1,7", "3,7"], resume: "5,7" },
]);
const moduleBacktracks = maze.mazeDiggingBacktracks(moduleRun.digs);
assert.equal(moduleBacktracks.length, 3);
resumable.forEach((expected, index) => {
  const actual = moduleBacktracks[index];
  assert.equal(actual.afterDigIndex, expected.afterDigIndex, `Backtrack ${index + 1}: position`);
  assert.deepEqual(plain(actual.poppedRooms), expected.popped, `Backtrack ${index + 1}: popped rooms`);
  assert.equal(actual.resumeRoom, expected.resume, `Backtrack ${index + 1}: resume room`);
  assert.deepEqual(keySet(actual.wallsAfter), expected.walls, `Backtrack ${index + 1}: walls unchanged`);
  assert.deepEqual(plain(actual.stackPath), expected.stackPath, `Backtrack ${index + 1}: stack path after`);
});

assert.equal(content.id, "maze-digging-execution"); assert.equal(content.phase, 2); assert.equal(content.stageName, "動きの説明");
assert(content.intervalMs >= 2500);
assert.equal(steps.length, 23, "Phase 2 keeps all 23 steps (setup 2 + digs 15 + backtracks 3 + complete + 2 explanation-only)");
assert.deepEqual(plain(steps.map(step => step.id)), [
  "all-walls", "dig-start",
  "dig-1", "dig-2", "dig-3", "dig-4", "dig-5", "dig-6", "backtrack-1",
  "dig-7", "dig-8", "dig-9", "dig-10", "dig-11", "dig-12", "dig-13", "backtrack-2",
  "dig-14", "backtrack-3", "dig-15", "complete", "no-loops", "loop-what-if",
]);
assert.deepEqual(plain(steps.map(step => step.caption)), [
  "全部が壁の9×9の盤面を用意します。",
  "まず、スタートの部屋 (1, 1) を掘ります。",
  ...expectedDigs.slice(0, 6).map(({ from, direction }) => `(${from.split(",").reverse().join(", ")}) から${direction}へ掘ります。`),
  "行き止まりになったので、掘れる部屋がある (3, 7) まで戻ります。",
  ...expectedDigs.slice(6, 13).map(({ from, direction }) => `(${from.split(",").reverse().join(", ")}) から${direction}へ掘ります。`),
  "行き止まりになったので、掘れる部屋がある (5, 1) まで戻ります。",
  `(${expectedDigs[13].from.split(",").reverse().join(", ")}) から${expectedDigs[13].direction}へ掘ります。`,
  "行き止まりになったので、掘れる部屋がある (7, 5) まで戻ります。",
  `(${expectedDigs[14].from.split(",").reverse().join(", ")}) から${expectedDigs[14].direction}へ掘ります。`,
  "迷路が完成し、輪がなく、どの部屋からどの部屋へも必ずたどり着けます。",
  "掘り進める先はまだ掘っていない部屋だけなので、通路に輪はできず、どの部屋へも道は1本だけです。",
  "ためしに、すでに掘った部屋へ間の壁を掘ってみると、もとの道と合わせて輪ができてしまいます。",
]);
assert(steps.every(step => (step.caption.match(/。/gu) ?? []).length === 1), "One sentence per step");
for (const step of steps) {
  validate(step.canvas);
  assert.equal(step.canvas.data.size, 9);
  assert.equal(step.canvas.state.target, null);
}

// 盤面の積み上がり: 全部壁（81）→開始マス（80）→掘削ごとにちょうど2マス減り、バックトラックでは変わらない。
const wallCounts = steps.map(step => step.canvas.state.walls.length);
assert.deepEqual(plain(wallCounts), [81, 80, 78, 76, 74, 72, 70, 68, 68, 66, 64, 62, 60, 58, 56, 54, 54, 52, 52, 50, 50, 50, 49]);
steps.forEach((step, index) => {
  if (index === 0) return;
  const before = keySet(steps[index - 1].canvas.state.walls), after = keySet(step.canvas.state.walls);
  assert([...after].every(key => before.has(key)), `Step ${step.id}: walls only shrink`);
});

// 準備ステップ。
const allWalls = steps[0].canvas;
assert.equal(allWalls.state.processing, null); assert.deepEqual(plain(allWalls.state.path), []);
assert.deepEqual(plain(allWalls.highlights), []);
const digStart = steps[1].canvas;
assert(!keySet(digStart.state.walls).has("1,1"), "Start room is dug");
assert.equal(digStart.state.processing, "1,1");
assert.deepEqual(plain(digStart.highlights), [{ kind: "cell", id: "1,1" }]);
assert.deepEqual(plain(digStart.state.path), []);

// 掘削ステップ: processing は掘った部屋、highlights は今回掘れた2マス、壁はその2マスだけ減り、path はスタック経路。
const digSteps = steps.filter(step => /^dig-\d+$/.test(step.id));
assert.equal(digSteps.length, 15);
digSteps.forEach((step, index) => {
  const expected = reference.digs[index];
  assert.equal(step.canvas.state.processing, expected.room, `Step ${step.id}: processing room`);
  assert.deepEqual(keySet(step.canvas.highlights.map(highlight => highlight.id)),
    new Set([expected.between, expected.room]), `Step ${step.id}: highlights`);
  assert.deepEqual(keySet(step.canvas.state.walls), expected.walls, `Step ${step.id}: walls`);
  assert.deepEqual(plain(step.canvas.state.path), expected.stackPath, `Step ${step.id}: stack path`);
  const previous = steps[steps.indexOf(step) - 1].canvas;
  const removed = previous.state.walls.filter(key => !keySet(step.canvas.state.walls).has(key));
  assert.deepEqual(keySet(removed), new Set([expected.between, expected.room]), `Step ${step.id}: exactly two cells dug`);
  assert.equal(step.canvas.state.start, null); assert.equal(step.canvas.state.goal, null);
});

// バックトラックステップ: 盤面は変わらず、現在位置が再開マスへ移り、スタック経路が短くなる。
const backtrackSteps = steps.filter(step => step.id.startsWith("backtrack-"));
assert.equal(backtrackSteps.length, 3);
backtrackSteps.forEach((step, index) => {
  const expected = resumable[index];
  const previous = steps[steps.indexOf(step) - 1].canvas;
  assert.deepEqual(keySet(step.canvas.state.walls), keySet(previous.state.walls), `Step ${step.id}: walls unchanged`);
  assert.equal(step.canvas.state.processing, expected.resume, `Step ${step.id}: resume room`);
  assert.deepEqual(plain(step.canvas.state.path), expected.stackPath, `Step ${step.id}: shortened stack path`);
  assert(step.canvas.state.path.length < previous.state.path.length, `Step ${step.id}: path shrinks`);
  assert.deepEqual(plain(step.canvas.highlights), [], `Step ${step.id}: nothing dug`);
});

// 完成ステップ: 検証済みの完成迷路に、スタートからゴールへの一本道を示す。
const complete = steps.find(step => step.id === "complete").canvas;
assert.deepEqual(keySet(complete.state.walls), reference.walls, "Final step is the verified completed maze");
assert.equal(complete.state.processing, null); assert.deepEqual(plain(complete.highlights), []);
assert.equal(complete.state.start, "1,1"); assert.equal(complete.state.goal, "7,7");
assert.deepEqual(plain(complete.state.path), plain(maze.solveMazeDiggingPath(maze.buildMazeDiggingGrid(9, maze.mazeDiggingMainChoices), "1,1", "7,7")));
assert.equal(complete.state.path.length, 17);

// 完成迷路は完全迷路（全通路がつながる）。
const seen = new Set(["1,1"]), queue = ["1,1"];
while (queue.length) {
  const [x, y] = queue.shift().split(",").map(Number);
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const next = `${x + dx},${y + dy}`;
    if (!reference.walls.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
  }
}
assert.equal(seen.size, 81 - 50, "Completed maze is fully connected (perfect maze)");

// 説明専用ステップ（Issue #334、ガイドライン §2-6）: 完成の後に2つだけ置き、
// コード対応ステップは21のまま（フェーズ4のチェックポイントに含めない）。
assert.deepEqual(plain(steps.filter(step => step.explanationOnly).map(step => step.id)), ["no-loops", "loop-what-if"]);
assert.deepEqual(plain(codeMappedSteps(content).map(step => step.id)), plain(steps.slice(0, 21).map(step => step.id)),
  "Code-mapped steps are exactly the first 21");
const noLoops = steps.find(step => step.id === "no-loops").canvas;
assert.deepEqual(keySet(noLoops.state.walls), reference.walls, "No-loops step shows the completed maze");
assert.equal(noLoops.state.processing, null); assert.deepEqual(plain(noLoops.state.path), []);
assert.deepEqual(plain(noLoops.highlights), []);
// 仮定盤面: 完成迷路から間の壁 (4,1) だけを余分に掘ると、両側の部屋 (3,1)・(5,1) の
// もとの一本道（7マス）と新しい道で輪が閉じる。掘った2マスが highlight、掘り先が処理中。
const whatIf = steps.find(step => step.id === "loop-what-if").canvas;
assert.equal(whatIf.state.walls.length, 49, "What-if board digs exactly one extra wall");
assert(!keySet(whatIf.state.walls).has("4,1"), "What-if digs the between wall (4,1)");
assert([...reference.walls].every(key => key === "4,1" || keySet(whatIf.state.walls).has(key)),
  "What-if walls are the completed walls minus (4,1)");
assert.equal(whatIf.state.processing, "5,1");
assert.deepEqual(keySet(whatIf.highlights.map(highlight => highlight.id)), new Set(["4,1", "5,1"]));
const loopPath = plain(whatIf.state.path);
assert.deepEqual(loopPath, [...plain(maze.solveMazeDiggingPath(maze.buildMazeDiggingGrid(9, maze.mazeDiggingMainChoices), "3,1", "5,1")), "4,1"],
  "What-if path traces the original unique route plus the extra dug wall");
const [lx, ly] = loopPath[0].split(",").map(Number), [ex, ey] = loopPath.at(-1).split(",").map(Number);
assert.equal(Math.abs(lx - ex) + Math.abs(ly - ey), 1, "What-if path closes the loop (last cell adjacent to first)");

// 実描画: 壁の数、highlight（通路マスは破線の枠）、経路、旗が SVG に現れる。
for (const step of steps) {
  const html = renderToStaticMarkup(createElement(MazeDiggingExecutionCanvas, { canvas: step.canvas }));
  assert(html.includes('viewBox="0 0 600 450"'));
  assert.equal((html.match(/data-maze-wall="true"/g) ?? []).length, step.canvas.state.walls.length, `Step ${step.id}: wall count`);
  const highlights = [...html.matchAll(/data-maze-highlight="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(keySet(highlights), keySet(step.canvas.highlights.map(highlight => highlight.id)), `Step ${step.id}: rendered highlight`);
  if (highlights.length) assert(/data-maze-highlight[^>]*stroke-dasharray/.test(html), `Step ${step.id}: dug-cell highlight is a dashed frame`);
  if (step.canvas.state.path.length > 1) assert(html.includes("data-maze-path="), `Step ${step.id}: stack path rendered`);
}
const completeHtml = renderToStaticMarkup(createElement(MazeDiggingExecutionCanvas, { canvas: complete }));
assert.equal((completeHtml.match(/data-maze-flag=/g) ?? []).length, 2, "Complete step shows start and goal flags");
const previewHtml = renderToStaticMarkup(createElement(MazeDiggingExecutionPreview));
assert(previewHtml.includes('aria-label="動きの説明"') && previewHtml.includes(steps[0].caption));
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "maze-digging-execution"'));

// フェーズ2の検証は、壁マスの highlight と target の使用を弾く。
const digOne = plain(steps[2].canvas);
assert.throws(() => validate({ ...digOne, highlights: [{ kind: "cell", id: "0,0" }] }), /just dug/);
const allWallsPlain = plain(steps[0].canvas);
assert.throws(() => validate({ ...allWallsPlain, state: { ...allWallsPlain.state, target: "5,5" } }), /target must be null/);
console.log("Maze-digging execution: 23 steps (21 code-mapped + 2 explanation-only: no-loops / loop-what-if), verified 9x9 trace (15 digs, 3 compressed backtracks with popped counts 2/1/4), stack paths, perfect maze, what-if loop board, dashed dug-cell highlight frames and standalone preview passed.");
