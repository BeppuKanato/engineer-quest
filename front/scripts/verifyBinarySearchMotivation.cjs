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
const feature = `${root}/binary-search/motivation`;
const plain = value => JSON.parse(JSON.stringify(value));
const { binarySearchMotivationContent: content } = load(`${feature}/motivation.content.ts`);
const { validateBinarySearchMotivationCanvas: validate } = load(`${feature}/motivation.types.ts`);
const searchModule = load(`${root}/binary-search/binarySearch.ts`);
const { BinarySearchMotivationCanvas } = load(`${feature}/BinarySearchMotivationCanvas.tsx`);
const { BinarySearchMotivationPreview } = load(`${feature}/BinarySearchMotivationPreview.tsx`);
const { steps } = content;
const get = id => { const step = steps.find(step => step.id === id); assert(step, `Missing scene: ${id}`); return step.canvas; };

// 契約 binary-search-v1 を独立に再実装し、教材モジュールの実行記録と突き合わせる（基準データ §1・§2）。
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
const transfer = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
// 主教材は「左を捨てる→右を捨てる→一致」の3回（基準データ §1 の検証済みトレース）。
assert.deepEqual(referenceProbes(main, 25), [
  { lo: 0, hi: 6, mid: 3, value: 19, outcome: "drop-left" },
  { lo: 4, hi: 6, mid: 5, value: 31, outcome: "drop-right" },
  { lo: 4, hi: 4, mid: 4, value: 25, outcome: "hit" },
]);
assert.deepEqual(referenceProbes(transfer, 23).map(probe => probe.mid), [4, 7, 5]);
assert.deepEqual(referenceProbes(main, 20).map(probe => probe.value), [19, 31, 25], "Absent case follows the same path");

// モジュール側の組み立ても独立実装と一致し、入力を変更しない。
assert.deepEqual(plain(searchModule.binarySearchProbes(main, 25)), referenceProbes(main, 25));
assert.deepEqual(plain(searchModule.binarySearchProbes(transfer, 23)), referenceProbes(transfer, 23));
assert.equal(searchModule.runBinarySearch(main, 25), 4);
assert.equal(searchModule.runBinarySearch(transfer, 23), 5);
assert.equal(searchModule.runBinarySearch(main, 20), -1);
const untouched = [...main];
searchModule.binarySearchProbes(untouched, 25);
assert.deepEqual(untouched, main, "Searching must not mutate the input");

// 数当ての件数列: 100→50→25→13→7→4→2→1 で、7 回で 1 個まで絞れる（基準データ §1）。
const expectedCounts = [100];
while (expectedCounts.at(-1) > 1) expectedCounts.push(Math.ceil(expectedCounts.at(-1) / 2));
assert.deepEqual(expectedCounts, [100, 50, 25, 13, 7, 4, 2, 1]);
assert.equal(expectedCounts.length - 1, 7);
assert.deepEqual(plain(searchModule.binarySearchHalvingCounts(100)), expectedCounts);

assert.equal(content.id, "binary-search-motivation"); assert.equal(content.phase, 1); assert.equal(content.stageName, "導入");
assert(content.intervalMs >= 2500);
assert.deepEqual(plain(steps.map(step => step.id)), [
  "find-twenty-five", "guessing-game", "ask-middle", "ask-middle-result", "seven-guesses", "unit-overview", "main-example-preview",
]);
assert(steps.every(step => (step.caption.match(/[。？]/gu) ?? []).length === 1), "One sentence per scene");
assert(!steps.some(step => /二分探索|インデックス|フェーズ|対数|バイナリサーチ/u.test(step.caption)), "No algorithm name, index term or developer terms in phase 1");
assert(steps.slice(0, -1).every(step => step.canvas.state.exit === null), "Exit only on the last scene");
assert.deepEqual(plain(steps.at(-1).canvas.state.exit), { label: "動きの説明へ進む", nextPhase: 2 });
assert.equal(content.vocabulary.length, new Set(content.vocabulary.map(entry => entry.concept)).size);
assert(content.vocabulary.every(entry => steps.some(step => step.id === entry.firstStepId)));
for (const step of steps) validate(step.canvas);

