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
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const feature = `${root}/bubble-sort/motivation`;
const plain = value => JSON.parse(JSON.stringify(value));
const { bubbleSortMotivationContent: content } = load(`${feature}/motivation.content.ts`);
const { validateBubbleSortMotivationCanvas: validate } = load(`${feature}/motivation.types.ts`);
const { validateArrayBarsCanvas } = load(`${root}/player/arrayBars.types.ts`);
const sortModule = load(`${root}/bubble-sort/bubbleSort.ts`);
const { BubbleSortMotivationCanvas } = load(`${feature}/BubbleSortMotivationCanvas.tsx`);
const { BubbleSortMotivationPreview } = load(`${feature}/BubbleSortMotivationPreview.tsx`);
const { steps } = content;
const get = id => { const step = steps.find(step => step.id === id); assert(step, `Missing scene: ${id}`); return step.canvas; };

// 契約 bubble-sort-v1 を独立に再実装し、教材の場面と突き合わせる（基準データ §1・§2）。
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
assert.deepEqual(reference.at(-1).after, [1, 2, 3, 4, 5]);

// モジュール側の組み立ても独立実装と一致し、入力を変更しない。
assert.deepEqual(plain(sortModule.bubbleSortComparisons(main)), reference);
const untouched = [4, 2, 5, 1, 3];
assert.deepEqual(plain(sortModule.runBubbleSort(untouched)), [1, 2, 3, 4, 5]);
assert.deepEqual(untouched, [4, 2, 5, 1, 3], "Sorting must not mutate the input");

assert.equal(content.id, "bubble-sort-motivation"); assert.equal(content.phase, 1); assert.equal(content.stageName, "導入");
assert(content.intervalMs >= 2500);
assert.deepEqual(plain(steps.map(step => step.id)), [
  "scrambled-start", "sorted-goal", "compare-first", "first-swap", "five-moves-right", "first-pass-end", "complete-and-exit",
]);
assert(steps.every(step => (step.caption.match(/[。？]/gu) ?? []).length === 1), "One sentence per scene");
assert(!steps.some(step => /バブルソート|フェーズ/u.test(step.caption)), "No algorithm name or developer terms in phase 1");
assert(steps.slice(0, -1).every(step => step.canvas.state.exit === null), "Exit only on the last scene");
assert.deepEqual(plain(steps.at(-1).canvas.state.exit), { label: "動きの説明へ進む", nextPhase: 2 });
assert.equal(content.vocabulary.length, new Set(content.vocabulary.map(entry => entry.concept)).size);
assert(content.vocabulary.every(entry => steps.some(step => step.id === entry.firstStepId)));
for (const step of steps) validate(step.canvas);

// 場面の値の遷移は検証済みトレースと一致する（手書きの遷移ではない）。
assert.deepEqual(plain(get("scrambled-start").state.values), main);
assert.equal(get("scrambled-start").state.comparing, null);
assert.equal(get("scrambled-start").state.fixedFrom, 5);
assert.deepEqual(plain(get("sorted-goal").state.values), [1, 2, 3, 4, 5]);
assert.deepEqual(plain(get("compare-first").state.values), main);
assert.deepEqual(plain(get("compare-first").state.comparing), [0, 1]);
assert.deepEqual(plain(get("first-swap").state.values), reference[0].after);
assert.deepEqual(plain(get("first-swap").highlights.map(highlight => highlight.id)), [0, 1]);
assert.deepEqual(plain(get("five-moves-right").state.values), reference[2].after);
assert.deepEqual(plain(get("five-moves-right").highlights.map(highlight => highlight.id)), [2, 3]);
assert.deepEqual(plain(get("first-pass-end").state.values), reference[3].after);
assert.equal(get("first-pass-end").state.fixedFrom, 4);
assert.deepEqual(plain(get("complete-and-exit").state.values), [1, 2, 3, 4, 5]);
assert.equal(get("complete-and-exit").state.fixedFrom, 0);

