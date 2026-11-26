const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const file = path.resolve(__dirname, "../src/features/learning/graphs/weightedSearch.ts");
const exportsObject = {};
const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(compiled, { exports: exportsObject }, { filename: file });
const { weightedNodes, weightedEdges, weightedHeuristic, buildWeightedTrace, reconstructWeightedPath } = exportsObject;
const plain = value => JSON.parse(JSON.stringify(value));
assert.equal(weightedHeuristic.F, 0);
for (const {from, to, weight} of weightedEdges) {
  assert(weight >= 0);
  assert(Math.abs(weightedHeuristic[from] - weightedHeuristic[to]) <= weight);
}
for (const [mode, expected, length] of [
  ["dijkstra", ["A","C","B","D","E","F"], 20],
  ["astar", ["A","B","D","F"], 13],
]) {
  const trace = buildWeightedTrace(mode);
  assert.equal(trace.length, length);
  assert.equal(trace[0].operation, "init");
  assert.equal(trace.at(-1).operation, "finish");
  assert.deepEqual(plain(trace.at(-1).selected), expected);
  assert.equal(trace.at(-1).distances.F, 6);
  assert.deepEqual(plain(reconstructWeightedPath(trace.at(-1))), ["A","B","D","F"]);
  for (let i = 1; i < trace.length; i++) {
    const before = trace[i-1], after = trace[i];
    assert.equal(new Set(after.frontier).size, after.frontier.length);
    assert.equal(new Set(after.selected).size, after.selected.length);
    if (after.operation === "select") assert.equal(after.from, before.frontier[0]);
    for (const {id} of weightedNodes) {
      if (after.operation === "relax" && id === after.to) {
        assert(after.distances[id] < (before.distances[id] ?? Infinity));
        assert.equal(after.distances[id], after.candidate);
        assert.equal(after.predecessors[id], after.from);
      } else {
        assert.equal(after.distances[id], before.distances[id]);
        assert.equal(after.predecessors[id], before.predecessors[id]);
      }
    }
  }
}
const dijkstra = buildWeightedTrace("dijkstra");
const update = dijkstra.findIndex(s => s.operation === "relax" && s.from === "B" && s.to === "E");
assert(update > 0);
assert.equal(dijkstra[update-1].distances.E, 6);
assert.equal(dijkstra[update].distances.E, 4);
console.log("Weighted search trace verification passed");
