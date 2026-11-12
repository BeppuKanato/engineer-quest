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
    if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
    const base = name.startsWith("@/") ? path.resolve(__dirname, "../src", name.slice(2)) : path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const file = name => `${root}/${name}`;
const feature = "greedy-coins/code-mapping";
const plain = value => JSON.parse(JSON.stringify(value));
const { greedyCoinsCodeMappingContent: content } = load(file(`${feature}/codeMapping.content.ts`));
const { greedyCoinsCode, greedyCoinsCodeSource, greedyCoinsCodeLineNumber } = load(file(`${feature}/greedyCoinsCode.ts`));
const { validateGreedyCoinsCodeMappingCanvas: validate, defineGreedyCoinsCodeMappingContent, checkpointStepIds } = load(file(`${feature}/codeMapping.types.ts`));
const { codeVariableRows } = load(file(`${feature}/codeMapping.presentation.ts`));
const { greedyCoinsExecutionContent: execution } = load(file("greedy-coins/execution/execution.content.ts"));
const coinsModule = load(file("greedy-coins/greedyCoins.ts"));
const { CodeDisplay } = load(file("code/CodeDisplay.tsx"));
const { GreedyCoinsCodeMappingCanvas } = load(file(`${feature}/GreedyCoinsCodeMappingCanvas.tsx`));
const { GreedyCoinsCodeMappingPreview } = load(file(`${feature}/GreedyCoinsCodeMappingPreview.tsx`));

assert.equal(content.id, "greedy-coins-code-mapping"); assert.equal(content.phase, 4);
assert.equal(content.stageName, "動きとコードの対応"); assert.equal(content.intervalMs, 3500);
assert.equal(greedyCoinsCode.id, "greedy-coins-v1"); assert.equal(greedyCoinsCode.version, 1);

// 基準データ §2 の参照コード（契約 greedy-coins-v1、8行）。行の追加・変更・言い換えがないことを照合する。
const expectedLines = [
  ["define-function", "def greedy_coins(amount, coins):"],
  ["init-result", "    result = []"],
  ["init-remaining", "    remaining = amount"],
  ["for-coin", "    for coin in coins:"],
  ["while-remaining", "        while remaining >= coin:"],
  ["append-coin", "            result.append(coin)"],
  ["subtract-coin", "            remaining -= coin"],
  ["return-result", "    return result"],
];
assert.deepEqual(plain(greedyCoinsCode.lines), expectedLines.map(([id, text]) => ({ id, text })),
  "Stable IDs and exact source indentation match the baseline §2 contract");
assert(Buffer.from(greedyCoinsCodeSource, "utf8").equals(Buffer.from(expectedLines.map(([, text]) => text).join("\n"), "utf8")),
  "Byte-exact code contract");
assert.equal(greedyCoinsCodeLineNumber("while-remaining"), 5);
assert.equal(greedyCoinsCodeLineNumber("append-coin"), 6);
assert.equal(greedyCoinsCodeLineNumber("subtract-coin"), 7);

// 参照コードを CPython で実際に実行し、全実行行とローカル変数を教材フレームと突き合わせる。
const run = spawnSync(process.env.PYTHON || "python3", [path.join(__dirname, "fixtures/greedyCoinsCodeMappingTrace.py")], {
  input: JSON.stringify({ code: greedyCoinsCodeSource, amount: 786, coins: [500, 100, 50, 10, 5, 1] }),
  encoding: "utf8", timeout: 10000, env: { ...process.env, PYTHONUTF8: "1" },
});
assert.ifError(run.error); assert.equal(run.status, 0, run.stderr);
const actual = JSON.parse(run.stdout);
assert.deepEqual(actual.result, [500, 100, 100, 50, 10, 10, 10, 5, 1], "Executed reference code pays 786 with 9 coins");
assert.deepEqual(plain(coinsModule.runGreedyCoins(786, [500, 100, 50, 10, 5, 1])), actual.result,
  "Contract run in greedyCoins.ts agrees with the executed reference code");
assert.equal(actual.trace.length, 43, "Baseline §3: 43 executed line events");
assert.equal(content.steps.length, 1 + actual.trace.length,
  "One frame per executed Python line, plus the define frame");
