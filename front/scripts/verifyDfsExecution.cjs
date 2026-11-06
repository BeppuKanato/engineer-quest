const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { spawnSync } = require("node:child_process");
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
const feature = `${root}/dfs/execution`;
const plain = value => JSON.parse(JSON.stringify(value));
const { dfsExecutionContent: content } = load(`${feature}/execution.content.ts`);
const { validateDfsExecutionCanvas: validate } = load(`${feature}/execution.types.ts`);
const { searchGraph: graph, searchGraphAdjacency: adjacency, searchGraphNodes, searchGraphEdges } = load(`${root}/graphs/searchGraph.ts`);
const { bfsExecutionContent: bfs } = load(`${root}/bfs/execution/execution.content.ts`);
const { dfsMotivationContent: motivation } = load(`${root}/dfs/motivation/motivation.content.ts`);
const { DfsExecutionCanvas } = load(`${feature}/DfsExecutionCanvas.tsx`);
const { DfsExecutionPreview } = load(`${feature}/DfsExecutionPreview.tsx`);
assert.equal(content.id, "dfs-execution"); assert.equal(content.phase, 2); assert.equal(content.stageName, "動きの説明");
assert.equal(content.intervalMs, 3500); assert.equal(content.steps.length, 17);
assert.equal(bfs.steps[0].canvas.data.graph.nodes, searchGraphNodes);
assert.equal(bfs.steps[0].canvas.data.graph.edges, searchGraphEdges);
assert.equal(motivation.steps[0].canvas.data.graph, graph);
assert.deepEqual(plain(adjacency), { A: ["B", "C"], B: ["A", "D", "E"], C: ["A", "E"], D: ["B", "F"], E: ["B", "C", "F"], F: ["D", "E"] });

const baseline = fs.readFileSync(path.resolve(__dirname, "../../docs/concept/dfs-unit-baseline.md"), "utf8");
const tableRows = section => section.split(/\r?\n/u).filter(line => /^\| \d+ \| [a-z]+(?:-[a-z]+)* \|/u.test(line));
const scenes = tableRows(baseline.split("### 2.2 ")[1].split("### 2.3 ")[0]);
assert.equal(scenes.length, 17, "Read all baseline §2.2 scenes");
assert.deepEqual(plain(content.steps.map(step => [step.id, step.caption])), scenes.map(line => line.split("|").slice(2, 4).map(cell => cell.trim())));

