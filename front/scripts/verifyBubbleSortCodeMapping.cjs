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
const feature = "bubble-sort/code-mapping";
const plain = value => JSON.parse(JSON.stringify(value));
const { bubbleSortCodeMappingContent: content } = load(file(`${feature}/codeMapping.content.ts`));
const { bubbleSortCode, bubbleSortCodeSource, bubbleSortCodeLineNumber } = load(file(`${feature}/bubbleSortCode.ts`));
const { validateBubbleSortCodeMappingCanvas: validate, defineBubbleSortCodeMappingContent } = load(file(`${feature}/codeMapping.types.ts`));
const { codeVariableRows } = load(file(`${feature}/codeMapping.presentation.ts`));
const { bubbleSortExecutionContent: execution } = load(file("bubble-sort/execution/execution.content.ts"));
const sort = load(file("bubble-sort/bubbleSort.ts"));
const { CodeDisplay } = load(file("code/CodeDisplay.tsx"));
const { BubbleSortCodeMappingCanvas } = load(file(`${feature}/BubbleSortCodeMappingCanvas.tsx`));
const { BubbleSortCodeMappingPreview } = load(file(`${feature}/BubbleSortCodeMappingPreview.tsx`));

assert.equal(content.id, "bubble-sort-code-mapping"); assert.equal(content.phase, 4);
assert.equal(content.stageName, "動きとコードの対応"); assert.equal(content.intervalMs, 3500);
assert.equal(bubbleSortCode.id, "bubble-sort-v1"); assert.equal(bubbleSortCode.version, 1);

// 基準データ §2 の参照コード（契約 bubble-sort-v1）。行の追加・変更・言い換えがないことを照合する。
const expectedLines = [
  ["define-function", "def bubble_sort(values):"],
  ["copy-values", "    result = list(values)"],
  ["count-values", "    n = len(result)"],
  ["for-pass", "    for i in range(n - 1):"],
  ["for-compare", "        for j in range(n - 1 - i):"],
  ["if-larger", "            if result[j] > result[j + 1]:"],
  ["swap-values", "                result[j], result[j + 1] = result[j + 1], result[j]"],
  ["return-result", "    return result"],
];
assert.deepEqual(plain(bubbleSortCode.lines), expectedLines.map(([id, text]) => ({ id, text })),
  "Stable IDs and exact source indentation match the baseline §2 contract");
assert(Buffer.from(bubbleSortCodeSource, "utf8").equals(Buffer.from(expectedLines.map(([, text]) => text).join("\n"), "utf8")),
  "Byte-exact code contract");

// 参照コードを CPython で実際に実行し、全実行行とローカル変数を教材フレームと突き合わせる。
const run = spawnSync(process.env.PYTHON || "python3", [path.join(__dirname, "fixtures/bubbleSortCodeMappingTrace.py")], {
  input: JSON.stringify({ code: bubbleSortCodeSource, values: [...sort.bubbleSortMainValues] }),
  encoding: "utf8", timeout: 10000, env: { ...process.env, PYTHONUTF8: "1" },
});
assert.ifError(run.error); assert.equal(run.status, 0, run.stderr);
const actual = JSON.parse(run.stdout);
assert.deepEqual(actual.result, [1, 2, 3, 4, 5], "Executed reference code sorts the main teaching values");
assert.deepEqual(plain(execution.steps.at(-1).canvas.state.values), actual.result,
  "Phase-2 final board equals the executed result");
const executedFrames = content.steps.slice(1);
assert.equal(content.steps.length, 1 + actual.trace.length,
  "One frame per executed Python line, plus the define frame");
assert.equal(content.steps[0].canvas.highlights[0].id, "define-function");
assert.deepEqual(plain(content.steps[0].canvas.state.variables),
  { result: null, n: null, i: null, j: null });
for (const [index, step] of executedFrames.entries()) {
  assert.equal(bubbleSortCodeLineNumber(step.canvas.highlights[0].id), actual.trace[index].line, step.id);
  assert.deepEqual(plain(step.canvas.state.variables), actual.trace[index].variables, `${step.id}: actual CPython locals`);
}