assert.equal(content.steps.length, 44);
assert.equal(content.steps[0].canvas.highlights[0].id, "define-function");
assert.deepEqual(plain(content.steps[0].canvas.state.variables), { remaining: null, coin: null, result: null });
const executedFrames = content.steps.slice(1);
for (const [index, step] of executedFrames.entries()) {
  assert.equal(greedyCoinsCodeLineNumber(step.canvas.highlights[0].id), actual.trace[index].line, step.id);
  assert.deepEqual(plain(step.canvas.state.variables), actual.trace[index].variables, `${step.id}: actual CPython locals`);
}

// フェーズ2の選択ステップ9つが、順番どおり append 行のチェックポイントとして現れる。
const checkpoints = content.steps.filter(step => step.canvas.state.frameKind === "execution");
assert.equal(checkpoints.length, 9);
assert.deepEqual(plain(checkpoints.map(step => step.id)),
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `execution-select-${n}`));
assert.deepEqual(plain(checkpoints.map(step => step.canvas.state.executionStepId)),
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `select-${n}`));
assert.deepEqual(plain(checkpointStepIds), plain(checkpoints.map(step => step.canvas.state.executionStepId)));
for (const step of checkpoints) {
  const reference = execution.steps.find(candidate => candidate.id === step.canvas.state.executionStepId);
  assert.equal(step.canvas.state.execution, reference.canvas, `${step.id}: board is the phase-2 snapshot itself`);
  assert.equal(step.caption, reference.caption, `${step.id}: checkpoint caption is the phase-2 caption`);
  assert.equal(step.canvas.highlights[0].id, "append-coin", `${step.id}: checkpoint sits on the append line`);
  const { variables } = step.canvas.state;
  // 記録された硬貨は盤面のトレイと一致する。remaining はこの時点ではまだ引かれておらず、
  // 次の subtract フレームで盤面の残額と一致する（実施記録の留保）。
  assert.deepEqual(plain(variables.result), plain(reference.canvas.state.tray), `${step.id}: result matches the tray`);
  assert.equal(variables.remaining, reference.canvas.state.remaining + variables.coin,
    `${step.id}: remaining is updated by the next line`);
  const next = content.steps[content.steps.indexOf(step) + 1];
  assert.equal(next.canvas.highlights[0].id, "subtract-coin");
  assert.equal(next.canvas.state.variables.remaining, reference.canvas.state.remaining,
    `${step.id}: the subtract frame aligns remaining with the board`);
}

const savedExecution = JSON.stringify(execution);
for (const step of [...content.steps].reverse()) {
  validate(step.canvas);
  assert.equal(step.canvas.state.execution, execution.steps.find(reference => reference.id === step.canvas.state.executionStepId).canvas);
  assert.equal(step.canvas.data.code, greedyCoinsCode);
  assert.equal((step.caption.match(/。/gu) || []).length, 1, `${step.id}: one sentence`);
  assert(!/行目|フェーズ/u.test(step.caption), `${step.id}: no meta wording`);
  const variables = step.canvas.state.variables;
  const index = content.steps.indexOf(step);
  const previous = content.steps[index - 1]?.canvas.state.variables;
  for (const row of codeVariableRows(variables, previous)) {
    const projected = entry => row.name === "result"
      ? (entry.result === null ? "—" : `[${entry.result.join(", ")}]`)
      : (entry[row.name] === null ? "—" : String(entry[row.name]));
    const expected = projected(variables) !== (previous ? projected(previous) : "—");
    assert.equal(row.changed, expected, `${step.id}: changed ${row.name}`);
  }
}
assert.equal(JSON.stringify(execution), savedExecution, "Intermediates never mutate the phase-2 snapshots");

const frame = id => { const step = content.steps.find(step => step.id === id); assert(step, id); return step.canvas; };
assert.deepEqual(plain(frame("execution-select-1").state.variables), { remaining: 786, coin: 500, result: [500] });
assert.deepEqual(plain(frame("subtract-coin-1").state.variables), { remaining: 286, coin: 500, result: [500] });
assert.deepEqual(plain(frame("execution-select-4").state.variables), { remaining: 86, coin: 50, result: [500, 100, 100, 50] });
assert.deepEqual(plain(frame("execution-select-9").state.variables), { remaining: 1, coin: 1, result: [500, 100, 100, 50, 10, 10, 10, 5, 1] });
const returned = frame("return-result");
assert.equal(returned.highlights[0].id, "return-result");
assert.deepEqual(plain(returned.state.variables), { remaining: 0, coin: 1, result: [500, 100, 100, 50, 10, 10, 10, 5, 1] });
assert.equal(returned.state.executionStepId, "summary", "Return frame shows the completed board");
assert.equal(content.steps.at(-1).id, "return-result");
assert.equal(content.steps.filter(step => step.canvas.highlights[0].id === "while-remaining").length, 15,
  "while evaluations: 9 true (one per coin) plus 6 false (one per denomination)");