// §7.1's table omits nesting whitespace. Restore only Python indentation, executing every source line unchanged.
const codeRows = tableRows(baseline.split("### 7.1 ")[1].split("### 7.2 ")[0]);
const indentation = [0, 4, 4, 4, 4, 8, 8, 8, 12, 16, 16, 4];
assert.equal(codeRows.length, indentation.length);
const code = codeRows.map((line, index) => " ".repeat(indentation[index]) + line.match(/`([^`]+)`/u)[1].trim()).join("\n");
const run = spawnSync(process.env.PYTHON || "python3", [path.join(__dirname, "fixtures/dfsExecutionTrace.py")], {
  input: JSON.stringify({ code, graph: adjacency, edges: graph.edges, start: "A" }), encoding: "utf8", timeout: 10000,
  env: { ...process.env, PYTHONUTF8: "1" },
});
assert.ifError(run.error); assert.equal(run.status, 0, run.stderr);
const trace = JSON.parse(run.stdout);
assert.deepEqual(trace.result, ["A", "B", "D", "F", "E", "C"]);
assert.equal(trace.events.length, 17);
for (const [index, step] of content.steps.entries()) {
  const { canvas } = step;
  const { nodes, ...state } = plain(canvas.state);
  assert.deepEqual(state, trace.events[index], `Actual Python trace: ${step.id}`);
  const cells = scenes[index].split("|").map(cell => cell.trim());
  const ids = cell => cell === "全ノード" ? graph.nodes.map(node => node.id) : cell.match(/[A-F]/gu) || [];
  assert.equal(state.operation.kind, cells[4].split(" ")[0], `Baseline operation: ${step.id}`);
  assert.equal(state.current, cells[5] === "—" ? null : cells[5]);
  assert.deepEqual(state.stack, ids(cells[6]));
  assert.deepEqual(state.order, ids(cells[7]));
  assert.deepEqual([...state.completed].sort(), [...ids(cells[8])].sort());
  assert.equal(canvas.data.graph, graph);
  assert.equal(canvas.data.graph.layers.length, 0);
  validate(canvas);
  assert.equal((step.caption.match(/。/gu) || []).length, 1);
  assert(!/フェーズ|最短|距離|visited/u.test(step.caption));
  for (const node of nodes) {
    const expected = node.id === state.current ? "processing" : state.stack.includes(node.id) ? "queued" : state.completed.includes(node.id) ? "completed" : "idle";
    assert.equal(node.status, expected, `${step.id}: ${node.id}`);
  }
  const markup = renderToStaticMarkup(createElement(DfsExecutionCanvas, { canvas }));
  assert.match(markup, /スタックの中身（左が底、右が末尾）/u);
  assert.match(markup, /訪問順の中身/u);
  if (state.stack.length) assert.match(markup, /末尾（次に取り出す）/u);
  if (["push", "skip-visited"].includes(state.operation.kind)) assert(canvas.highlights.some(item => item.kind === "edge" && item.id === state.operation.edgeId && item.style === (state.operation.kind === "push" ? "solid" : "dashed")));
}
const deadEnd = content.steps[12].canvas, resume = content.steps[13].canvas;
assert.deepEqual(plain(deadEnd.state.stack), ["C", "E"]);
assert.equal(deadEnd.state.current, "F"); assert.equal(resume.state.current, "E");
assert.deepEqual(plain(resume.state.stack), ["C"]);
assert(deadEnd.highlights.some(item => item.kind === "stack-item" && item.id === "E"));
assert(deadEnd.highlights.filter(item => item.kind === "edge").every(item => item.style === "dashed"));
for (const step of [...content.steps].reverse()) validate(plain(step.canvas));
const reject = (index, mutate) => { const canvas = plain(content.steps[index].canvas); mutate(canvas); assert.throws(() => validate(canvas)); };
reject(6, c => c.state.stack.push("D"));
reject(13, c => { c.state.current = "F"; });
reject(13, c => { c.state.completed = []; });
reject(13, c => { c.state.nodes.find(node => node.id === "E").status = "completed"; });
reject(2, c => { c.state.operation.edgeId = "bd"; });
reject(16, c => { c.state.stack = ["C"]; });
reject(12, c => c.highlights.push({ kind: "stack-item", id: "F" }));
const renderer = fs.readFileSync(`${feature}/DfsExecutionCanvas.tsx`, "utf8");
assert.match(renderer, /GraphEdges/u); assert.match(renderer, /GraphNodes/u); assert.match(renderer, /GraphViewport/u); assert.match(renderer, /graphGeometry/u);
assert.match(renderer, /useReducedMotion\(\)/u); assert.match(renderer, /reducedMotion \? 0 : 0\.6/u);
assert(!/repeat\s*:|#(?:[0-9a-f]{3}){1,2}\b|\bgreen\b/iu.test(renderer));
const preview = fs.readFileSync(`${feature}/DfsExecutionPreview.tsx`, "utf8");
assert.match(preview, /LearningPlayer/u); assert.match(preview, /84vw/u); assert.match(preview, /84dvh/u);
assert(!/endAction|ports=|onComplete|fetch\(|learningLog/u.test(preview));
assert.match(renderToStaticMarkup(createElement(DfsExecutionPreview)), /aria-label="動きの説明"/u);
assert(!fs.existsSync(`${root}/bfs/bfsGraph.ts`), "No competing graph canonical module");
console.log("DFS execution verified: all 17 snapshots match actual baseline Python; shared graph, backtracking, seeking and presentation contracts.");
