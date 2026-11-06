const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { spawnSync } = require("node:child_process");

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
const root = path.resolve(__dirname, "../src/features/learning");
const { bfsCodeMappingContent: content } = load(`${root}/bfs/code-mapping/codeMapping.content.ts`);
const { bfsCode, bfsCodeLineNumber } = load(`${root}/bfs/code-mapping/bfsCode.ts`);
const { validateCodeMappingCanvas, defineCodeMappingContent } = load(`${root}/bfs/code-mapping/codeMapping.types.ts`);
const { bfsExecutionContent: execution } = load(`${root}/bfs/execution/execution.content.ts`);
const plain = value => JSON.parse(JSON.stringify(value));
const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
assert.equal(content.phase, 4);
assert(content.intervalMs >= 2500);
assert.equal(checkpoints.length, 19);
assert.deepEqual(plain(checkpoints.map(step => step.canvas.state.executionStepId)), plain(execution.steps.map(step => step.id)));
assert.equal(content.steps.at(-1).canvas.highlights[0].id, "return-distances");
assert.equal(content.steps.at(-2).canvas.highlights[0].id, "while-queue");
assert.match(content.steps.at(-2).caption, /空/u);
for (const step of [...content.steps].reverse()) {
  const { state, data } = step.canvas;
  validateCodeMappingCanvas(step.canvas);
  assert.equal(state.execution, execution.steps.find(reference => reference.id === state.executionStepId).canvas, "Reference the actual snapshot, never a clone");
  assert.equal(data.code, bfsCode);
  assert.equal((step.caption.match(/[。？]/gu) || []).length, 1);
  assert(!/^\d+行目[：:]/u.test(step.caption), "Captions must not have line-number prefixes");
  assert(["structure", "evaluation", "assignment"].includes(state.captionKind));
  if (state.frameKind === "execution") {
    const reference = execution.steps.find(reference => reference.id === state.executionStepId);
    assert.equal(step.caption, reference.caption, "Keep the original phase-2 caption unchanged");
  }
}
for (const line of bfsCode.lines) assert(content.steps.some(step => step.canvas.highlights[0].id === line.id), `Unvisited line: ${line.id}`);
assert.equal(new Set(bfsCode.lines.map(line => line.id)).size, 11);
// フェーズ5が使う意味IDと本文の契約を固定する。
assert.deepEqual(plain(bfsCode.lines.map(line => line.id)), ["import-deque", "define-function", "initialize-distances", "initialize-queue", "while-queue", "dequeue-node", "for-neighbor", "if-undiscovered", "assign-distance", "enqueue-neighbor", "return-distances"]);
const seed = fs.readFileSync(path.resolve(__dirname, "../../back/prisma/seedData/courseSeed.ts"), "utf8");
const sourceBlock = seed.match(/export const breadthFirstSearchAnswerCode =\s*([\s\S]*?);/)[1];
const originalCode = [...sourceBlock.matchAll(/"(?:[^"\\]|\\.)*"/g)].map(match => JSON.parse(match[0])).join("");
const originalLines = originalCode.split("\n");
assert.deepEqual(plain(bfsCode.lines.map(line => line.text)), originalLines, "Do not silently change the source Python code");

