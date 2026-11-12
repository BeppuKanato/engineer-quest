const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
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
    if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
    const base = name.startsWith("@/") ? path.resolve(__dirname, "../src", name.slice(2)) : path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const feature = `${root}/binary-search/execution`;
const plain = value => JSON.parse(JSON.stringify(value));
const { binarySearchExecutionContent: content } = load(`${feature}/execution.content.ts`);
const { validateBinarySearchExecutionCanvas: validate } = load(`${feature}/execution.types.ts`);
const searchModule = load(`${root}/binary-search/binarySearch.ts`);
const { BinarySearchExecutionCanvas } = load(`${feature}/BinarySearchExecutionCanvas.tsx`);
const { BinarySearchExecutionPreview } = load(`${feature}/BinarySearchExecutionPreview.tsx`);
const { validateArrayBarsCanvas } = load(`${root}/player/arrayBars.types.ts`);
const { steps } = content;
const get = id => { const step = steps.find(step => step.id === id); assert(step, `Missing step: ${id}`); return step; };

// 契約 binary-search-v1 を独立に再実装し、教材の全ステップと突き合わせる（基準データ §1・§2）。
function referenceProbes(values, target) {
  const probes = [];
  let lo = 0, hi = values.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const value = values[mid];
    if (value === target) { probes.push({ lo, hi, mid, value, outcome: "hit" }); break; }
    if (value < target) { probes.push({ lo, hi, mid, value, outcome: "drop-left" }); lo = mid + 1; }
    else { probes.push({ lo, hi, mid, value, outcome: "drop-right" }); hi = mid - 1; }
  }
  return probes;
}
const main = [3, 7, 12, 19, 25, 31, 42];
const target = 25;
const reference = referenceProbes(main, target);
assert.equal(reference.length, 3, "Main example compares 3 times");
assert.deepEqual(plain(reference.map(probe => probe.outcome)), ["drop-left", "drop-right", "hit"]);
assert.deepEqual(plain(searchModule.binarySearchProbes(main, target)), reference, "Module builder reproduces the verified trace");
assert.equal(searchModule.runBinarySearch(main, target), 4, "Main example finds 25 at index 4");

assert.equal(content.id, "binary-search-execution"); assert.equal(content.phase, 2); assert.equal(content.stageName, "動きの説明");
assert(content.intervalMs >= 2500);
assert.equal(steps.length, 11, "Phase 2 keeps all 11 steps");
assert.deepEqual(plain(steps.map(step => step.id)), [
  "introduce", "range-full",
  "probe-1-mid", "probe-1-drop-left", "range-after-drop-left",
  "probe-2-mid", "probe-2-drop-right", "range-single",
  "probe-3-mid", "found", "summary",
]);
assert.deepEqual(plain(steps.map(step => step.caption)), [
  "数字が小さい順に並んでいることが前提の探し方で、25 を探します。",
  "まず、探す範囲は全体です。",
  "真ん中の 19 を見ます。",
  "19 は 25 より小さいので、左側には 25 はありません。",
  "残った範囲はここだけです。",
  "新しい真ん中の 31 を見ます。",
  "31 は 25 より大きいので、右側には 25 はありません。",
  "残った範囲は 1 個だけです。",
  "その 1 個の 25 を見ます。",
  "25 が、左から 5 番目（インデックス 4）に見つかりました。",
  "見るたびに範囲が半分になり、3 回で見つかりました。",
]);
assert(steps.every(step => (step.caption.match(/。/gu) ?? []).length === 1), "One sentence per step");
for (const step of steps) validate(step.canvas);

// 全ステップで盤面は主教材のまま（値・探す値は変わらない）。
for (const step of steps) {
  assert.deepEqual(plain(step.canvas.state.values), main, `Step ${step.id}: main values`);
  assert.equal(step.canvas.state.target, target, `Step ${step.id}: target`);
  assert.equal(step.canvas.data.kind, "binary-search-execution");
}

