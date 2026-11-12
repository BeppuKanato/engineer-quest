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
const feature = "binary-search/code-mapping";
const plain = value => JSON.parse(JSON.stringify(value));
const { binarySearchCodeMappingContent: content } = load(file(`${feature}/codeMapping.content.ts`));
const { binarySearchCode, binarySearchCodeSource, binarySearchCodeLineNumber } = load(file(`${feature}/binarySearchCode.ts`));
const { validateBinarySearchCodeMappingCanvas: validate, defineBinarySearchCodeMappingContent, checkpointStepIds } = load(file(`${feature}/codeMapping.types.ts`));
const { codeVariableRows } = load(file(`${feature}/codeMapping.presentation.ts`));
const { binarySearchExecutionContent: execution } = load(file("binary-search/execution/execution.content.ts"));
const search = load(file("binary-search/binarySearch.ts"));
const { CodeDisplay } = load(file("code/CodeDisplay.tsx"));
const { BinarySearchCodeMappingCanvas } = load(file(`${feature}/BinarySearchCodeMappingCanvas.tsx`));
const { BinarySearchCodeMappingPreview } = load(file(`${feature}/BinarySearchCodeMappingPreview.tsx`));

assert.equal(content.id, "binary-search-code-mapping"); assert.equal(content.phase, 4);
assert.equal(content.stageName, "動きとコードの対応"); assert.equal(content.intervalMs, 3500);
assert.equal(binarySearchCode.id, "binary-search-v1"); assert.equal(binarySearchCode.version, 1);

// 基準データ §2 の参照コード（契約 binary-search-v1）。行の追加・変更・言い換えがないことを照合する。
// 基準データは「11行」と記すが、コードブロック自体は12行ある。本文を正として12行で照合する。
const expectedLines = [
  ["define-function", "def binary_search(values, target):"],
  ["init-lo", "    lo = 0"],
  ["init-hi", "    hi = len(values) - 1"],
  ["while-range", "    while lo <= hi:"],
  ["compute-mid", "        mid = (lo + hi) // 2"],
  ["if-hit", "        if values[mid] == target:"],
  ["return-mid", "            return mid"],
  ["elif-smaller", "        elif values[mid] < target:"],
  ["drop-left", "            lo = mid + 1"],
  ["else-larger", "        else:"],
  ["drop-right", "            hi = mid - 1"],
  ["return-missing", "    return -1"],
];
assert.deepEqual(plain(binarySearchCode.lines), expectedLines.map(([id, text]) => ({ id, text })),
  "Stable IDs and exact source indentation match the baseline §2 contract");
assert(Buffer.from(binarySearchCodeSource, "utf8").equals(Buffer.from(expectedLines.map(([, text]) => text).join("\n"), "utf8")),
  "Byte-exact code contract");

// 参照コードを CPython で実際に実行し、全実行行とローカル変数を教材フレームと突き合わせる。
const run = spawnSync(process.env.PYTHON || "python3", [path.join(__dirname, "fixtures/binarySearchCodeMappingTrace.py")], {
  input: JSON.stringify({ code: binarySearchCodeSource, values: [...search.binarySearchMainValues], target: search.binarySearchMainTarget }),
  encoding: "utf8", timeout: 10000, env: { ...process.env, PYTHONUTF8: "1" },
});
assert.ifError(run.error); assert.equal(run.status, 0, run.stderr);
const actual = JSON.parse(run.stdout);
assert.equal(actual.result, 4, "Executed reference code finds the main target at index 4");
assert.equal(search.runBinarySearch(search.binarySearchMainValues, search.binarySearchMainTarget), actual.result,
  "Contract run in binarySearch.ts agrees with the executed reference code");

// else: 行は CPython が行イベントを発しないため、説明フレームを分けて数える。
const elseFrames = content.steps.filter(step => step.canvas.highlights[0].id === "else-larger");
assert.equal(elseFrames.length, 1, "One else explanation for the single drop-right iteration");
const executedFrames = content.steps.slice(1).filter(step => step.canvas.highlights[0].id !== "else-larger");
assert.equal(content.steps.length, 1 + actual.trace.length + elseFrames.length,
  "One frame per executed Python line, plus the define frame and the else explanation");
