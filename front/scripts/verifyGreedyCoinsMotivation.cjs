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
const unit = `${root}/units/greedy-coins`;
const feature = `${unit}/motivation`;
const plain = value => JSON.parse(JSON.stringify(value));
const { greedyCoinsMotivationContent: content } = load(`${feature}/motivation.content.ts`);
const { validateGreedyCoinsMotivationCanvas: validate } = load(`${feature}/motivation.types.ts`);
const { validateGreedyCoinsCanvas: validateBoard } = load(`${unit}/figure/greedyCoins.types.ts`);
const coinsModule = load(`${unit}/greedyCoins.ts`);
const { GreedyCoinsMotivationCanvas } = load(`${feature}/GreedyCoinsMotivationCanvas.tsx`);
const { GreedyCoinsMotivationPreview } = load(`${feature}/GreedyCoinsMotivationPreview.tsx`);
const { GreedyCoinsDrawing } = load(`${unit}/figure/GreedyCoinsDrawing.tsx`);
const { steps } = content;
const get = id => { const step = steps.find(step => step.id === id); assert(step, `Missing scene: ${id}`); return step.canvas; };

// 契約 greedy-coins-v1 を独立に再実装し、教材モジュールの実行記録と突き合わせる（基準データ §1・§2）。
function referenceGreedy(amount, coins) {
  const result = [];
  let remaining = amount;
  for (const coin of coins) {
    while (remaining >= coin) { result.push(coin); remaining -= coin; }
  }
  return result;
}
const denominations = [500, 100, 50, 10, 5, 1];
assert.deepEqual(referenceGreedy(786, denominations), [500, 100, 100, 50, 10, 10, 10, 5, 1], "Main example: 786 in 9 coins");
assert.deepEqual(referenceGreedy(342, denominations), [100, 100, 100, 10, 10, 10, 10, 1, 1], "Transfer: 342 in 9 coins");
assert.deepEqual(referenceGreedy(6, [4, 3, 1]), [4, 1, 1], "Counterexample: greedy pays 6 with [4,1,1]");
assert.deepEqual(plain(coinsModule.runGreedyCoins(786, denominations)), referenceGreedy(786, denominations));
assert.deepEqual(plain(coinsModule.runGreedyCoins(342, denominations)), referenceGreedy(342, denominations));
assert.deepEqual(plain(coinsModule.runGreedyCoins(6, [4, 3, 1])), [4, 1, 1]);
// 残額推移は基準データ §1 の表どおり（786→286→186→86→36→26→16→6→1→0）。
assert.deepEqual(plain(coinsModule.greedyCoinsSelections(786, denominations).map(s => s.remainingAfter)),
  [286, 186, 86, 36, 26, 16, 6, 1, 0], "Remaining sequence of the main example");
assert.deepEqual(plain(coinsModule.greedyCoinsSelections(786, denominations).map(s => s.coin)),
  [500, 100, 100, 50, 10, 10, 10, 5, 1], "Selection sequence of the main example");
const untouched = [...denominations];
coinsModule.runGreedyCoins(786, untouched);
assert.deepEqual(untouched, denominations, "Paying must not mutate the coins input");
assert.throws(() => coinsModule.runGreedyCoins(786, [100, 500, 50, 10, 5, 1]), /descending/);

