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
const unit = `${root}/greedy-coins`;
const feature = `${unit}/execution`;
const plain = value => JSON.parse(JSON.stringify(value));
const { greedyCoinsExecutionContent: content } = load(`${feature}/execution.content.ts`);
const { validateGreedyCoinsExecutionCanvas: validate } = load(`${feature}/execution.types.ts`);
const coinsModule = load(`${unit}/greedyCoins.ts`);
const { GreedyCoinsExecutionCanvas } = load(`${feature}/GreedyCoinsExecutionCanvas.tsx`);
const { GreedyCoinsExecutionPreview } = load(`${feature}/GreedyCoinsExecutionPreview.tsx`);
const { steps } = content;
const get = id => { const step = steps.find(step => step.id === id); assert(step, `Missing step: ${id}`); return step; };

// 契約 greedy-coins-v1 を独立に再実装し、教材の全ステップと突き合わせる（基準データ §1・§2）。
function referenceSelections(amount, coins) {
  const selections = [];
  let remaining = amount;
  for (const coin of coins) {
    while (remaining >= coin) {
      const before = remaining;
      remaining -= coin;
      selections.push({ coin, remainingBefore: before, remainingAfter: remaining });
    }
  }
  return selections;
}
const denominations = [500, 100, 50, 10, 5, 1];
const reference = referenceSelections(786, denominations);
assert.deepEqual(plain(reference.map(s => s.coin)), [500, 100, 100, 50, 10, 10, 10, 5, 1], "Main selections");
assert.deepEqual(plain(reference.map(s => s.remainingAfter)), [286, 186, 86, 36, 26, 16, 6, 1, 0], "Main remaining sequence");
assert.deepEqual(plain(coinsModule.greedyCoinsSelections(786, denominations)), reference, "Module builder reproduces the verified trace");
assert.deepEqual(plain(coinsModule.runGreedyCoins(786, denominations)), [500, 100, 100, 50, 10, 10, 10, 5, 1]);

assert.equal(content.id, "greedy-coins-execution"); assert.equal(content.phase, 2); assert.equal(content.stageName, "動きの説明");
assert(content.intervalMs >= 2500);
assert.equal(steps.length, 11, "Phase 2 keeps all 11 steps");
assert.deepEqual(plain(steps.map(step => step.id)), [
  "introduce", "select-1", "select-2", "select-3", "select-4", "select-5",
  "select-6", "select-7", "select-8", "select-9", "summary",
]);
// キャプションは基準データの表の文言を1文へ圧縮した形（表の2文表記と「全て1文」の矛盾は PR で明示）。
assert.deepEqual(plain(steps.map(step => step.caption)), [
  "786円を、硬貨の枚数が少なくなるように、そのつど使える一番大きい硬貨を選んで払います。",
  "500円を選んで、残りは286円です。",
  "100円を選んで、残りは186円です。",
  "100円を選んで、残りは86円です。",
  "50円を選んで、残りは36円です。",
  "10円を選んで、残りは26円です。",
  "10円を選んで、残りは16円です。",
  "10円を選んで、残りは6円です。",
  "5円を選んで、残りは1円です。",
  "1円を選んで、残りは0円です。",
  "そのつど一番大きい硬貨を選ぶこの方法は貪欲法と呼ばれ、9枚で払えました。",
]);
assert(steps.every(step => (step.caption.match(/。/gu) ?? []).length === 1), "One sentence per step");
assert(!steps.slice(0, -1).some(step => /貪欲法/u.test(step.caption)), "The name appears only in the last step");
for (const step of steps) validate(step.canvas);

// 全ステップで盤面は主教材のまま（金額・額面列は変わらない）。
for (const step of steps) {
  assert.deepEqual(plain(step.canvas.state.coins), denominations, `Step ${step.id}: denominations`);
  assert.equal(step.canvas.state.amount, 786, `Step ${step.id}: amount`);
  assert.equal(step.canvas.data.kind, "greedy-coins-execution");
}

