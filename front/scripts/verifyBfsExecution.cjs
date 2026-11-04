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
  vm.runInNewContext(source, { exports, require: name => load(path.resolve(path.dirname(filename), `${name}.ts`)) }, { filename });
  return exports;
}
const feature = path.resolve(__dirname, "../src/features/learning/bfs/execution");
const { bfsExecutionContent: content } = load(path.join(feature, "execution.content.ts"));
const { validateBfsExecutionCanvas } = load(path.join(feature, "execution.types.ts"));
const plain = value => JSON.parse(JSON.stringify(value));
const captions = [
  "出発点Aを、待ち行列の先頭に入れます。",
  "待ち行列の先頭から、Aを取り出します。",
  "Aの隣のBを、1歩先の場所として行列の末尾に追加します。",
  "もう一つの隣Cも、1歩先の場所として末尾に追加します。",
  "Aの隣を調べ終えました。",
  "先に並んだBを、行列の先頭から取り出します。",
  "Bの隣のDを、Aから2歩先の場所として末尾に追加します。",
  "Bのもう一つの隣Eも、2歩先の場所として末尾に追加します。",
  "Bの隣を調べ終えました。",
  "2歩先のDより先に、まだ残っている1歩先のCを取り出します。",
  "Cの隣のEはすでに行列にあるので、重ねて追加しません。",
  "Cの隣を調べ終えました。",
  "次は、2歩先のDを行列の先頭から取り出します。",
  "Dの隣のFを、Aから3歩先の場所として末尾に追加します。",
  "Dの隣を調べ終えました。",
  "3歩先のFより先に、まだ残っている2歩先のEを取り出します。",
  "Eの隣を調べ終えました。",
  "最後に、3歩先のFを行列の先頭から取り出します。",
  "Aから近い順に、すべての場所を調べ終えました。",
];

// コンテンツの snapshot helper を使わず、無向グラフから BFS を独立実行する。
function simulate(graph, start) {
  const queue = [start], discovered = new Map([[start, { distance: 0, parent: null }]]), done = new Set();
  const frames = [];
  function save(operation, current, activeDistance) {
    frames.push({ operation, current, activeDistance,
      queue: queue.map(nodeId => ({ nodeId, distance: discovered.get(nodeId).distance })),
      nodes: graph.nodes.map(({ id }) => ({ id,
        status: current === id ? "processing" : done.has(id) ? "completed" : queue.includes(id) ? "queued" : "idle",
        distance: discovered.get(id)?.distance ?? null, parent: discovered.get(id)?.parent ?? null,
      })),
    });
  }
  save({ kind: "initialize", nodeId: start }, null, 0);
  while (queue.length) {
    const current = queue.shift(), distance = discovered.get(current).distance;
    save({ kind: "dequeue", nodeId: current }, current, distance);
    for (const edge of graph.edges) {
      const next = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (next === null) continue;
      if (!discovered.has(next)) {
        discovered.set(next, { distance: distance + 1, parent: current });
        queue.push(next);
        save({ kind: "discover", nodeId: next, from: current, edgeId: edge.id }, current, distance);
      } else if (current === "C" && next === "E") {
        // サンプルは重複追加しない確認をここだけ独立表示する。他の既発見点の確認は完了コマに含む。
        save({ kind: "skip-discovered", nodeId: next, from: current, edgeId: edge.id }, current, distance);
      }
    }
    done.add(current);
    save({ kind: "complete", nodeId: current }, null, queue.length ? distance : null);
  }
  return frames;
}

function verify(candidate) {
  assert.equal(candidate.phase, 2);
  assert(candidate.intervalMs >= 2500);
  assert.equal(candidate.steps.length, 19, "Keep all 19 sample steps without splitting / combining");
  assert.deepEqual(candidate.steps.map(step => step.caption), captions, "Exact reviewed captions");
  assert.equal(new Set(candidate.steps.map(step => step.id)).size, 19);
  const { graph, start } = candidate.steps[0].canvas.data;
  assert.equal(start, "A");
  assert.equal(graph.nodes.map(node => node.id).join(), "A,B,C,D,E,F");
  assert.deepEqual(graph.edges.map(edge => `${edge.from}-${edge.to}`).sort(), ["A-B", "A-C", "B-D", "B-E", "C-E", "D-F", "E-F"]);
  const expected = simulate(graph, start);
  assert.equal(expected.length, 19);
  const expectedDistances = { A: 0, B: 1, C: 1, D: 2, E: 2, F: 3 };
  for (const layer of graph.layers) for (const id of layer.nodeIds) assert.equal(layer.distance, expectedDistances[id]);
  const point = id => graph.nodes.find(node => node.id === id);
  assert(point("A").x < point("B").x && point("B").x < point("D").x && point("D").x < point("F").x);
  assert(point("B").y === point("D").y && point("C").y === point("E").y && point("B").y < point("A").y && point("A").y === point("F").y && point("F").y < point("C").y);
  for (const [index, step] of candidate.steps.entries()) {
    validateBfsExecutionCanvas(step.canvas);
    assert.deepEqual(step.canvas.data, candidate.steps[0].canvas.data, "Same graph throughout");
    const { queueLabel, ...actual } = step.canvas.state;
    assert.equal(queueLabel, index === 0 ? "待ち行列（キュー）" : "キュー");
    assert.deepEqual(actual, expected[index], `Step ${index + 1}: FIFO / distances / visited / processing state`);
    const { operation } = actual;
    const id = operation.kind === "initialize" ? "enqueue-start" : operation.kind === "skip-discovered" ? "skip-e" :
      operation.kind === "complete" && operation.nodeId === "F" ? "complete-all" : `${operation.kind}-${operation.nodeId.toLowerCase()}`;
    assert.equal(step.id, id, "Stable references for phases 3 / 4");
    const edges = step.canvas.highlights.filter(item => item.kind === "edge");
    assert.deepEqual(edges, operation.kind === "discover" || operation.kind === "skip-discovered" ?
      [{ kind: "edge", id: operation.edgeId, style: operation.kind === "discover" ? "solid" : "dashed" }] : []);
    assert(step.canvas.highlights.some(item => item.kind === "node" && item.id === operation.nodeId));
    if (operation.kind === "initialize" || operation.kind === "discover") assert(step.canvas.highlights.some(item => item.kind === "queue-item" && item.id === operation.nodeId));
  }
  // 任意の中間状態は前コマを再実行しなくても検証・復元可能。
  [...candidate.steps].reverse().forEach(step => validateBfsExecutionCanvas(step.canvas));
}

verify(plain(content));
function rejects(change) {
  const broken = plain(content);
  change(broken);
  assert.throws(() => verify(broken));
}
rejects(broken => broken.steps[9].canvas.state.queue.reverse()); // FIFO の逆転
rejects(broken => broken.steps[13].canvas.state.queue[1].distance = 2); // 距離の誤り
rejects(broken => broken.steps[10].canvas.state.queue.push({ nodeId: "E", distance: 2 })); // 再追加
rejects(broken => broken.steps[10].canvas.highlights.find(item => item.kind === "edge").style = "solid");
rejects(broken => broken.steps[6].canvas.state.nodes.find(node => node.id === "D").parent = "C");
rejects(broken => broken.steps[0].canvas.data.graph.edges.pop());
rejects(broken => broken.steps[5].canvas.state.activeDistance = 2);
console.log("BFS execution verified: exact 19 captions, reference graph, independent BFS snapshots, FIFO, distances, no re-enqueue, highlights and invalid-data rejection.");