assert.equal(content.id, "greedy-coins-motivation"); assert.equal(content.phase, 1); assert.equal(content.stageName, "導入");
assert(content.intervalMs >= 2500);
assert.deepEqual(plain(steps.map(step => step.id)), [
  "small-coins-burden", "six-coins", "large-coin-first", "large-to-small-demo",
  "next-largest", "unit-overview", "main-example-preview",
]);
assert.deepEqual(plain(steps.map(step => step.caption)), [
  "786円の買い物を小さい硬貨だけで払おうとすると、硬貨が何百枚も必要になってしまいます。",
  "日本の硬貨は、500円、100円、50円、10円、5円、1円の6種類あります。",
  "500円のところは500円硬貨1枚で済みますが、1円硬貨では500枚も必要です。",
  "大きい硬貨から順に使うと、786円を9枚の硬貨で払えます。",
  "残りが86円になったら、次に使える一番大きい硬貨は50円です。",
  "この単元では、この払い方を、動きの確認からコード、そして自分で実装するところまで順に学びます。",
  "次からは、786円を9枚で払う過程を、硬貨1枚ずつ見ていきます。",
]);
assert(steps.every(step => (step.caption.match(/。/gu) ?? []).length === 1), "One sentence per scene");
assert(!steps.some(step => /貪欲法|フェーズ/u.test(step.caption)), "No algorithm name or developer terms in phase 1");
assert(steps.slice(0, -1).every(step => step.canvas.state.exit === null), "Exit only on the last scene");
assert.deepEqual(plain(steps.at(-1).canvas.state.exit), { label: "動きの説明へ進む", nextPhase: 2 });
assert.equal(content.vocabulary.length, new Set(content.vocabulary.map(entry => entry.concept)).size);
assert(content.vocabulary.every(entry => steps.some(step => step.id === entry.firstStepId)));
for (const step of steps) validate(step.canvas);