// 選択ステップは参照コードの実行記録と完全一致する（1ステップ＝硬貨1枚、図と完全同期）。
reference.forEach((selection, index) => {
  const step = get(`select-${index + 1}`);
  const state = step.canvas.state;
  assert.equal(state.selectedCoin, selection.coin, `Step ${step.id}: selected coin`);
  assert.equal(state.remaining, selection.remainingAfter, `Step ${step.id}: remaining`);
  assert.deepEqual(plain(state.tray), plain(reference.slice(0, index + 1).map(s => s.coin)), `Step ${step.id}: tray`);
  const selectedIndex = denominations.indexOf(selection.coin);
  assert.deepEqual(plain(state.coinStatuses), plain(denominations.map((_, i) =>
    i < selectedIndex ? "passed" : i === selectedIndex ? "current" : "upcoming")), `Step ${step.id}: coin statuses`);
  // 前ステップから変わるのは選んだ硬貨1枚分だけ（残額の差＝選んだ硬貨、トレイは1枚増える）。
  const before = steps[index].canvas.state; // steps[0] は introduce、選択ステップは steps[1] から
  assert.equal(before.remaining - state.remaining, selection.coin, `Step ${step.id}: remaining drops by the selected coin`);
  assert.equal(state.tray.length, before.tray.length + 1, `Step ${step.id}: tray grows by one coin`);
});
// 導入とまとめ。
assert.deepEqual(plain(get("introduce").canvas.state), {
  coins: denominations, coinStatuses: ["upcoming", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"],
  amount: 786, remaining: 786, tray: [], selectedCoin: null,
});
assert.deepEqual(plain(get("summary").canvas.state), {
  coins: denominations, coinStatuses: ["passed", "passed", "passed", "passed", "passed", "passed"],
  amount: 786, remaining: 0, tray: [500, 100, 100, 50, 10, 10, 10, 5, 1], selectedCoin: null,
});
// フェーズ3の場面（500・100・100を使い終わり残額86）は select-3 がそのまま担う。
assert.equal(get("select-3").canvas.state.remaining, 86);
assert.deepEqual(plain(get("select-3").canvas.state.tray), [500, 100, 100]);

// 実描画: 額面チップ6個・残額・トレイがステップと同期し、状態の写像が data 属性に現れる。
for (const step of steps) {
  const html = renderToStaticMarkup(createElement(GreedyCoinsExecutionCanvas, { canvas: step.canvas }));
  assert(html.includes('viewBox="0 0 600 450"'), `Step ${step.id}: viewport`);
  assert.equal((html.match(/data-coin-chip=/g) ?? []).length, 6, `Step ${step.id}: coin chips`);
  assert(html.includes(`data-remaining="${step.canvas.state.remaining}"`), `Step ${step.id}: remaining`);
  assert.equal((html.match(/data-tray-coin=/g) ?? []).length, step.canvas.state.tray.length, `Step ${step.id}: tray coins`);
  const rendered = [...html.matchAll(/data-coin-status="(\w+)"/g)].map(match => match[1]);
  assert.deepEqual(plain(rendered), plain(step.canvas.state.coinStatuses), `Step ${step.id}: rendered coin statuses`);
}
const previewHtml = renderToStaticMarkup(createElement(GreedyCoinsExecutionPreview));
assert(previewHtml.includes('aria-label="動きの説明"') && previewHtml.includes(steps[0].caption));
const canvasSource = fs.readFileSync(`${feature}/GreedyCoinsExecutionCanvas.tsx`, "utf8");
assert(canvasSource.includes("GreedyCoinsDrawing"), "Execution canvas delegates to the unit coin drawing");
assert(!/#[0-9a-fA-F]{6}/.test(canvasSource), "No raw HEX colors in the execution canvas");
const pageSource = fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8");
assert(pageSource.includes("GreedyCoinsExecutionPreview"));
assert(pageSource.includes('contentId === "greedy-coins-execution"'));

// 単元側の検証は、盤面の意味と矛盾する状態を弾く。
const step3 = plain(get("select-3").canvas);
assert.throws(() => validate({ ...step3, state: { ...step3.state, selectedCoin: 50 } }), /last coin on the tray/);
const wrongCurrent = plain(get("select-3").canvas);
wrongCurrent.state.coinStatuses = ["passed", "passed", "current", "upcoming", "upcoming", "upcoming"];
assert.throws(() => validate(wrongCurrent), /Current denomination must be the selected coin/);
const introWithCurrent = plain(get("introduce").canvas);
introWithCurrent.state.coinStatuses = ["current", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"];
assert.throws(() => validate(introWithCurrent), /no current denomination/);
const badRemaining = plain(get("select-3").canvas);
badRemaining.state.remaining = 85;
assert.throws(() => validate(badRemaining), /add up to the amount/);
console.log("Greedy-coins execution: 11 steps, verified trace of 786 paid with [500,100,100,50,10,10,10,5,1] (remaining 786→286→186→86→36→26→16→6→1→0), one coin per step, board states, rendering and standalone preview passed.");