assert.equal(content.steps.length, 18);
assert.equal(content.steps.length * content.intervalMs, 63000, "Autoplay takes about 63 seconds");
assert.equal(content.steps[0].canvas.highlights[0].id, "define-function");
assert.deepEqual(plain(content.steps[0].canvas.state.variables), { lo: null, hi: null, mid: null });
for (const [index, step] of executedFrames.entries()) {
  assert.equal(binarySearchCodeLineNumber(step.canvas.highlights[0].id), actual.trace[index].line, step.id);
  const { lo, hi, mid } = step.canvas.state.variables;
  assert.deepEqual({ lo, hi, mid }, {
    lo: actual.trace[index].variables.lo, hi: actual.trace[index].variables.hi, mid: actual.trace[index].variables.mid,
  }, `${step.id}: actual CPython locals`);
  assert.equal(actual.trace[index].variables.midValue,
    mid === null ? null : search.binarySearchMainValues[mid], `${step.id}: values[mid] projection matches CPython`);
}
for (const step of elseFrames) {
  const index = content.steps.indexOf(step);
  assert.equal(content.steps[index - 1].id, "elif-smaller-2", `${step.id}: follows the failed elif`);
  assert.equal(content.steps[index + 1].id, "execution-probe-2-drop-right", `${step.id}: precedes the drop`);
  assert.deepEqual(plain(step.canvas.state.variables), plain(content.steps[index - 1].canvas.state.variables),
    `${step.id}: else itself changes no variable`);
}

// フェーズ2の9ステップ（導入・まとめを除く）が、順番どおりチェックポイントとして現れる。
const checkpointLine = stepId => {
  if (stepId === "range-full") return "init-hi";
  if (stepId === "found") return "return-mid";
  if (stepId.startsWith("range-")) return "while-range";
  if (stepId.endsWith("-mid")) return "compute-mid";
  if (stepId.endsWith("drop-left")) return "drop-left";
  if (stepId.endsWith("drop-right")) return "drop-right";
  throw new Error(`No checkpoint line rule for ${stepId}`);
};
const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
assert.equal(checkpoints.length, 9);
assert.deepEqual(plain(checkpoints.map(step => step.canvas.state.executionStepId)),
  ["range-full", "probe-1-mid", "probe-1-drop-left", "range-after-drop-left", "probe-2-mid",
    "probe-2-drop-right", "range-single", "probe-3-mid", "found"]);
assert.deepEqual(plain(checkpointStepIds), plain(checkpoints.map(step => step.canvas.state.executionStepId)));
for (const step of checkpoints) {
  const reference = execution.steps.find(candidate => candidate.id === step.canvas.state.executionStepId);
  assert.equal(step.canvas.state.execution, reference.canvas, `${step.id}: board is the phase-2 snapshot itself`);
  assert.equal(step.caption, reference.caption, `${step.id}: checkpoint caption is the phase-2 caption`);
  assert.equal(step.canvas.highlights[0].id, checkpointLine(step.canvas.state.executionStepId),
    `${step.id}: the line that completes the phase-2 step`);
}

const midValueOf = variables => variables.mid === null ? "—" : String(search.binarySearchMainValues[variables.mid]);
const scalarOf = value => value === null ? "—" : String(value);
const savedExecution = JSON.stringify(execution);
for (const step of [...content.steps].reverse()) {
  validate(step.canvas);
  assert.equal(step.canvas.state.execution, execution.steps.find(reference => reference.id === step.canvas.state.executionStepId).canvas);
  assert.equal(step.canvas.data.code, binarySearchCode);
  assert.equal((step.caption.match(/。/gu) || []).length, 1, `${step.id}: one sentence`);
  assert(!/行目|フェーズ/u.test(step.caption), `${step.id}: no meta wording`);
  const variables = step.canvas.state.variables;
  const index = content.steps.indexOf(step);
  const previous = content.steps[index - 1]?.canvas.state.variables;
  for (const row of codeVariableRows(variables, search.binarySearchMainValues, previous)) {
    const projected = entry => row.name === "values[mid]" ? midValueOf(entry) : scalarOf(entry[row.name]);
    const expected = projected(variables) !== (previous ? projected(previous) : "—");
    assert.equal(row.changed, expected, `${step.id}: changed ${row.name}`);
  }
}
assert.equal(JSON.stringify(execution), savedExecution, "Intermediates never mutate the phase-2 snapshots");

const frame = id => { const step = content.steps.find(step => step.id === id); assert(step, id); return step.canvas; };
assert.deepEqual(plain(frame("execution-probe-1-mid").state.variables), { lo: 0, hi: 6, mid: 3 });
assert.deepEqual(plain(frame("execution-probe-1-drop-left").state.variables), { lo: 4, hi: 6, mid: 3 });
assert.deepEqual(plain(frame("execution-range-after-drop-left").state.variables), { lo: 4, hi: 6, mid: 3 },
  "mid keeps its last value while the settled range is shown");