// 実描画: 棒の本数・比べているペア・確定マス・値ラベル・出口ボタンが SVG に現れる。
for (const step of steps) {
  const html = renderToStaticMarkup(createElement(BubbleSortMotivationCanvas, { canvas: step.canvas }));
  assert(html.includes('viewBox="0 0 600 450"') && html.includes('preserveAspectRatio="xMidYMid meet"'));
  assert.equal((html.match(/data-array-bar="\d+"/g) ?? []).length, step.canvas.state.values.length);
  assert(!html.includes("フェーズ"));
  if (step.canvas.state.exit) assert.match(html, /<button[^>]+disabled=""[^>]*>動きの説明へ進む<\/button>/);
}
const compareHtml = renderToStaticMarkup(createElement(BubbleSortMotivationCanvas, { canvas: get("compare-first") }));
assert.equal((compareHtml.match(/data-array-comparing="true"/g) ?? []).length, 2);
const swapHtml = renderToStaticMarkup(createElement(BubbleSortMotivationCanvas, { canvas: get("first-swap") }));
assert.equal((swapHtml.match(/data-array-highlight="\d+"/g) ?? []).length, 2);
const passEndHtml = renderToStaticMarkup(createElement(BubbleSortMotivationCanvas, { canvas: get("first-pass-end") }));
assert.equal((passEndHtml.match(/data-array-fixed="true"/g) ?? []).length, 1);
const previewHtml = renderToStaticMarkup(createElement(BubbleSortMotivationPreview));
assert(previewHtml.includes('aria-label="導入"') && previewHtml.includes(steps[0].caption));

// 描画基盤は playerTokens のみで色を決め、HEX を直書きしない。
const drawingSource = fs.readFileSync(`${root}/player/ArrayDrawing.tsx`, "utf8");
assert(drawingSource.includes("playerTokens") && !/#[0-9a-fA-F]{6}/.test(drawingSource));
const canvasSource = fs.readFileSync(`${feature}/BubbleSortMotivationCanvas.tsx`, "utf8");
assert(canvasSource.includes("ArrayDrawing") && canvasSource.includes("PhaseNextButton"));
const previewSource = fs.readFileSync(`${feature}/BubbleSortMotivationPreview.tsx`, "utf8");
assert.match(previewSource, /width: "84vw", height: "84dvh"/);
assert.doesNotMatch(previewSource, /onLearningEvent|onComplete|fetch\(|localStorage/);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8").includes('contentId === "bubble-sort-motivation"'));

// 基盤の検証は不正な配列を弾く。
const broken = { data: { kind: "array-bars" }, state: { values: [4, 2, 5, 1, 3], comparing: null, fixedFrom: 5 }, highlights: [] };
assert.throws(() => validateArrayBarsCanvas({ ...broken, data: { kind: "graph" } }), /Unknown array bars canvas kind/);
assert.throws(() => validateArrayBarsCanvas({ ...broken, state: { ...broken.state, values: [] } }), /at least one/);
assert.throws(() => validateArrayBarsCanvas({ ...broken, state: { ...broken.state, values: [1, -2] } }), /finite, non-negative/);
assert.throws(() => validateArrayBarsCanvas({ ...broken, state: { ...broken.state, fixedFrom: 6 } }), /fixedFrom out of range/);
assert.throws(() => validateArrayBarsCanvas({ ...broken, state: { ...broken.state, fixedFrom: -1 } }), /fixedFrom out of range/);
assert.throws(() => validateArrayBarsCanvas({ ...broken, state: { ...broken.state, comparing: [0, 2] } }), /adjacent/);
assert.throws(() => validateArrayBarsCanvas({ ...broken, state: { ...broken.state, comparing: [4, 5] } }), /Comparing out of range/);
assert.throws(() => validateArrayBarsCanvas({ ...broken, state: { ...broken.state, fixedFrom: 4, comparing: [3, 4] } }), /unfixed range/);
assert.throws(() => validateArrayBarsCanvas({ ...broken, highlights: [{ kind: "cell", id: 5 }] }), /Unknown array highlight/);
assert.throws(() => validateArrayBarsCanvas({ ...broken, highlights: [{ kind: "cell", id: 1 }, { kind: "cell", id: 1 }] }), /Duplicate highlight/);
assert.throws(() => validate({ ...get("complete-and-exit"), state: { ...get("complete-and-exit").state, exit: { label: "x", nextPhase: 3 } } }), /phase 2/);
assert.throws(() => validate({ ...get("compare-first"), state: { ...get("compare-first").state, exit: { label: "x", nextPhase: 2 } } }), /settled/);
console.log("Bubble-sort motivation: 7 scenes, verified trace of [4,2,5,1,3] (10 comparisons, 6 swaps), array foundation validation, rendering and standalone exit passed.");