// 盤面状態列の期待値（基準データ §3 フェーズ2の「図の状態」列）。
const D = "discarded", I = "in-range", R = "remaining", C = "center", F = "found";
const expectedCells = {
  "introduce": [I, I, I, I, I, I, I],
  "range-full": [I, I, I, I, I, I, I],
  "probe-1-mid": [I, I, I, C, I, I, I],
  "probe-1-drop-left": [D, D, D, C, I, I, I],
  "range-after-drop-left": [D, D, D, D, R, R, R],
  "probe-2-mid": [D, D, D, D, I, C, I],
  "probe-2-drop-right": [D, D, D, D, I, C, D],
  "range-single": [D, D, D, D, R, D, D],
  "probe-3-mid": [D, D, D, D, C, D, D],
  "found": [D, D, D, D, F, D, D],
  "summary": [D, D, D, D, F, D, D],
};
for (const step of steps) {
  assert.deepEqual(plain(step.canvas.state.cells), expectedCells[step.id], `Step ${step.id}: cell states`);
}

// 比較ステップの lo / hi / mid は契約実行記録（probes）と一致する。
reference.forEach((probe, index) => {
  const nth = index + 1;
  const suffixes = probe.outcome === "hit" ? ["mid"] : ["mid", probe.outcome];
  for (const suffix of suffixes) {
    const step = get(`probe-${nth}-${suffix}`);
    assert.equal(step.canvas.state.lo, probe.lo, `Step ${step.id}: lo`);
    assert.equal(step.canvas.state.hi, probe.hi, `Step ${step.id}: hi`);
    assert.equal(step.canvas.state.mid, probe.mid, `Step ${step.id}: mid`);
  }
});
assert.deepEqual(plain([get("found").canvas.state.lo, get("found").canvas.state.hi, get("found").canvas.state.mid]),
  [reference[2].lo, reference[2].hi, reference[2].mid], "Found step keeps the hit probe range");
// 捨てた直後の確定範囲は、次の比較の範囲と一致する。
assert.deepEqual(plain([get("range-after-drop-left").canvas.state.lo, get("range-after-drop-left").canvas.state.hi]),
  [reference[1].lo, reference[1].hi], "Settled range after dropping left");
assert.deepEqual(plain([get("range-single").canvas.state.lo, get("range-single").canvas.state.hi]),
  [reference[2].lo, reference[2].hi], "Settled single range");
// 範囲提示前と提示直後。
assert.deepEqual(plain([get("introduce").canvas.state.lo, get("introduce").canvas.state.hi, get("introduce").canvas.state.mid]),
  [null, null, null], "Introduction has no range yet");
assert.deepEqual(plain(get("introduce").canvas.highlights), [{ kind: "cell", id: 4 }], "Introduction points at the target cell");
assert.deepEqual(plain([get("range-full").canvas.state.lo, get("range-full").canvas.state.hi]), [0, 6], "Full range");
// 発見ステップ: 発見セルは実行記録の一致位置で、強調リングが付く。まとめは中央を外して同じ確定図にする。
const foundStep = get("found");
assert.equal(foundStep.canvas.state.cells.indexOf(F), searchModule.runBinarySearch(main, target), "Found cell is the hit position");
assert.deepEqual(plain(foundStep.canvas.highlights), [{ kind: "cell", id: 4 }], "Found cell is ringed");
const summaryStep = get("summary");
assert.equal(summaryStep.canvas.state.mid, null, "Summary has no active mid");
assert.deepEqual(plain(summaryStep.canvas.highlights), [], "Summary has no highlight");
// フェーズ3の場面（1回目の比較が終わり、左側を捨てた直後）は range-after-drop-left がそのまま担う。
assert.deepEqual(plain([get("range-after-drop-left").canvas.state.lo, get("range-after-drop-left").canvas.state.hi]), [4, 6]);
// 捨てたセルは単調に増える（範囲外が範囲内へ戻ることはない）。
steps.forEach((step, index) => {
  if (index === 0) return;
  const before = steps[index - 1].canvas.state.cells;
  step.canvas.state.cells.forEach((status, cellIndex) => {
    assert(!(before[cellIndex] === D && status !== D), `Step ${step.id}: discarded cells never return`);
  });
});

