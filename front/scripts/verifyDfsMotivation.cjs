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
const feature = `${root}/dfs/motivation`;
const plain = value => JSON.parse(JSON.stringify(value));
const { dfsMotivationContent: content, dfsMotivationWalk } = load(`${feature}/motivation.content.ts`);
const { validateDfsMotivationCanvas: validate } = load(`${feature}/motivation.types.ts`);
const { searchGraph: graph, searchMaze: maze } = load(`${root}/graphs/searchGraph.ts`);
const { bfsMotivationContent: bfs } = load(`${root}/bfs/motivation/motivation.content.ts`);
const { DfsMotivationCanvas } = load(`${feature}/DfsMotivationCanvas.tsx`);
const { DfsMotivationPreview } = load(`${feature}/DfsMotivationPreview.tsx`);
const { steps } = content;
const get = id => { const step = steps.find(step => step.id === id); assert(step, `Missing scene: ${id}`); return step.canvas; };
assert.equal(content.id, "dfs-motivation"); assert.equal(content.phase, 1); assert.equal(content.stageName, "導入");
assert(content.intervalMs >= 2500);
assert.deepEqual(plain(steps.map(step => step.id)), [
  "maze-question", "compare-wander", "compare-dive", "dive-one", "dive-two", "dive-three", "dive-four", "dive-five",
  "return-trail", "label-maze", "map-to-graph", "graph-restart", "graph-walk-one", "graph-walk-two", "graph-walk-three",
  "utility-transition", "utility-folder", "name-and-exit",
]);
assert(steps.every(step => (step.caption.match(/[。？]/gu) ?? []).length === 1), "One sentence per scene");
assert(!steps.slice(0, -1).some(step => /深さ優先探索|DFS|スタック|再帰/u.test(step.caption)));
assert.match(steps.at(-1).caption, /深さ優先探索/u);
assert(!steps.some(step => /フェーズ|最短|最少|何歩|\d歩/u.test(step.caption)), "No developer terms or shortest-path claims");
assert(steps.slice(0, -1).every(step => !step.canvas.state.exit));
assert.equal(steps.at(-1).canvas.state.exit, true);
assert.equal(content.vocabulary.length, new Set(content.vocabulary.map(entry => entry.concept)).size);
assert(content.vocabulary.every(entry => steps.some(step => step.id === entry.firstStepId)));

// BFSの正本と参照同一。座標・辺・格子をコピーして別グラフを作ることも許さない。
assert.equal(bfs.steps[0].canvas.data.graph, graph);
assert.equal(bfs.steps[0].canvas.data.maze, maze);
for (const step of [...steps].reverse()) {
  validate(step.canvas);
  assert.equal(step.canvas.data.graph, graph);
  assert.equal(step.canvas.data.maze, maze);
  assert.equal(step.canvas.data.treasure, "C");
  assert.equal(step.canvas.data.graph.layers.length, 0);
}
for (const a of maze.places) for (const b of maze.places) {
  const adjacent = Math.abs(a.row - b.row) + Math.abs(a.column - b.column) === 1;
  const connected = graph.edges.some(edge => edge.from === a.id && edge.to === b.id || edge.from === b.id && edge.to === a.id);
  assert.equal(connected, adjacent);
}
// コードのmark-at-push／逆順投入を独立に実行し、正本の隣接順で訪問順を求める。
const neighbors = id => graph.edges.flatMap(edge => edge.from === id ? [edge.to] : edge.to === id ? [edge.from] : []);
assert.deepEqual(plain(Object.fromEntries(graph.nodes.map(node => [node.id, neighbors(node.id)]))), {
  A: ["B", "C"], B: ["A", "D", "E"], C: ["A", "E"], D: ["B", "F"], E: ["B", "C", "F"], F: ["D", "E"],
});
const stack = ["A"], seen = new Set(stack), order = [];
while (stack.length) {
  const current = stack.pop(); order.push(current);
  for (const next of [...neighbors(current)].reverse()) if (!seen.has(next)) { seen.add(next); stack.push(next); }
}
assert.deepEqual(order, ["A", "B", "D", "F", "E", "C"]);
assert.deepEqual(plain(dfsMotivationWalk), order);
for (const group of [["dive-one", "dive-two", "dive-three", "dive-four", "dive-five"], ["graph-walk-one", "graph-walk-two", "graph-walk-three"]]) {
  const movement = ["A", ...group.flatMap(id => [...get(id).state.movement].slice(1))];
  assert.deepEqual(movement, order, "Both concrete and graph walks visit the same places, in the same order");
  assert.deepEqual(plain(get(group.at(-1)).state.trail), order);
}
assert.deepEqual(plain(get("compare-wander").state.movement), ["A", "B", "A"]);
assert.equal(get("compare-dive").state.preview, true);
assert.deepEqual(plain(get("graph-restart").state.trail), ["A"]);
assert.deepEqual(get("utility-transition"), get("graph-walk-three"), "The utility cue must not start the folder example");
assert.equal(get("utility-folder").data.view, "folders");
assert.equal(get("label-maze").data.view, "maze");
assert.equal(get("map-to-graph").data.view, "maze", "Label concrete places before switching representation");
assert(get("label-maze").state.showNames && get("map-to-graph").state.annotations);
assert(get("return-trail").state.returnTrail);
assert.equal(get("return-trail").state.current, "C", "The reference scene shows the trail, not an invented backtrack");
assert(steps.slice(0, 7).every(step => !step.canvas.state.treasureVisible));
assert.equal(get("dive-five").state.treasureVisible, true);
assert.deepEqual(plain(get("name-and-exit").highlights), [{ kind: "node", id: "B" }, { kind: "edge", id: "ab" }]);

