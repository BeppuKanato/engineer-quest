const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: (name) => load(path.resolve(path.dirname(filename), `${name}.ts`)) }, { filename });
  return exports;
}
const feature = path.resolve(__dirname, "../src/features/learning/units/bfs/motivation");
const { bfsMotivationContent: content } = load(path.join(feature, "motivation.content.ts"));
const { validateMotivationCanvas } = load(path.join(feature, "motivation.types.ts"));
const { steps, vocabulary } = content;
const get = (id) => {
  const step = steps.find(step => step.id === id);
  assert(step, `Missing scene ${id}`);
  return step.canvas;
};
assert.equal(content.phase, 1);
assert.equal(steps.length, 22);
assert.equal(steps.slice(10).map(step => step.id).join(), [
  "label-maze", "map-to-graph", "graph-restart", "graph-walk-one", "graph-walk-two",
  "rail-transition", "rail-utility", "method-transition", "grid-origin", "first-wave", "bridge-entrance", "name-and-exit",
].join(), "The revised scenes must keep labels, graph replay, rail and the entrance in order");
assert(!steps.some(step => step.id === "social-utility" || step.canvas.data.view === "social"));
assert(!vocabulary.some(entry => entry.firstStepId === "social-utility"));
assert(content.intervalMs >= 2500);
assert(!steps.slice(0, -1).some(step => /幅優先探索|BFS/u.test(step.caption)), "Name must not appear early");
assert.match(steps.at(-1).caption, /幅優先探索/u);
assert(steps.slice(0, -1).every(step => step.canvas.state.exit === null));
assert.equal(steps.at(-1).canvas.state.exit.nextPhase, 2);
assert(steps.every(step => (step.caption.match(/[。？]/gu) ?? []).length === 1), "One caption sentence per scene");
assert.equal(new Set(vocabulary.map(entry => entry.concept)).size, vocabulary.length);
assert(vocabulary.every(entry => steps.some(step => step.id === entry.firstStepId)));
assert.equal(vocabulary.find(entry => entry.concept === "rail-distance").firstStepId, "rail-transition");
assert.equal(steps.findIndex(step => step.id === "rail-transition") + 1, 16);
assert.equal(steps.findIndex(step => step.id === "grid-origin") + 1, 19);

// クッションは予告のキャプションのみ。図・目標・現在地・道筋・強調・距離を変えない。
assert.deepEqual(get("rail-transition"), get("graph-walk-two"), "Rail cue must preserve the plain graph without starting the station task");
assert.equal(get("rail-transition").data.labels.nodeNames.F, "F");
assert.equal(get("rail-utility").data.labels.nodeNames.F, "F駅");
assert.deepEqual(get("method-transition"), get("rail-utility"), "Method cue must preserve the station example without starting the distance layers");

// 図の接続から最短距離を独立計算し、実用例と手数を確認する（教材の実行ロジックではない）。
const { graph, maze, routes } = steps[0].canvas.data;
// #91: 全7辺の隣接一致だけでなく、左右の流れ・方向キャプションも固定する。
assert.equal(maze.rows, 2);
assert.equal(maze.columns, 3);
assert.deepEqual(JSON.parse(JSON.stringify(maze.places)).sort((a, b) => a.row - b.row || a.column - b.column)
  .map(place => place.id), ["A", "B", "D", "C", "E", "F"]);