// フェーズ2の16ステップがすべて、順番どおりチェックポイントとして現れる。
const comparisons = sort.bubbleSortComparisons(sort.bubbleSortMainValues);
const checkpointLine = stepId => {
  if (stepId === "initial") return "copy-values";
  if (stepId === "complete") return "for-pass";
  if (stepId.startsWith("pass-end-")) return "for-compare";
  const [, pass, j] = stepId.split("-").map(Number);
  const comparison = comparisons.find(candidate => candidate.pass === pass && candidate.j === j);
  assert(comparison, stepId);
  return comparison.swapped ? "swap-values" : "if-larger";
};
const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
assert.equal(checkpoints.length, 16);
assert.deepEqual(plain(checkpoints.map(step => step.canvas.state.executionStepId)), plain(execution.steps.map(step => step.id)));
for (const step of checkpoints) {
  const reference = execution.steps.find(candidate => candidate.id === step.canvas.state.executionStepId);
  assert.equal(step.canvas.state.execution, reference.canvas, `${step.id}: board is the phase-2 snapshot itself`);
  assert.equal(step.caption, reference.caption, `${step.id}: checkpoint caption is the phase-2 caption`);
  assert.equal(step.canvas.highlights[0].id, checkpointLine(step.canvas.state.executionStepId),
    `${step.id}: the line that completes the phase-2 step (swaps show the swap line)`);
}

const pairOf = variables => variables.result === null || variables.j === null || variables.j + 1 >= variables.result.length
  ? "—" : `(${variables.result[variables.j]}, ${variables.result[variables.j + 1]})`;
const savedExecution = JSON.stringify(execution);
for (const step of [...content.steps].reverse()) {
  validate(step.canvas);
  assert.equal(step.canvas.state.execution, execution.steps.find(reference => reference.id === step.canvas.state.executionStepId).canvas);
  assert.equal(step.canvas.data.code, bubbleSortCode);
  assert.equal((step.caption.match(/。/gu) || []).length, 1, `${step.id}: one sentence`);
  assert(!/行目|フェーズ/u.test(step.caption), `${step.id}: no meta wording`);
  const variables = step.canvas.state.variables;
  const index = content.steps.indexOf(step);
  const previous = content.steps[index - 1]?.canvas.state.variables;
  for (const row of codeVariableRows(variables, previous)) {
    const expected = row.name === "比べるペア"
      ? pairOf(variables) !== pairOf(previous ?? variables)
      : JSON.stringify(variables[row.name]) !== JSON.stringify(previous?.[row.name] ?? null);
    assert.equal(row.changed, expected, `${step.id}: changed ${row.name}`);
  }
}
assert.equal(JSON.stringify(execution), savedExecution, "Intermediates never mutate the phase-2 snapshots");

const frame = id => { const step = content.steps.find(step => step.id === id); assert(step, id); return step.canvas; };
const firstSwap = frame("execution-compare-1-0");
assert.deepEqual(plain(firstSwap.state.variables.result), [2, 4, 5, 1, 3]);
assert.equal(firstSwap.state.variables.i, 0); assert.equal(firstSwap.state.variables.j, 0);
assert.equal(firstSwap.highlights[0].id, "swap-values");
// 交換行の直前の条件フレームでは、result はまだ交換前の配列を示す。
const firstIfIndex = content.steps.findIndex(step => step.id === "execution-compare-1-0") - 1;
assert.equal(content.steps[firstIfIndex].id, "if-larger-1-0");
assert.deepEqual(plain(content.steps[firstIfIndex].canvas.state.variables.result), [4, 2, 5, 1, 3]);
const noSwap = frame("execution-compare-1-1");
assert.equal(noSwap.highlights[0].id, "if-larger", "A comparison without a swap completes on the condition line");
assert.deepEqual(plain(noSwap.state.execution.state.values), [2, 4, 5, 1, 3]);
assert.deepEqual(plain(noSwap.state.execution.state.comparing), [1, 2]);
assert.equal(frame("execution-pass-end-1").state.variables.j, 3, "j keeps its last value when the inner loop exits");
assert.equal(frame("execution-pass-end-1").highlights[0].id, "for-compare");
assert.deepEqual(plain(frame("execution-pass-end-1").state.execution.state.values), [2, 4, 1, 3, 5]);
assert.equal(frame("execution-complete").state.variables.i, 3);
assert.equal(frame("execution-complete").highlights[0].id, "for-pass");
assert.equal(content.steps.at(-1).canvas.highlights[0].id, "return-result");
assert.match(content.steps.find(step => step.id === "if-larger-2-1").caption, /4 は 1 より大きい/u);