assert.equal(content.steps.filter(step => step.canvas.highlights[0].id === "for-coin").length, 7,
  "for evaluations: 6 denominations plus the exhaustion frame");

for (const step of [content.steps[0], { canvas: frame("execution-select-1") }, { canvas: frame("return-result") }]) {
  const html = renderToStaticMarkup(React.createElement(CodeDisplay, { code: greedyCoinsCode, label: "greedy_coinsのコード", activeLineId: step.canvas.highlights[0].id }));
  assert.equal((html.match(/aria-current="step"/gu) || []).length, 1);
  const entities = { quot: "\"", gt: ">", lt: "<", amp: "&" };
  const unescape = text => text.replace(/&(quot|gt|lt|amp);/g, (_, name) => entities[name]);
  assert.equal([...html.matchAll(/<code[^>]*>([^<]*)<\/code>/gu)].map(match => unescape(match[1])).join("\n"), greedyCoinsCodeSource,
    "Rendered code stays byte-exact");
  const canvas = renderToStaticMarkup(React.createElement(GreedyCoinsCodeMappingCanvas, { canvas: step.canvas }));
  assert.match(canvas, /貪欲法の図とコードの対応/u); assert.match(canvas, /コードの変数/u);
  for (const name of ["remaining", "coin", "result"]) {
    assert(canvas.includes(`data-variable="${name}"`), `variable row ${name}`);
  }
  assert.equal((canvas.match(/data-coin-chip=/g) ?? []).length, step.canvas.state.execution.state.coins.length,
    "Rendered board matches the referenced phase-2 snapshot");
}
const preview = renderToStaticMarkup(React.createElement(GreedyCoinsCodeMappingPreview));
assert.match(preview, /aria-label="動きとコードの対応"/u);
assert.match(preview, /ステップ位置/u);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "greedy-coins-code-mapping"'));

assert.throws(() => validate({ ...returned, state: { ...returned.state, execution: plain(returned.state.execution) } }), /canonical/u);
assert.throws(() => validate({ ...returned, highlights: [{ kind: "code-line", id: "missing" }] }), /Unknown/u);
assert.throws(() => validate({ ...returned, state: { ...returned.state, variables: { ...returned.state.variables, remaining: 787 } } }), /remaining/u);
assert.throws(() => validate({ ...returned, state: { ...returned.state, variables: { ...returned.state.variables, result: [100] } } }), /prefix/u);
assert.throws(() => defineGreedyCoinsCodeMappingContent({ ...content, steps: content.steps.filter(step => step.id !== "execution-select-4") }), /checkpoints/u);
assert.throws(() => defineGreedyCoinsCodeMappingContent({ ...content, steps: content.steps.filter(step => step.id !== "return-result") }), /Unvisited/u);

const renderer = fs.readFileSync(file(`${feature}/GreedyCoinsCodeMappingCanvas.tsx`), "utf8");
assert.match(renderer, /<CodeVariableList/u, "renderer uses shared variable display");
assert.match(fs.readFileSync(file("components/code/CodeVariableList.tsx"), "utf8"), /prefers-reduced-motion: reduce/u);
assert.match(fs.readFileSync(file("components/code/CodeVariableList.tsx"), "utf8"), /bgcolor: changed \? playerTokens.focus : "transparent"/u);
assert.match(renderer, /<CodeMappingLayout/u, "renderer uses shared diagram/code layout");
assert.match(fs.readFileSync(file("components/code/CodeMappingLayout.tsx"), "utf8"), /Math.max\(620/u);
const entry = fs.readFileSync(file(`${feature}/GreedyCoinsCodeMappingPreview.tsx`), "utf8");
assert.match(entry, /84vw/u); assert.match(entry, /84dvh/u);
assert.match(entry, /onComplete\?: \(\) => void/u); assert.match(entry, /endAction/u);
assert(!/fetch\(|localStorage/u.test(entry));
console.log(`Greedy-coins code mapping verified: ${content.steps.length} frames (define + 43 CPython line executions), byte-exact 8-line contract greedy-coins-v1, all CPython lines/locals, 9 phase-2 checkpoints on the result.append(coin) line, shared rendering and standalone preview.`);