// 場面の盤面は基準データ §3 フェーズ1の場面案と一致する（額面列は全場面で主教材の6種）。
for (const step of steps) {
  assert.deepEqual(plain(step.canvas.state.coins), denominations, `Scene ${step.id}: denominations`);
  assert.equal(step.canvas.state.amount, 786, `Scene ${step.id}: amount`);
}
const boardOf = id => { const { coins, coinStatuses, amount, remaining, tray } = get(id).state; return plain({ coins, coinStatuses, amount, remaining, tray }); };
assert.deepEqual(boardOf("small-coins-burden"), { coins: denominations, coinStatuses: ["upcoming", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"], amount: 786, remaining: 786, tray: [] });
assert.deepEqual(plain(get("small-coins-burden").highlights), [{ kind: "coin", id: 5 }], "Scene 1 points at the 1-yen chip");
assert.deepEqual(boardOf("six-coins"), { coins: denominations, coinStatuses: ["upcoming", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"], amount: 786, remaining: 786, tray: [] });
assert.deepEqual(boardOf("large-coin-first"), { coins: denominations, coinStatuses: ["current", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"], amount: 786, remaining: 286, tray: [500] });
assert.deepEqual(boardOf("large-to-small-demo"), { coins: denominations, coinStatuses: ["passed", "passed", "passed", "passed", "passed", "passed"], amount: 786, remaining: 0, tray: [500, 100, 100, 50, 10, 10, 10, 5, 1] });
assert.deepEqual(boardOf("next-largest"), { coins: denominations, coinStatuses: ["passed", "passed", "current", "upcoming", "upcoming", "upcoming"], amount: 786, remaining: 86, tray: [500, 100, 100] });
assert.deepEqual(boardOf("main-example-preview"), { coins: denominations, coinStatuses: ["upcoming", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"], amount: 786, remaining: 786, tray: [] });
assert.deepEqual(plain(get("main-example-preview").highlights), [{ kind: "coin", id: 0 }]);

// 実描画: 額面チップ6個・残額・トレイ（枚数と中身）・強調リング・出口ボタンが SVG に現れる。
for (const step of steps) {
  const html = renderToStaticMarkup(createElement(GreedyCoinsMotivationCanvas, { canvas: step.canvas }));
  assert(html.includes('viewBox="0 0 600 450"') && html.includes('preserveAspectRatio="xMidYMid meet"'), `Scene ${step.id}: viewport`);
  assert.equal((html.match(/data-coin-chip=/g) ?? []).length, 6, `Scene ${step.id}: coin chips`);
  assert(html.includes(`data-remaining="${step.canvas.state.remaining}"`), `Scene ${step.id}: remaining`);
  assert(html.includes(`data-tray-count="${step.canvas.state.tray.length}"`), `Scene ${step.id}: tray count`);
  assert.equal((html.match(/data-tray-coin=/g) ?? []).length, step.canvas.state.tray.length, `Scene ${step.id}: tray coins`);
  assert(!html.includes("フェーズ"));
  if (step.canvas.state.exit) assert.match(html, /<button[^>]+disabled=""[^>]*>動きの説明へ進む<\/button>/);
}
// 図基盤を直接描いても同じ盤面になる（フェーズ2以降の再利用形）。
const directHtml = renderToStaticMarkup(createElement(GreedyCoinsDrawing, {
  canvas: { data: { kind: "greedy-coins" }, state: { coins: denominations, coinStatuses: ["current", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"], amount: 786, remaining: 286, tray: [500] }, highlights: [] },
  label: "硬貨の図",
}));
assert.equal((directHtml.match(/data-coin-chip=/g) ?? []).length, 6);
assert(directHtml.includes('data-coin-status="current"'));
const previewHtml = renderToStaticMarkup(createElement(GreedyCoinsMotivationPreview));
assert(previewHtml.includes('aria-label="導入"') && previewHtml.includes(steps[0].caption));

// 描画は playerTokens に寄せ、HEX を直書きしない（色の正本はプレイヤートークン）。
for (const file of [`${unit}/figure/GreedyCoinsDrawing.tsx`, `${feature}/GreedyCoinsMotivationCanvas.tsx`]) {
  assert(!/#[0-9a-fA-F]{6}/.test(fs.readFileSync(file, "utf8")), `No raw HEX colors in ${file}`);
}
const drawingSource = fs.readFileSync(`${unit}/figure/GreedyCoinsDrawing.tsx`, "utf8");
assert(drawingSource.includes("GraphViewport") && drawingSource.includes("playerTokens"));
const previewSource = fs.readFileSync(`${feature}/GreedyCoinsMotivationPreview.tsx`, "utf8");
assert.match(previewSource, /width: "84vw", height: "84dvh"/);
assert.match(previewSource, /onComplete\?: \(\) => void/);
assert.doesNotMatch(previewSource, /fetch\(|localStorage/);
const pageSource = fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8");
assert(pageSource.includes("GreedyCoinsMotivationPreview"));
assert(pageSource.includes('contentId === "greedy-coins-motivation"'));

// 盤面の検証は、意味と矛盾する状態を弾く。
const boardWith = state => ({ data: { kind: "greedy-coins" }, state: { coins: denominations, coinStatuses: ["upcoming", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"], amount: 786, remaining: 786, tray: [], ...state }, highlights: [] });
assert.throws(() => validateBoard(boardWith({ coins: [100, 500, 50, 10, 5, 1] })), /descending/);
assert.throws(() => validateBoard(boardWith({ coinStatuses: ["current", "current", "upcoming", "upcoming", "upcoming", "upcoming"], remaining: 286, tray: [500] })), /At most one current/);
assert.throws(() => validateBoard(boardWith({ coinStatuses: ["upcoming", "passed", "upcoming", "upcoming", "upcoming", "upcoming"] })), /progress/);
assert.throws(() => validateBoard(boardWith({ remaining: 100, tray: [500] })), /add up to the amount/);
assert.throws(() => validateBoard(boardWith({ remaining: 176, tray: [10, 500, 100] })), /selection order/);
assert.throws(() => validateBoard(boardWith({ remaining: 779, tray: [7] })), /not a denomination/);
assert.throws(() => validateBoard({ ...boardWith({}), highlights: [{ kind: "coin", id: 6 }] }), /Unknown coin highlight/);
assert.throws(() => validate({ ...get("main-example-preview"), state: { ...get("main-example-preview").state, exit: { label: "x", nextPhase: 3 } } }), /phase 2/);
console.log("Greedy-coins motivation: 7 scenes, verified trace of 786 paid with [500,100,100,50,10,10,10,5,1] (remaining 786→286→186→86→36→26→16→6→1→0), transfer 342 and counterexample [4,3,1]/6, coin board validation, rendering and standalone preview passed.");
