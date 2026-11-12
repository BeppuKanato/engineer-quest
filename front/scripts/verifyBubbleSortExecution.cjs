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
const feature = `${root}/units/bubble-sort/execution`;
const plain = value => JSON.parse(JSON.stringify(value));
const { bubbleSortExecutionContent: content } = load(`${feature}/execution.content.ts`);
const { validateBubbleSortExecutionCanvas: validate } = load(`${feature}/execution.types.ts`);
const sortModule = load(`${root}/units/bubble-sort/bubbleSort.ts`);
const { BubbleSortExecutionCanvas } = load(`${feature}/BubbleSortExecutionCanvas.tsx`);
const { BubbleSortExecutionPreview } = load(`${feature}/BubbleSortExecutionPreview.tsx`);
const { steps } = content;
const get = id => { const step = steps.find(step => step.id === id); assert(step, `Missing step: ${id}`); return step; };

// 契約 bubble-sort-v1 を独立に再実装し、教材の全ステップと突き合わせる（基準データ §1・§2）。
function referenceComparisons(values) {
  const result = [...values];
  const comparisons = [];
  for (let i = 0; i < result.length - 1; i++) {
    for (let j = 0; j < result.length - 1 - i; j++) {
      const pair = [result[j], result[j + 1]];
      const swapped = result[j] > result[j + 1];
      if (swapped) { result[j] = pair[1]; result[j + 1] = pair[0]; }
      comparisons.push({ pass: i + 1, j, pair, swapped, after: [...result] });
    }
  }
  return comparisons;
}
const main = [4, 2, 5, 1, 3];
const reference = referenceComparisons(main);
assert.equal(reference.length, 10, "Main example compares 10 times");
assert.equal(reference.filter(comparison => comparison.swapped).length, 6, "Main example swaps 6 times");
assert.deepEqual(plain(sortModule.bubbleSortComparisons(main)), reference, "Module builder reproduces the verified trace");

assert.equal(content.id, "bubble-sort-execution"); assert.equal(content.phase, 2); assert.equal(content.stageName, "動きの説明");
assert(content.intervalMs >= 2500);
assert.equal(steps.length, 16, "Phase 2 keeps all 16 steps");
assert.deepEqual(plain(steps.map(step => step.id)), [
  "initial",
  "compare-1-0", "compare-1-1", "compare-1-2", "compare-1-3", "pass-end-1",
  "compare-2-0", "compare-2-1", "compare-2-2", "pass-end-2",
  "compare-3-0", "compare-3-1", "pass-end-3",
  "compare-4-0", "pass-end-4",
  "complete",
]);
assert.deepEqual(plain(steps.map(step => step.caption)), [
  "5つの数が、バラバラに並んでいます。",
  "4 と 2 を比べて、入れ替えます。",
  "4 と 5 を比べて、そのままにします。",
  "5 と 1 を比べて、入れ替えます。",
  "5 と 3 を比べて、入れ替えます。",
  "一番大きい 5 が、右端に決まりました。",
  "2 と 4 を比べて、そのままにします。",
  "4 と 1 を比べて、入れ替えます。",
  "4 と 3 を比べて、入れ替えます。",
  "次に大きい 4 が、5 の左隣に決まりました。",
  "2 と 1 を比べて、入れ替えます。",
  "2 と 3 を比べて、そのままにします。",
  "3 が、4 の左隣に決まりました。",
  "1 と 2 を比べて、そのままにします。",
  "2 が、3 の左隣に決まりました。",
  "並び替えが完成しました。",
]);
assert(steps.every(step => (step.caption.match(/。/gu) ?? []).length === 1), "One sentence per step");
for (const step of steps) validate(step.canvas);

// 全ステップで値の多重集合は主教材のまま（値は消えたり増えたりしない）。
for (const step of steps) {
  assert.deepEqual(plain([...step.canvas.state.values].sort((a, b) => a - b)), [1, 2, 3, 4, 5], `Step ${step.id}: same values`);
  assert.equal(step.canvas.data.kind, "array-bars");
}
// 確定範囲は単調に広がる（fixedFrom は増えない）。
steps.forEach((step, index) => {
  if (index === 0) return;
  assert(step.canvas.state.fixedFrom <= steps[index - 1].canvas.state.fixedFrom, `Step ${step.id}: fixed range only grows`);
});

