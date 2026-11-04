const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const cache = new Map();
function load(filename) {
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: (name) => load(path.resolve(path.dirname(filename), `${name}.ts`)) }, { filename });
  return exports;
}
const feature = path.resolve(__dirname, "../src/features/learning/bfs/motivation");
const { bfsMotivationContent: content } = load(path.join(feature, "motivation.content.ts"));
const { validateMotivationCanvas } = load(path.join(feature, "motivation.types.ts"));
const { steps, vocabulary } = content;
const get = (id) => {
  const step = steps.find(step => step.id === id);
  assert(step, `Missing scene ${id}`);
  return step.canvas;
};
assert.equal(content.phase, 1);
assert.equal(steps.length, 17);
assert(content.intervalMs >= 2500);
assert(!steps.slice(0, -1).some(step => /幅優先探索|BFS/u.test(step.caption)), "Name must not appear early");
assert.match(steps.at(-1).caption, /幅優先探索/u);
assert(steps.slice(0, -1).every(step => step.canvas.state.exit === null));
assert.equal(steps.at(-1).canvas.state.exit.nextPhase, 2);
assert(steps.every(step => (step.caption.match(/[。？]/gu) ?? []).length === 1), "One caption sentence per scene");
assert.equal(new Set(vocabulary.map(entry => entry.concept)).size, vocabulary.length);
assert(vocabulary.every(entry => steps.some(step => step.id === entry.firstStepId)));

// 図の接続から最短距離を独立計算し、実用例と手数を確認する（教材の実行ロジックではない）。
const { graph, maze, routes } = steps[0].canvas.data;
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
for (const group of [["restart", "new-goal-one", "new-goal-two"], ["maze-question", "walk-one", "walk-two", "walk-three"]]) {
  const lengths = group.map(id => get(id).state.trail.length);
  for (let i = 1; i < lengths.length; i++) assert.equal(lengths[i] - lengths[i - 1], 1, "Each move is exactly one square");
}
assert.equal(get("goal-changes").state.current, get("walk-three").state.current, "Moving the goal must not move the learner");
assert.equal(get("new-goal-two").state.current, get("new-goal-two").state.goal);
assert.equal(get("map-to-graph").state.trail.join(), get("new-goal-two").state.trail.join());
assert.equal(get("first-wave").state.distances.map(entry => entry.id).sort().join(), "A,B,C");
assert.equal(get("first-wave").highlights.map(entry => `${entry.kind}:${entry.id}`).sort().join(), get("bridge-entrance").highlights.map(entry => `${entry.kind}:${entry.id}`).sort().join());
assert.equal(get("name-and-exit").data.view, "graph");
assert.equal(get("rail-utility").data.routes.find(route => route.id === "direct").labels.rail, "3区間");
assert.equal(get("social-utility").data.routes.find(route => route.id === "direct").labels.social, "つながり3つ");
const first = steps[0].canvas;
assert.throws(() => validateMotivationCanvas({ ...first, state: { ...first.state, trail: ["A", "F"], current: "F" } }), /Disconnected/);
assert.throws(() => validateMotivationCanvas({ ...first, data: { ...first.data, maze: { ...maze, places: maze.places.slice(1) } } }), /correspondence/);
assert.throws(() => validateMotivationCanvas({ ...first, highlights: [{ kind: "node", id: "unknown" }] }), /highlight/);
console.log("BFS motivation: 17 scenes, shortest routes, one-move steps, grid/graph correspondence, vocabulary, entrance and exit passed.");