// 実描画でも宝を先に露出せず、グラフ・格子は共通描画、実用例は図で見せる。
for (const step of steps) {
  const html = renderToStaticMarkup(createElement(DfsMotivationCanvas, { canvas: step.canvas }));
  assert.equal(html.includes("見つけた宝"), step.canvas.state.treasureVisible);
  assert(!html.includes("フェーズ"));
  if (step.canvas.data.view !== "folders") assert(html.includes('viewBox="0 0 600 450"') && html.includes('preserveAspectRatio="xMidYMid meet"'));
  if (step.canvas.data.view === "maze") assert.equal((html.match(/data-maze-place=/g) ?? []).length, 6);
  if (step.canvas.data.view === "graph") assert.equal((html.match(/data-node-id=/g) ?? []).length, 6);
  if (step.canvas.data.view === "folders") assert(html.includes("写真") && html.includes("旅の記録.jpg") && html.includes("メモ.txt"));
  if (step.canvas.state.exit) assert.match(html, /<button[^>]+disabled=""[^>]*>動きの説明へ進む<\/button>/);
}
const firstHtml = renderToStaticMarkup(createElement(DfsMotivationPreview));
assert(firstHtml.includes('aria-label="導入"') && firstHtml.includes(steps[0].caption));
const canvasSource = fs.readFileSync(`${feature}/DfsMotivationCanvas.tsx`, "utf8");
const sharedSource = fs.readFileSync(`${root}/player/MotivationDrawing.tsx`, "utf8");
const bfsCanvasSource = fs.readFileSync(`${root}/bfs/motivation/BfsMotivationCanvas.tsx`, "utf8");
for (const source of [canvasSource, bfsCanvasSource]) assert(source.includes('from "../../player/MotivationDrawing"'));
assert(canvasSource.includes("GraphNodes") && canvasSource.includes("GraphEdges") && canvasSource.includes("GraphViewport"));
assert(canvasSource.includes("useReducedMotion") && sharedSource.includes("graphGeometry"));
const previewSource = fs.readFileSync(`${feature}/DfsMotivationPreview.tsx`, "utf8");
assert.match(previewSource, /width: embedded \? "100%" : "84vw", height: embedded \? "100%" : "84dvh"/);
assert.doesNotMatch(previewSource, /fetch\(|localStorage/);
const embeddedExit = renderToStaticMarkup(createElement(DfsMotivationCanvas, { canvas: steps.at(-1).canvas, onExit() {} }));
assert.match(embeddedExit, /<button(?![^>]+disabled=)[^>]*>動きの説明へ進む<\/button>/);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8").includes('contentId === "dfs-motivation"'));
const first = steps[0].canvas;
assert.throws(() => validate({ ...first, data: { ...first.data, graph: { ...graph, nodes: [] } } }), /canonical/);
assert.throws(() => validate({ ...first, state: { ...first.state, trail: ["A", "F"], current: "F" } }), /Disconnected/);
assert.throws(() => validate({ ...first, state: { ...first.state, treasureVisible: true } }), /Treasure/);
assert.throws(() => validate({ ...first, highlights: [{ kind: "edge", id: "missing" }] }), /highlight/);
console.log("DFS motivation: 18 scenes, canonical shared maze/graph, A-B-D-F-E-C walks, hidden treasure, vocabulary, cue, folder illustration, snapshots and standalone exit passed.");
