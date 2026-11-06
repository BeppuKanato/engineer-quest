const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const ts = require("typescript"), React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
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
const file = name => `${root}/${name}`;
const feature = "dfs/code-mapping";
const plain = value => JSON.parse(JSON.stringify(value));
const { dfsCodeMappingContent: content } = load(file(`${feature}/codeMapping.content.ts`));
const { dfsCode, dfsCodeSource, dfsCodeLineNumber } = load(file(`${feature}/dfsCode.ts`));
const { validateDfsCodeMappingCanvas: validate, defineDfsCodeMappingContent } = load(file(`${feature}/codeMapping.types.ts`));
const { codeExecutionView, codeVariableRows } = load(file(`${feature}/codeMapping.presentation.ts`));
const { dfsExecutionContent: execution } = load(file("dfs/execution/execution.content.ts"));
const { searchGraphAdjacency: graph } = load(file("graphs/searchGraph.ts"));
const { CodeDisplay } = load(file("code/CodeDisplay.tsx"));
const { DfsCodeMappingCanvas } = load(file(`${feature}/DfsCodeMappingCanvas.tsx`));
const { DfsCodeMappingPreview } = load(file(`${feature}/DfsCodeMappingPreview.tsx`));
assert.equal(content.id, "dfs-code-mapping"); assert.equal(content.phase, 4); assert.equal(content.stageName, "動きとコードの対応");
assert.equal(content.intervalMs, 3500); assert.equal(content.steps.length, 68);
assert.equal(dfsCode.id, "dfs-order-stack"); assert.equal(dfsCode.version, 1);
const baseline = fs.readFileSync(path.resolve(__dirname, "../../docs/concept/dfs-unit-baseline.md"), "utf8");
const section = baseline.split("### 7.1 ")[1].split("### 7.2 ")[0];
const rows = [...section.matchAll(/^\| (\d+) \| ([a-z-]+) \| `([^`]+)` \|$/gmu)];
assert.equal(rows.length, 12);
assert.deepEqual(plain(dfsCode.lines), rows.map(match => ({ id: match[2], text: match[3] })), "Stable IDs and exact source indentation match the baseline");
assert(Buffer.from(dfsCodeSource, "utf8").equals(Buffer.from(rows.map(match => match[3]).join("\n"), "utf8")), "Byte-exact code contract");
const run = spawnSync(process.env.PYTHON || "python3", [path.join(__dirname, "fixtures/dfsCodeMappingTrace.py")], {
  input: JSON.stringify({ code: dfsCodeSource, graph }), encoding: "utf8", timeout: 10000, env: { ...process.env, PYTHONUTF8: "1" },
});
assert.ifError(run.error); assert.equal(run.status, 0, run.stderr);
const actual = JSON.parse(run.stdout);
assert.deepEqual(actual.result, ["A", "B", "D", "F", "E", "C"]);
assert.equal(content.steps.length - 1, actual.trace.length, "One frame for every executed Python line, including loop exits and failed conditions");
for (const [index, step] of content.steps.slice(1).entries()) {
  assert.equal(dfsCodeLineNumber(step.canvas.highlights[0].id), actual.trace[index].line, step.id);
  assert.deepEqual(plain(step.canvas.state.variables), actual.trace[index].variables, `${step.id}: actual CPython locals`);
}
const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
assert.equal(checkpoints.length, 17);
assert.deepEqual(plain(checkpoints.map(step => step.canvas.state.executionStepId)), plain(execution.steps.map(step => step.id)));
const operationLines = { "push-start": "initialize-stack", pop: "append-order", push: "append-stack", "skip-visited": "if-unvisited", "no-add": "for-neighbor-reversed", finish: "while-stack" };
for (const step of checkpoints) {
  const reference = execution.steps.find(reference => reference.id === step.canvas.state.executionStepId);
  assert.equal(step.canvas.state.execution, reference.canvas);
  assert.equal(step.canvas.highlights[0].id, operationLines[reference.canvas.state.operation.kind], "Baseline §2.4 mapping");
  const view = codeExecutionView(step.canvas);
  assert.deepEqual(plain(view.state.nodes), plain(reference.canvas.state.nodes));
  assert.deepEqual(plain(view.state.stack), plain(reference.canvas.state.stack));
  assert.deepEqual(plain(view.state.order), plain(reference.canvas.state.order));
  assert.equal(view.state.current, reference.canvas.state.current);
}
const savedExecution = JSON.stringify(execution);
for (const step of [...content.steps].reverse()) {
  validate(step.canvas);
  assert.equal(step.canvas.state.execution, execution.steps.find(reference => reference.id === step.canvas.state.executionStepId).canvas);
  assert.equal(step.canvas.data.code, dfsCode);
  assert.equal((step.caption.match(/[。？]/gu) || []).length, 1);
  assert(!/\d+行目|フェーズ|再帰|最短/u.test(step.caption));
  const view = codeExecutionView(step.canvas), variables = step.canvas.state.variables;
  assert.deepEqual(plain(view.state.stack), plain(variables.stack ?? []));
  assert.deepEqual(plain(view.state.order), plain(variables.order ?? []));
  const finished = variables.stack?.length === 0 && (step.canvas.highlights[0].id === "while-stack" || step.canvas.highlights[0].id === "return-order");
  assert.equal(view.state.current, finished ? null : variables.node, `${step.id}: diagram processing node matches the current call`);
  const index = content.steps.indexOf(step);
  const previous = content.steps[index - 1]?.canvas.state.variables;
  for (const row of codeVariableRows(variables, previous)) {
    const key = row.name;
    assert.equal(row.changed, JSON.stringify(variables[key]) !== JSON.stringify(previous?.[key] ?? null), `${step.id}: changed ${key}`);
  }
}
assert.equal(JSON.stringify(execution), savedExecution, "Intermediates never mutate the phase-2 snapshots");
const frame = id => { const step = content.steps.find(step => step.id === id); assert(step, id); return step.canvas; };
const popped = frame("pop-node-f"), recorded = frame("execution-pop-f");
assert.deepEqual(plain(popped.state.variables.order), ["A", "B", "D"]);
assert.equal(codeExecutionView(popped).state.current, "F");
assert(!codeExecutionView(popped).state.order.includes("F"), "Do not display an order entry before append-order executes");
assert(codeExecutionView(recorded).state.order.includes("F"));
const marked = frame("mark-a-c"), pushed = frame("execution-push-c-from-a");
assert(marked.state.variables.visited.includes("C")); assert(!marked.state.variables.stack.includes("C"));
assert.equal(codeExecutionView(marked).state.nodes.find(node => node.id === "C").status, "idle");
assert.equal(codeExecutionView(pushed).state.nodes.find(node => node.id === "C").status, "queued");
assert.deepEqual(plain(codeVariableRows(marked.state.variables, frame("if-a-c").state.variables).filter(row => row.changed).map(row => row.name)), ["visited"]);
assert.deepEqual(plain(codeVariableRows(pushed.state.variables, marked.state.variables).filter(row => row.changed).map(row => row.name)), ["stack"]);
assert.match(content.steps.find(step => step.id === "for-a-c").caption, /Bを先に取り出せるよう/u);
assert.match(content.steps.find(step => step.id === "if-f-e").caption, /スタックへ入れる前に発見済み/u);
assert.deepEqual(plain(frame("if-f-e").state.variables.stack), ["C", "E"]);
assert(codeExecutionView(frame("if-f-e")).highlights.some(item => item.kind === "edge" && item.id === "ef" && item.style === "dashed"));
assert.equal(frame("execution-dead-end-f").highlights[0].id, "for-neighbor-reversed");
assert.equal(frame("pop-node-e").state.execution.state.current, "E");
assert.equal(codeVariableRows(content.steps.at(-1).canvas.state.variables).find(row => row.name === "visited").value, "{'A', 'B', 'C', 'D', 'E', 'F'}");
assert.equal(content.steps.at(-1).canvas.highlights[0].id, "return-order");

for (const step of [content.steps[0], content.steps.find(step => step.id === "mark-a-c"), content.steps.find(step => step.id === "pop-node-f"), content.steps.at(-1)]) {
  const html = renderToStaticMarkup(React.createElement(CodeDisplay, { code: dfsCode, label: "dfs_orderのコード", activeLineId: step.canvas.highlights[0].id }));
  assert.equal((html.match(/aria-current="step"/gu) || []).length, 1);
  assert.equal([...html.matchAll(/<code[^>]*>([^<]*)<\/code>/gu)].map(match => match[1]).join("\n"), dfsCodeSource, "Rendered code stays byte-exact");
  const canvas = renderToStaticMarkup(React.createElement(DfsCodeMappingCanvas, { canvas: step.canvas }));
  assert.match(canvas, /DFSの図とコードの対応/u); assert.match(canvas, /コードの変数/u);
  for (const name of ["node", "neighbor", "stack", "visited", "order"]) assert(canvas.includes(`data-variable="${name}"`));
}
const preview = renderToStaticMarkup(React.createElement(DfsCodeMappingPreview));
assert.match(preview, /aria-label="動きとコードの対応"/u);
assert.match(preview, /ステップ位置/u);
assert.throws(() => validate({ ...marked, state: { ...marked.state, execution: plain(marked.state.execution) } }), /canonical/u);
assert.throws(() => validate({ ...marked, highlights: [{ kind: "code-line", id: "missing" }] }), /Unknown/u);
assert.throws(() => validate({ ...marked, state: { ...marked.state, variables: { ...marked.state.variables, stack: ["Z"] } } }), /Invalid/u);
assert.throws(() => validate({ ...marked, state: { ...marked.state, variables: { ...marked.state.variables, visited: ["C", "A"] } } }), /canonical/u);
assert.throws(() => defineDfsCodeMappingContent({ ...content, steps: content.steps.filter(step => step.id !== "execution-pop-f") }), /17/u);
const shared = fs.readFileSync(file("code/CodeDisplay.tsx"), "utf8");
const renderer = fs.readFileSync(file(`${feature}/DfsCodeMappingCanvas.tsx`), "utf8");
assert.match(shared, /prefers-reduced-motion: reduce/u); assert.match(shared, /fontSize: "clamp\(16px/u);
assert.match(renderer, /prefers-reduced-motion: reduce/u);
assert.match(renderer, /bgcolor: changed \? playerTokens.focus : "transparent"/u);
assert.match(renderer, /Math.max\(620/u);
const entry = fs.readFileSync(file(`${feature}/DfsCodeMappingPreview.tsx`), "utf8");
assert.match(entry, /84vw/u); assert.match(entry, /84dvh/u);
assert(!/onLearningEvent|onComplete|endAction|fetch\(|localStorage/u.test(entry));
console.log("DFS code mapping verified: 68 frames, byte-exact 12-line contract, all CPython lines/locals, 17 original checkpoints, intermediate pop/mark states, shared rendering and standalone controls.");