// 初期状態と比較ステップ: 配列・比べたペア・確定範囲・交換の強調がトレースと一致する。
assert.deepEqual(plain(get("initial").canvas.state), { values: main, comparing: null, fixedFrom: 5 });
assert.deepEqual(plain(get("initial").canvas.highlights), []);
for (const comparison of reference) {
  const step = get(`compare-${comparison.pass}-${comparison.j}`);
  assert.deepEqual(plain(step.canvas.state.values), comparison.after, `Step ${step.id}: values after comparison`);
  assert.deepEqual(plain(step.canvas.state.comparing), [comparison.j, comparison.j + 1], `Step ${step.id}: compared pair`);
  assert.equal(step.canvas.state.fixedFrom, main.length - (comparison.pass - 1), `Step ${step.id}: nothing fixed during the pass`);
  assert.deepEqual(plain(step.canvas.highlights.map(highlight => highlight.id)),
    comparison.swapped ? [comparison.j, comparison.j + 1] : [], `Step ${step.id}: swapped cells highlighted`);
  assert.equal(step.caption, `${comparison.pair[0]} と ${comparison.pair[1]} を比べて、${comparison.swapped ? "入れ替えます" : "そのままにします"}。`);
}
// フェーズ3の場面（1周目の2回目の比較まで終えた状態）は compare-1-1 がそのまま担う。
assert.deepEqual(plain(get("compare-1-1").canvas.state.values), [2, 4, 5, 1, 3]);

// 各周の確定ステップ: その周の最後の比較後の配列で、右端から1つずつ確定する。
for (let pass = 1; pass <= 4; pass++) {
  const step = get(`pass-end-${pass}`);
  const lastOfPass = reference.filter(comparison => comparison.pass === pass).at(-1);
  assert.deepEqual(plain(step.canvas.state.values), lastOfPass.after, `pass-end-${pass}: values`);
  assert.equal(step.canvas.state.comparing, null, `pass-end-${pass}: settled`);
  assert.equal(step.canvas.state.fixedFrom, main.length - pass, `pass-end-${pass}: one more cell fixed`);
  assert.deepEqual(plain(step.canvas.highlights), [], `pass-end-${pass}: no highlight`);
  // 確定したばかりの位置には、その周で右端へ届いた値が入っている。
  const fixedIndex = main.length - pass;
  assert.equal(step.canvas.state.values[fixedIndex], [5, 4, 3, 2][pass - 1], `pass-end-${pass}: fixed value`);
}
assert.deepEqual(plain(get("complete").canvas.state), { values: [1, 2, 3, 4, 5], comparing: null, fixedFrom: 0 });
assert.deepEqual(plain(get("complete").canvas.highlights), []);

// 実描画: 棒の本数・比べているペア・交換の枠・確定マスが SVG に現れる。
for (const step of steps) {
  const html = renderToStaticMarkup(createElement(BubbleSortExecutionCanvas, { canvas: step.canvas }));
  assert(html.includes('viewBox="0 0 600 450"'), `Step ${step.id}: viewport`);
  assert.equal((html.match(/data-array-bar="\d+"/g) ?? []).length, 5, `Step ${step.id}: bar count`);
  assert.equal((html.match(/data-array-comparing="true"/g) ?? []).length,
    step.canvas.state.comparing === null ? 0 : 2, `Step ${step.id}: comparing pair`);
  assert.equal((html.match(/data-array-highlight="\d+"/g) ?? []).length,
    step.canvas.highlights.length, `Step ${step.id}: swapped highlight`);
  assert.equal((html.match(/data-array-fixed="true"/g) ?? []).length,
    step.canvas.state.values.length - step.canvas.state.fixedFrom, `Step ${step.id}: fixed cells`);
}
const previewHtml = renderToStaticMarkup(createElement(BubbleSortExecutionPreview));
assert(previewHtml.includes('aria-label="動きの説明"') && previewHtml.includes(steps[0].caption));
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "bubble-sort-execution"'));

// フェーズ2の検証は、比べたペアと一致しない highlight と、比較外の highlight を弾く。
const settled = plain(get("pass-end-1").canvas);
assert.throws(() => validate({ ...settled, highlights: [{ kind: "cell", id: 4 }] }), /require a comparing pair/);
const compared = plain(get("compare-1-0").canvas);
assert.throws(() => validate({ ...compared, highlights: [{ kind: "cell", id: 0 }] }), /exactly the compared pair/);
assert.throws(() => validate({ ...compared, highlights: [{ kind: "cell", id: 1 }, { kind: "cell", id: 0 }] }), /exactly the compared pair/);
assert.throws(() => validate({ ...compared, highlights: [{ kind: "cell", id: 0 }, { kind: "cell", id: 2 }] }), /exactly the compared pair/);
console.log("Bubble-sort execution: 16 steps, verified trace of [4,2,5,1,3] (10 comparisons, 6 swaps, 4 pass-ends), comparing/swapped/fixed rendering and standalone preview passed.");