// 実際のPythonをトレースし、生成処理とは独立に全実行行・変数を検証する。
// lineイベント直前は前行の実行直後。forの次の反復・終了、ifのfalseも記録される。
const python = `
import json, sys
payload = json.load(sys.stdin)
graph = {node['id']: [] for node in payload['graph']['nodes']}
for edge in payload['graph']['edges']:
    graph[edge['from']].append(edge['to'])
    graph[edge['to']].append(edge['from'])
namespace = {}
exec(compile(payload['code'], '<bfs-mapping-test>', 'exec'), namespace)
trace = []
previous = None
def capture(frame):
    values = frame.f_locals
    distances = values.get('distances')
    node, neighbor = values.get('node'), values.get('neighbor')
    return dict(start=values['start'], node=node,
        nodeDistance=distances.get(node) if distances is not None else None,
        neighbor=neighbor, neighborDistance=distances.get(neighbor) if distances is not None else None,
        queue=list(values['queue']) if 'queue' in values else None,
        distances=dict(distances) if distances is not None else None)
def tracer(frame, event, arg):
    global previous
    if frame.f_code.co_filename == '<bfs-mapping-test>' and frame.f_code.co_name == 'bfs_distances':
        if event == 'line':
            if previous is not None:
                trace.append(dict(line=previous, variables=capture(frame)))
            previous = frame.f_lineno
        elif event == 'return':
            trace.append(dict(line=previous, variables=capture(frame)))
    return tracer
sys.settrace(tracer)
result = namespace['bfs_distances'](graph, payload['start'])
sys.settrace(None)
print(json.dumps(dict(trace=trace, result=result)))
`;
const run = spawnSync("python3", ["-c", python], {
  input: JSON.stringify({ code: bfsCode.lines.map(line => line.text).join("\n"), graph: execution.steps[0].canvas.data.graph, start: "A" }), encoding: "utf8",
});
assert.equal(run.status, 0, run.stderr);
const actual = JSON.parse(run.stdout);
const functionFrames = content.steps.slice(2);
assert.equal(functionFrames.length, actual.trace.length, "Each executed Python line, including every loop/branch, needs a frame");
for (const [index, step] of functionFrames.entries()) {
  assert.equal(bfsCodeLineNumber(step.canvas.highlights[0].id), actual.trace[index].line, `Frame ${step.id}: executed line`);
  assert.deepEqual(plain(step.canvas.state.variables), actual.trace[index].variables, `Frame ${step.id}: actual Python variables`);
}
// 直前フレームの実際のPython変数と比較して、初出・代入・不変を検証する。
const { codeVariableRows } = load(`${root}/bfs/code-mapping/codeMapping.presentation.ts`);
for (const [index, step] of functionFrames.entries()) {
  const rows = codeVariableRows(step.canvas.state.variables, content.steps[index + 1].canvas.state.variables);
  const before = index === 0 ? content.steps[1].canvas.state.variables : actual.trace[index - 1].variables;
  const keys = { start: "start", node: "node", "distances[node]": "nodeDistance", neighbor: "neighbor", "distances[neighbor]": "neighborDistance", queue: "queue", distances: "distances" };
  for (const row of rows) {
    const key = keys[row.name];
    assert.equal(row.changed, JSON.stringify(actual.trace[index].variables[key]) !== JSON.stringify(before[key]), `${step.id}: ${row.name} change highlight`);
  }
}
const assignedRow = content.steps.find(step => step.id === "assign-a-b");
const assignedIndex = content.steps.indexOf(assignedRow);
const changes = codeVariableRows(assignedRow.canvas.state.variables, content.steps[assignedIndex - 1].canvas.state.variables);
assert.deepEqual(plain(changes.filter(row => row.changed).map(row => row.name)), ["distances[neighbor]", "distances"]);
assert(codeVariableRows(content.steps[2].canvas.state.variables, content.steps[1].canvas.state.variables).find(row => row.name === "distances").changed, "First assignment from — is a change");
assert(codeVariableRows(content.steps[3].canvas.state.variables, content.steps[2].canvas.state.variables).find(row => row.name === "queue").changed, "First queue initialization is a change");
assert(codeVariableRows(content.steps[1].canvas.state.variables, content.steps[0].canvas.state.variables).every(row => !row.changed), "Unchanged values remain normal");
assert.deepEqual(actual.result, { A: 0, B: 1, C: 1, D: 2, E: 2, F: 3 });
const assigned = content.steps.filter(step => step.canvas.highlights[0].id === "assign-distance");
assert.equal(assigned.length, 5);
for (const step of assigned) {
  const index = content.steps.indexOf(step);
  assert.equal(step.canvas.state.execution, content.steps[index - 1].canvas.state.execution, "Hold the preceding graph until append");
  assert.equal(content.steps[index + 1].canvas.highlights[0].id, "enqueue-neighbor");
  assert.equal(content.steps[index + 1].canvas.state.frameKind, "execution");
}
assert(content.steps.some(step => /A.*記録済み/u.test(step.caption)), "Include reverse-edge visited checks omitted in the phase-2 animation");
const frame = assigned[0].canvas;
assert.throws(() => validateCodeMappingCanvas({ ...frame, state: { ...frame.state, variables: { ...frame.state.variables, neighborDistance: 99 } } }), /mismatch/);
assert.throws(() => validateCodeMappingCanvas({ ...frame, state: { ...frame.state, execution: plain(frame.state.execution) } }), /canonical/);
assert.throws(() => validateCodeMappingCanvas({ ...frame, highlights: [{ kind: "code-line", id: "missing" }] }), /Unknown code line/);
assert.throws(() => validateCodeMappingCanvas({ ...frame, state: { ...frame.state, locals: { ...frame.state.locals, pendingDistance: 99 } } }), /pending/);
assert.throws(() => defineCodeMappingContent({ ...content, steps: content.steps.filter(step => step.id !== "execution-dequeue-a") }), /19 execution/);
console.log(`BFS code mapping: ${content.steps.length} frames, 19 snapshot identities, 11 stable source lines, complete Python trace and variables, reverse seek and invalid-data rejection passed.`);

// 変化した変数は、コード行ハイライトと同じ背景ハイライト（focus 背景＋surface 文字）で示す（#145）。
const canvasSource = fs.readFileSync(path.resolve(__dirname, "../src/features/learning/bfs/code-mapping/BfsCodeMappingCanvas.tsx"), "utf8");
assert.match(canvasSource, /bgcolor: changed \? playerTokens\.focus : "transparent"/);
assert.match(canvasSource, /color: changed \? playerTokens\.surface : playerTokens\.text/);
console.log("BFS code mapping: changed-variable background highlight contract passed.");