// 場面の状態は基準データ §3 フェーズ1の場面案と一致する。
// 場面1だけは Issue #329 の決定で、主教材と同じ7つの数字を並び替えて示す。
// 25 は最後尾にあり、端から順に見ると7つ全部を見る（最悪のケースが場面の中で実際に起きる）。
const shuffled = [19, 3, 31, 7, 42, 12, 25];
assert.deepEqual([...shuffled].sort((a, b) => a - b), main, "Scene 1 values are a permutation of the main values");
assert.equal(shuffled.at(-1), 25, "Scene 1 puts the target last");
assert.equal(shuffled.indexOf(25) + 1, 7, "Sequential search in scene 1 views all 7 values");
assert(shuffled.some((value, index) => index > 0 && value < shuffled[index - 1]), "Scene 1 bars are not monotonic");
assert.deepEqual(plain(get("find-twenty-five").state.visual), { kind: "array", values: shuffled, target: 25, order: "unsorted" });
assert.deepEqual(plain(get("find-twenty-five").highlights.map(highlight => highlight.id)), [6]);
assert.deepEqual(plain(get("guessing-game").state.visual), { kind: "guess", low: 1, high: 100, asked: null, remaining: null });
assert.deepEqual(plain(get("ask-middle").state.visual), { kind: "guess", low: 1, high: 100, asked: 50, remaining: null });
assert.deepEqual(plain(get("ask-middle-result").state.visual), { kind: "guess", low: 1, high: 100, asked: 50, remaining: [51, 100] });
assert.deepEqual(plain(get("seven-guesses").state.visual), { kind: "halving", counts: expectedCounts });
assert.deepEqual(plain(get("unit-overview").state.visual), { kind: "array", values: main, target: null, order: "sorted" });
assert.deepEqual(plain(get("main-example-preview").state.visual), { kind: "array", values: main, target: 25, order: "sorted" });

// 実描画: 配列の棒・数当ての帯（セル100個、聞いた数、捨てた半分）・件数列・出口ボタンが SVG に現れる。
for (const step of steps) {
  const html = renderToStaticMarkup(createElement(BinarySearchMotivationCanvas, { canvas: step.canvas }));
  assert(html.includes('viewBox="0 0 600 450"') && html.includes('preserveAspectRatio="xMidYMid meet"'));
  assert(!html.includes("フェーズ"));
  if (step.canvas.state.exit) assert.match(html, /<button[^>]+disabled=""[^>]*>動きの説明へ進む<\/button>/);
}
const arrayHtml = renderToStaticMarkup(createElement(BinarySearchMotivationCanvas, { canvas: get("find-twenty-five") }));
assert.equal((arrayHtml.match(/data-array-bar="\d+"/g) ?? []).length, 7);
assert.equal((arrayHtml.match(/data-array-highlight="\d+"/g) ?? []).length, 1);
const overviewHtml = renderToStaticMarkup(createElement(BinarySearchMotivationCanvas, { canvas: get("unit-overview") }));
assert.equal((overviewHtml.match(/data-array-bar="\d+"/g) ?? []).length, 7);
assert(!(overviewHtml.match(/data-array-highlight="\d+"/g) ?? []).length);
const gameHtml = renderToStaticMarkup(createElement(BinarySearchMotivationCanvas, { canvas: get("guessing-game") }));
assert.equal((gameHtml.match(/data-guess-cell=/g) ?? []).length, 100);
assert(!(gameHtml.match(/data-guess-asked="true"/g) ?? []).length);
const middleHtml = renderToStaticMarkup(createElement(BinarySearchMotivationCanvas, { canvas: get("ask-middle") }));
assert.equal((middleHtml.match(/data-guess-cell=/g) ?? []).length, 100);
assert.equal((middleHtml.match(/data-guess-asked="true"/g) ?? []).length, 1);
assert.equal((middleHtml.match(/data-guess-dropped="true"/g) ?? []).length, 0);
assert(!middleHtml.includes("data-guess-reply"), "No reply before the answer comes back");
assert(middleHtml.includes("data-guess-asked-label"));
// 答えの場面: 捨てた半分（49個）と、答え「50より大きい」の吹き出しが現れる。帯の形状は聞く場面と同一。
const resultHtml = renderToStaticMarkup(createElement(BinarySearchMotivationCanvas, { canvas: get("ask-middle-result") }));
assert.equal((resultHtml.match(/data-guess-cell=/g) ?? []).length, 100);
assert.equal((resultHtml.match(/data-guess-asked="true"/g) ?? []).length, 1);
assert.equal((resultHtml.match(/data-guess-dropped="true"/g) ?? []).length, 49);
assert(resultHtml.includes('data-guess-reply="50より大きい"'));
assert(resultHtml.includes("data-guess-asked-label"));
const halvingHtml = renderToStaticMarkup(createElement(BinarySearchMotivationCanvas, { canvas: get("seven-guesses") }));
assert.equal((halvingHtml.match(/data-halving-bar=/g) ?? []).length, 8);
const previewHtml = renderToStaticMarkup(createElement(BinarySearchMotivationPreview));
assert(previewHtml.includes('aria-label="導入"') && previewHtml.includes(steps[0].caption));