// 実描画: 棒の本数・セル状態の写像（範囲外＝完了、範囲内＝未処理、中央と発見＝処理中）・発見の枠が SVG に現れる。
const playerStatusOf = { discarded: "completed", "in-range": "idle", remaining: "queued", center: "processing", found: "processing" };
for (const step of steps) {
  const html = renderToStaticMarkup(createElement(BinarySearchExecutionCanvas, { canvas: step.canvas }));
  assert(html.includes('viewBox="0 0 600 450"'), `Step ${step.id}: viewport`);
  assert.equal((html.match(/data-array-bar="\d+"/g) ?? []).length, 7, `Step ${step.id}: bar count`);
  const rendered = [...html.matchAll(/data-array-status="(\w+)"/g)].map(match => match[1]);
  assert.deepEqual(plain(rendered), plain(step.canvas.state.cells.map(status => playerStatusOf[status])), `Step ${step.id}: rendered cell statuses`);
  assert.equal((html.match(/data-array-highlight="\d+"/g) ?? []).length,
    step.canvas.highlights.length, `Step ${step.id}: highlight ring`);
  assert(!(html.includes('data-array-comparing="true"') || html.includes('data-array-fixed="true"')),
    `Step ${step.id}: bubble-sort vocabulary is not used`);
}
const previewHtml = renderToStaticMarkup(createElement(BinarySearchExecutionPreview));
assert(previewHtml.includes('aria-label="動きの説明"') && previewHtml.includes(steps[0].caption));
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "binary-search-execution"'));

// 単元側の検証は、盤面の意味と矛盾する状態を弾く。
const probeBoard = plain(get("probe-1-mid").canvas);
assert.throws(() => validate({ ...probeBoard, state: { ...probeBoard.state, mid: 2 } }), /Center cell must be the mid/);
const droppedWrongSide = plain(get("probe-1-drop-left").canvas);
droppedWrongSide.state.cells = [D, I, I, C, D, I, I];
assert.throws(() => validate(droppedWrongSide), /one side of mid/);
const settledWithDrop = plain(get("range-after-drop-left").canvas);
settledWithDrop.state.cells = [D, D, D, D, D, I, I];
assert.throws(() => validate(settledWithDrop), /require a mid/);
const remainingWithoutDrop = plain(get("range-full").canvas);
remainingWithoutDrop.state.cells = [R, R, R, R, R, R, R];
assert.throws(() => validate(remainingWithoutDrop), /dropped part/);
const wrongFound = plain(get("range-full").canvas);
wrongFound.state.cells = [F, I, I, I, I, I, I];
assert.throws(() => validate(wrongFound), /Found cell must hold the target/);
const badHighlight = plain(get("range-full").canvas);
badHighlight.highlights = [{ kind: "cell", id: 0 }];
assert.throws(() => validate(badHighlight), /Highlights are limited/);
const outOfRange = plain(get("range-full").canvas);
outOfRange.state.hi = 7;
assert.throws(() => validate(outOfRange), /Range out of board/);
// 共通配列基盤の cellStatuses 拡張は、従来の語彙との混用を弾く。
const sharedBoard = { data: { kind: "array-bars" }, state: { values: main, comparing: [0, 1], fixedFrom: 7, cellStatuses: main.map(() => "idle") }, highlights: [] };
assert.throws(() => validateArrayBarsCanvas(sharedBoard), /cannot be combined with a comparing pair/);
console.log("Binary-search execution: 11 steps, verified trace of [3,7,12,19,25,31,42] finding 25 (3 probes: drop-left, drop-right, hit), board states, status mapping, rendering and standalone preview passed.");