for (const [id, caption] of [
  ["walk-one", "まず右へ1マス進みます。"], ["walk-two", "もう1マス下へ進みます。"],
  ["new-goal-one", "右へ1マス進みます。"], ["new-goal-two", "右へ進むと、今度のゴールには2手で着きます。"],
]) assert.equal(steps.find(step => step.id === id).caption, caption);
assert.equal(routes.find(route => route.id === "direct").places.join(), "A,B,E,F");
assert.equal(routes.find(route => route.id === "detour").places.join(), "A,C,E,B,D,F");
const distances = { A: 0 }, waiting = ["A"];
for (let i = 0; i < waiting.length; i++) {
  const current = waiting[i];
  for (const edge of graph.edges) {
    const next = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
    if (next !== null && distances[next] === undefined) {
      distances[next] = distances[current] + 1;
      waiting.push(next);
    }
  }
}
assert.equal(distances.F, 3);
assert.equal(distances.D, 2);
assert.equal(routes.find(route => route.id === "detour").places.length - 1, 5);
assert.equal(routes.find(route => route.id === "direct").places.length - 1, distances.F);
for (const from of maze.places) for (const to of maze.places) {
  const adjacent = Math.abs(from.row - to.row) + Math.abs(from.column - to.column) === 1;
  const connected = graph.edges.some(edge => (edge.from === from.id && edge.to === to.id) || (edge.to === from.id && edge.from === to.id));
  assert.equal(connected, adjacent, "Grid and graph must have exactly the same connections");
}
for (const step of [...steps].reverse()) {
  validateMotivationCanvas(step.canvas); // 逆送りも完全なスナップショットから再現できる。
  assert.equal(step.canvas.data.graph, graph, "All graph scenes must share the A–F topology");
  for (const entry of step.canvas.state.distances) assert.equal(entry.value, distances[entry.id]);
}
for (const group of [["restart", "new-goal-one", "new-goal-two"], ["graph-restart", "graph-walk-one", "graph-walk-two"], ["maze-question", "walk-one", "walk-two", "walk-three"]]) {
  const lengths = group.map(id => get(id).state.trail.length);
  for (let i = 1; i < lengths.length; i++) assert.equal(lengths[i] - lengths[i - 1], 1, "Each move is exactly one square");
}
assert.equal(get("goal-changes").state.current, get("walk-three").state.current, "Moving the goal must not move the learner");
assert.equal(get("new-goal-two").state.current, get("new-goal-two").state.goal);
const labeled = get("label-maze");
assert.equal(labeled.data.view, "maze");
assert(labeled.state.showNames, "Place names must appear while the maze is still visible");
assert.equal(labeled.state.current, get("new-goal-two").state.current);
assert.equal(labeled.state.goal, get("new-goal-two").state.goal);
assert.equal(labeled.state.trail.join(), get("new-goal-two").state.trail.join());
assert.equal(labeled.data.graph.nodes.map(node => labeled.data.labels.nodeNames[node.id]).sort().join(), "A,B,C,D,E,F");
assert.equal(get("map-to-graph").state.trail.join(), get("new-goal-two").state.trail.join());
for (const [mazeId, graphId] of [["restart", "graph-restart"], ["new-goal-one", "graph-walk-one"], ["new-goal-two", "graph-walk-two"]]) {
  assert.equal(get(graphId).data.view, "graph");
  for (const field of ["current", "goal"]) assert.equal(get(graphId).state[field], get(mazeId).state[field]);
  assert.equal(get(graphId).state.trail.join(), get(mazeId).state.trail.join(), "Graph replay must follow exactly the same A–B–D path");
}
assert.equal(get("first-wave").state.distances.map(entry => entry.id).sort().join(), "A,B,C");
assert.equal(get("first-wave").highlights.map(entry => `${entry.kind}:${entry.id}`).sort().join(), get("bridge-entrance").highlights.map(entry => `${entry.kind}:${entry.id}`).sort().join());
assert.equal(get("name-and-exit").data.view, "graph");
assert.equal(get("rail-utility").data.routes.find(route => route.id === "direct").labels.rail, "3区間");
const first = steps[0].canvas;
assert.throws(() => validateMotivationCanvas({ ...first, state: { ...first.state, trail: ["A", "F"], current: "F" } }), /Disconnected/);
assert.throws(() => validateMotivationCanvas({ ...first, data: { ...first.data, maze: { ...maze, places: maze.places.slice(1) } } }), /correspondence/);
assert.throws(() => validateMotivationCanvas({ ...first, highlights: [{ kind: "node", id: "unknown" }] }), /highlight/);
console.log("BFS motivation: 22 scenes, unchanged transition snapshots, graph replay, vocabulary, entrance and exit passed.");

// 出口ボタンは突然出さずフェードインさせる（#140）。
const motivationCanvasSource = fs.readFileSync(path.join(__dirname, "../src/features/learning/units/bfs/motivation/BfsMotivationCanvas.tsx"), "utf8");
assert.match(motivationCanvasSource, /component=\{motion\.div\}/, "motivation exit button fades in");