// 描画は共有基盤と playerTokens に寄せ、HEX を直書きしない。
const canvasSource = fs.readFileSync(`${feature}/BinarySearchMotivationCanvas.tsx`, "utf8");
assert(canvasSource.includes("ArrayDrawing") && canvasSource.includes("GraphViewport") && canvasSource.includes("PhaseNextButton"));
assert(!/#[0-9a-fA-F]{6}/.test(canvasSource), "No raw HEX colors in the unit canvas");
const previewSource = fs.readFileSync(`${feature}/BinarySearchMotivationPreview.tsx`, "utf8");
assert.match(previewSource, /width: "84vw", height: "84dvh"/);
// 接続ポートは単元フロー（接続Issue）向けの任意 props。単品では未指定で従来どおり動き、外部通信や保存は持たない。
assert.match(previewSource, /onComplete\?: \(\) => void/);
assert.doesNotMatch(previewSource, /fetch\(|localStorage/);
// プレビュー登録は他単元と同じ [contentId] 方式に寄せる（単元接続 #294 でフェーズ1専用ページを廃止）。
const pageSource = fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8");
assert(pageSource.includes("BinarySearchMotivationPreview"));
assert(!fs.existsSync(path.resolve(__dirname, "../src/app/learning-preview/binary-search-unit/page.tsx")), "dedicated preview page was removed in #294");

// 単元側の検証は、不正な場面を弾く。
assert.throws(() => validate({ ...get("main-example-preview"), state: { ...get("main-example-preview").state, exit: { label: "x", nextPhase: 3 } } }), /phase 2/);
assert.throws(() => validate({ ...get("ask-middle"), state: { ...get("ask-middle").state, exit: { label: "x", nextPhase: 2 } } }), /settled/);
const arrayWith = visual => ({ data: { kind: "binary-search-motivation" }, state: { visual, exit: null }, highlights: [] });
assert.throws(() => validate(arrayWith({ kind: "array", values: [3, 7, 7, 19], target: 7, order: "sorted" })), /ascending/);
assert.throws(() => validate(arrayWith({ kind: "array", values: main, target: 20, order: "sorted" })), /one of the values/);
assert.throws(() => validate({ ...arrayWith({ kind: "array", values: main, target: 25, order: "sorted" }), highlights: [{ kind: "cell", id: 0 }] }), /target cell only/);
// 並んでいない場面は、小さい順のままでは成立せず、重複も許さない。
assert.throws(() => validate(arrayWith({ kind: "array", values: main, target: 25, order: "unsorted" })), /must not be in ascending/);
assert.throws(() => validate(arrayWith({ kind: "array", values: [19, 3, 3, 25], target: 25, order: "unsorted" })), /distinct/);
assert.throws(() => validate({ ...arrayWith({ kind: "guess", low: 1, high: 100, asked: 50, remaining: [51, 100] }), highlights: [{ kind: "cell", id: 0 }] }), /array scenes only/);
assert.throws(() => validate(arrayWith({ kind: "guess", low: 1, high: 100, asked: null, remaining: [51, 100] })), /asked number first/);
assert.throws(() => validate(arrayWith({ kind: "guess", low: 1, high: 100, asked: 50, remaining: [40, 60] })), /exclude the asked/);
assert.throws(() => validate(arrayWith({ kind: "guess", low: 1, high: 100, asked: 120, remaining: null })), /inside the guess range/);
assert.throws(() => validate(arrayWith({ kind: "halving", counts: [100, 49, 25, 13, 7, 4, 2, 1] })), /halve/);
assert.throws(() => validate(arrayWith({ kind: "halving", counts: [100, 50, 25, 13, 7, 4, 2] })), /end at 1/);
console.log("Binary-search motivation: 7 scenes, scene 1 presents the main values shuffled ([19,3,31,7,42,12,25], target last, sequential search views all 7), verified trace of [3,7,12,19,25,31,42] finding 25 in 3 probes, guessing-game halving 100→1 in 7, unit-side scene validation, rendering and standalone preview page passed.");