assert.deepEqual(plain(frame("execution-probe-2-mid").state.variables), { lo: 4, hi: 6, mid: 5 });
assert.deepEqual(plain(frame("execution-probe-2-drop-right").state.variables), { lo: 4, hi: 4, mid: 5 });
assert.deepEqual(plain(frame("execution-range-single").state.variables), { lo: 4, hi: 4, mid: 5 });
assert.deepEqual(plain(frame("execution-probe-3-mid").state.variables), { lo: 4, hi: 4, mid: 4 });
const found = frame("execution-found");
assert.equal(found.highlights[0].id, "return-mid");
assert.deepEqual(plain(found.state.variables), { lo: 4, hi: 4, mid: 4 });
assert(found.state.execution.state.cells.includes("found"), "Found board shows the found cell");
assert.equal(content.steps.at(-1).id, "execution-found");
assert(!content.steps.some(step => step.canvas.highlights[0].id === "return-missing"),
  "return -1 is never executed in the found case");

for (const step of [content.steps[0], { canvas: frame("execution-probe-1-mid") }, { canvas: elseFrames[0].canvas }, content.steps.at(-1)]) {
  const html = renderToStaticMarkup(React.createElement(CodeDisplay, { code: binarySearchCode, label: "binary_searchのコード", activeLineId: step.canvas.highlights[0].id }));
  assert.equal((html.match(/aria-current="step"/gu) || []).length, 1);
  // renderToStaticMarkup は " > < & を実体参照にエスケープする。1パスで戻してから原文と照合する。
  const entities = { quot: "\"", gt: ">", lt: "<", amp: "&" };
  const unescape = text => text.replace(/&(quot|gt|lt|amp);/g, (_, name) => entities[name]);
  assert.equal([...html.matchAll(/<code[^>]*>([^<]*)<\/code>/gu)].map(match => unescape(match[1])).join("\n"), binarySearchCodeSource,
    "Rendered code stays byte-exact");
  const canvas = renderToStaticMarkup(React.createElement(BinarySearchCodeMappingCanvas, { canvas: step.canvas }));
  assert.match(canvas, /二分探索の図とコードの対応/u); assert.match(canvas, /コードの変数/u);
  for (const name of ["lo", "hi", "mid", "values[mid]"]) {
    assert(canvas.includes(`data-variable="${name}"`), `variable row ${name}`);
  }
  assert.equal((canvas.match(/data-array-bar=/g) ?? []).length, step.canvas.state.execution.state.values.length,
    "Rendered board matches the referenced phase-2 snapshot");
}
const preview = renderToStaticMarkup(React.createElement(BinarySearchCodeMappingPreview));
assert.match(preview, /aria-label="動きとコードの対応"/u);
assert.match(preview, /ステップ位置/u);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "binary-search-code-mapping"'));

assert.throws(() => validate({ ...found, state: { ...found.state, execution: plain(found.state.execution) } }), /canonical/u);
assert.throws(() => validate({ ...found, highlights: [{ kind: "code-line", id: "missing" }] }), /Unknown/u);
assert.throws(() => validate({ ...found, state: { ...found.state, variables: { ...found.state.variables, mid: 7 } } }), /scalar/u);
assert.throws(() => validate({ ...found, state: { ...found.state, variables: { ...found.state.variables, lo: 5 } } }), /non-empty/u);
assert.throws(() => defineBinarySearchCodeMappingContent({ ...content, steps: content.steps.filter(step => step.id !== "execution-probe-2-mid") }), /checkpoints/u);
assert.throws(() => defineBinarySearchCodeMappingContent({ ...content, steps: content.steps.filter(step => step.id !== "else-larger-2") }), /Unvisited/u);

const renderer = fs.readFileSync(file(`${feature}/BinarySearchCodeMappingCanvas.tsx`), "utf8");
assert.match(renderer, /<CodeVariableList/u, "renderer uses shared variable display");
assert.match(fs.readFileSync(file("components/code/CodeVariableList.tsx"), "utf8"), /prefers-reduced-motion: reduce/u);
assert.match(fs.readFileSync(file("components/code/CodeVariableList.tsx"), "utf8"), /bgcolor: changed \? playerTokens.focus : "transparent"/u);
assert.match(renderer, /<CodeMappingLayout/u, "renderer uses shared diagram/code layout");
assert.match(fs.readFileSync(file("components/code/CodeMappingLayout.tsx"), "utf8"), /Math.max\(620/u);
const entry = fs.readFileSync(file(`${feature}/BinarySearchCodeMappingPreview.tsx`), "utf8");
assert.match(entry, /84vw/u); assert.match(entry, /84dvh/u);
// 接続ポートは単元フロー向けの任意 props。単品では未指定で従来どおり動き、外部通信や保存は持たない。
assert.match(entry, /onComplete\?: \(\) => void/u); assert.match(entry, /endAction/u);
assert(!/fetch\(|localStorage/u.test(entry));
console.log(`Binary-search code mapping verified: ${content.steps.length} frames, byte-exact 12-line contract binary-search-v1, all CPython lines/locals, 9 phase-2 checkpoints (mids on the compute-mid line, drops on the assignment lines, settled ranges on the while re-evaluation, found on the return line), else explanation, shared rendering and standalone preview.`);