for (const step of [content.steps[0], { canvas: firstSwap }, { canvas: frame("execution-pass-end-2") }, content.steps.at(-1)]) {
  const html = renderToStaticMarkup(React.createElement(CodeDisplay, { code: bubbleSortCode, label: "bubble_sortのコード", activeLineId: step.canvas.highlights[0].id }));
  assert.equal((html.match(/aria-current="step"/gu) || []).length, 1);
  // renderToStaticMarkup は " > < & を実体参照にエスケープする。1パスで戻してから原文と照合する。
  const entities = { quot: "\"", gt: ">", lt: "<", amp: "&" };
  const unescape = text => text.replace(/&(quot|gt|lt|amp);/g, (_, name) => entities[name]);
  assert.equal([...html.matchAll(/<code[^>]*>([^<]*)<\/code>/gu)].map(match => unescape(match[1])).join("\n"), bubbleSortCodeSource,
    "Rendered code stays byte-exact");
  const canvas = renderToStaticMarkup(React.createElement(BubbleSortCodeMappingCanvas, { canvas: step.canvas }));
  assert.match(canvas, /バブルソートの図とコードの対応/u); assert.match(canvas, /コードの変数/u);
  for (const name of ["n", "i", "j", "比べるペア"]) {
    assert(canvas.includes(`data-variable="${name}"`), `variable row ${name}`);
  }
  assert.equal((canvas.match(/data-array-bar=/g) ?? []).length, step.canvas.state.execution.state.values.length,
    "Rendered board matches the referenced phase-2 snapshot");
}
const preview = renderToStaticMarkup(React.createElement(BubbleSortCodeMappingPreview));
assert.match(preview, /aria-label="動きとコードの対応"/u);
assert.match(preview, /ステップ位置/u);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "bubble-sort-code-mapping"'));

assert.throws(() => validate({ ...firstSwap, state: { ...firstSwap.state, execution: plain(firstSwap.state.execution) } }), /canonical/u);
assert.throws(() => validate({ ...firstSwap, highlights: [{ kind: "code-line", id: "missing" }] }), /Unknown/u);
assert.throws(() => validate({ ...firstSwap, state: { ...firstSwap.state, variables: { ...firstSwap.state.variables, result: [1, 2, 3, 5, 4] } } }), /reach/u);
assert.throws(() => validate({ ...firstSwap, state: { ...firstSwap.state, variables: { ...firstSwap.state.variables, i: 4 } } }), /scalar/u);
assert.throws(() => validate({ ...firstSwap, state: { ...firstSwap.state, variables: { ...firstSwap.state.variables, n: 4 } } }), /main teaching/u);
assert.throws(() => defineBubbleSortCodeMappingContent({ ...content, steps: content.steps.filter(step => step.id !== "execution-compare-1-0") }), /16/u);

const renderer = fs.readFileSync(file(`${feature}/BubbleSortCodeMappingCanvas.tsx`), "utf8");
assert.match(renderer, /prefers-reduced-motion: reduce/u);
assert.match(renderer, /bgcolor: changed \? playerTokens.focus : "transparent"/u);
assert.match(renderer, /Math.max\(620/u);
const entry = fs.readFileSync(file(`${feature}/BubbleSortCodeMappingPreview.tsx`), "utf8");
assert.match(entry, /84vw/u); assert.match(entry, /84dvh/u);
// 接続ポートは単元フロー（#235）向けの任意 props。単品では未指定で従来どおり動き、外部通信や保存は持たない。
assert.match(entry, /onComplete\?: \(\) => void/u); assert.match(entry, /endAction/u);
assert(!/fetch\(|localStorage/u.test(entry));
console.log(`Bubble-sort code mapping verified: ${content.steps.length} frames, byte-exact 8-line contract bubble-sort-v1, all CPython lines/locals, 16 phase-2 checkpoints (swaps on the swap line, non-swaps on the condition line), shared rendering and standalone preview.`);
