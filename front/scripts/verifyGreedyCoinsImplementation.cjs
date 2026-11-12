const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { spawnSync } = require("node:child_process");
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
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
const file = relative => `${root}/${relative}`;
const { greedyCoinsImplementationContent: content } = load(file("units/greedy-coins/implementation/implementation.content.ts"));
const { greedyCoinsCode, greedyCoinsCodeSource } = load(file("units/greedy-coins/code-mapping/greedyCoinsCode.ts"));
const { greedyCoinsConsolidationContent } = load(file("units/greedy-coins/consolidation/consolidation.content.ts"));
const greedy = load(file("units/greedy-coins/greedyCoins.ts"));
const {
  recordHintUsage, resultKinds, classifyExecutionError, runningMessage, allTestsPassed, runImplementationTests,
  isCoinListValue, coinListDifferences, coinTrayCanvas,
} = load(file("units/greedy-coins/implementation/implementation.ts"));
const { validateGreedyCoinsBoard } = load(file("units/greedy-coins/figure/greedyCoins.types.ts"));
const { ImplementationResults } = load(file("units/greedy-coins/implementation/ImplementationResults.tsx"));
const { ImplementationHints } = load(file("units/greedy-coins/implementation/ImplementationHints.tsx"));
const { FreeExecutionConsole } = load(file("units/greedy-coins/implementation/FreeExecutionConsole.tsx"));
const { CoinListOutput } = load(file("units/greedy-coins/implementation/CoinListOutput.tsx"));
const { ParsonsBoard } = load(file("components/assessment/ParsonsBoard.tsx"));
const { freeDisplayCase, runGreedyCoinsFreeCode } = load(file("units/greedy-coins/implementation/freeExecution.ts"));
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const plain = value => JSON.parse(JSON.stringify(value));

// ---- コンテンツの基本契約 ----
assert.equal(content.id, "greedy-coins-implementation"); assert.equal(content.phase, 7); assert.equal(content.version, 1);
assert.equal(greedyCoinsCode.id, "greedy-coins-v1"); assert.equal(greedyCoinsCode.version, 1);
assert.deepEqual(plain(content.hints.skeletonLineIds), ["for-coin", "while-remaining"]);
content.hints.skeletonLines.forEach((line, index) => assert.equal(line, greedyCoinsCode.lines.find(line => line.id === content.hints.skeletonLineIds[index])));
assert.equal(content.hints.labels.length, 4);
assert.deepEqual(plain(content.hints.flow), [
  "結果のリストと残額を用意する",
  "額面を大きい順に1つずつ取り出す",
  "残額がその額面以上である間、その硬貨を記録して残額から引く",
  "最後に結果のリストを返す",
]);
assert.equal(new Set(content.hints.tokens).size, content.hints.tokens.length);
for (const f of fs.readdirSync(file("units/greedy-coins/implementation")).filter(name => /\.tsx?$/.test(name))) {
  assert(!/codeDiff|diffLines|from ["']diff["']|diffTitle|referenceCode/u.test(fs.readFileSync(file(`units/greedy-coins/implementation/${f}`), "utf8")), "No diff hint dependency remains in the feature");
}

// ---- テスト: D1表示用、J1〜J4判定用。期待値は実行記録と基準データの確定値 ----
assert.deepEqual(plain(content.tests.map(test => test.id)), ["D1", "J1", "J2", "J3", "J4"]);
assert.deepEqual(plain(content.tests.map(test => test.visibility)), ["display", "judgement", "judgement", "judgement", "judgement"]);
assert.deepEqual(plain(content.tests.map(test => plain(test.args))), [
  [786, [500, 100, 50, 10, 5, 1]],
  [786, [500, 100, 50, 10, 5, 1]],
  [342, [500, 100, 50, 10, 5, 1]],
  [41, [25, 10, 5, 1]],
  [6, [4, 3, 1]],
]);
assert.deepEqual(plain(content.tests.map(test => test.expected)), [
  [500, 100, 100, 50, 10, 10, 10, 5, 1],
  [500, 100, 100, 50, 10, 10, 10, 5, 1],
  [100, 100, 100, 10, 10, 10, 10, 1, 1],
  [25, 10, 5, 1],
  [4, 1, 1],
]);
for (const test of content.tests) {
  assert.equal(test.functionName, "greedy_coins");
  const [amount, coins] = plain(test.args);
  assert.deepEqual(plain(test.expected), plain(greedy.runGreedyCoins(amount, coins)), `${test.id} expected follows the verified execution record`);
}
// J4は反例: 期待値は貪欲の [4, 1, 1] で、最適の [3, 3] ではない（§6 決定3）。
const j4 = content.tests.find(test => test.id === "J4");
assert.deepEqual(plain(j4.expected), [4, 1, 1]);
assert.notDeepEqual(plain(j4.expected), [3, 3]);

// ---- テンプレート: 基準データ §3 フェーズ7のコードブロックどおり ----
const baselineSkeleton = [
  "def greedy_coins(amount, coins):",
  "    result = []",
  "    remaining = amount",
  "    raise NotImplementedError # ここを書く：額面を大きい順に1つずつ取り出す繰り返し",
  "    raise NotImplementedError # ここを書く：その硬貨を、残額がその額面以上である間くり返し使う繰り返し",
  "    raise NotImplementedError # ここを書く：選んだ硬貨を記録して、残額を減らす処理",
  "    return result",
].join("\n");
const baselineFillIn = [
  "def greedy_coins(amount, coins):",
  "    result = []",
  "    remaining = amount",
  "    for coin in coins:",
  "        while remaining >= coin:",
  "            raise NotImplementedError # ここを書く：選んだ硬貨を結果に入れる",
  "            raise NotImplementedError # ここを書く：残額を使った硬貨の分だけ減らす",
  "    return result",
].join("\n");
assert.equal(content.templates.skeleton, baselineSkeleton, "Skeleton template is byte-exact to the baseline code block");
assert.equal(content.templates["fill-in"], baselineFillIn, "Fill-in template is byte-exact to the baseline code block");
assert.match(content.template, /^def greedy_coins\(amount, coins\):\n/u);
assert.match(content.template, /"""[^"]+"""/u, "Full template carries a docstring");
assert.equal(content.template.split("\n").length, 2, "Full template is the definition plus docstring only");
const {
  implementationInputLevels, implementationInputLevelText, implementationDraftKey,
  countImplementationPlaceholders, isImplementationPlaceholderLine,
} = load(file("implementation/inputLevel.ts"));
const { ImplementationLevelSelector } = load(file("implementation/ImplementationLevelSelector.tsx"));
assert.deepEqual(plain(implementationInputLevels), ["full", "skeleton", "fill-in"]);
assert.deepEqual(Object.keys(content.templates).sort(), ["fill-in", "full", "skeleton"]);
assert.equal(content.template, content.templates.full, "the legacy template is the full level");
assert.equal(countImplementationPlaceholders(content.templates.full), 0, "full has no placeholders");
assert.equal(countImplementationPlaceholders(content.templates.skeleton), 3, "skeleton has three placeholders");
assert.equal(countImplementationPlaceholders(content.templates["fill-in"]), 2, "fill-in has two placeholders");
for (const level of implementationInputLevels) assert(content.templates[level].startsWith("def greedy_coins(amount, coins):"), `${level} template keeps the contract signature`);
assert.equal(implementationInputLevelText.levels.full.label, "全部書く");
assert.equal(implementationInputLevelText.levels.skeleton.label, "骨格から書く");
assert.equal(implementationInputLevelText.levels["fill-in"].label, "穴埋めで書く");
assert.equal(implementationDraftKey("base-key", "full"), "base-key");
assert.equal(implementationDraftKey("base-key", "skeleton"), "base-key:level:skeleton");
assert.equal(implementationDraftKey("base-key", "fill-in"), "base-key:level:fill-in");
const canonicalById = new Map(greedyCoinsCode.lines.map(line => [line.id, line.text]));
const solveTemplate = (template, groups) => {
  let group = 0;
  const solved = [];
  for (const line of template.split("\n")) {
    if (isImplementationPlaceholderLine(line)) {
      for (const id of groups[group++]) solved.push(canonicalById.get(id));
    } else if (!/^\s*#/u.test(line)) solved.push(line);
  }
  assert.equal(group, groups.length, "every placeholder is accounted for");
  return solved.join("\n");
};
const skeletonSolved = solveTemplate(content.templates.skeleton, [["for-coin"], ["while-remaining"], ["append-coin", "subtract-coin"]]);
const fillInSolved = solveTemplate(content.templates["fill-in"], [["append-coin"], ["subtract-coin"]]);
assert.equal(skeletonSolved, greedyCoinsCodeSource, "skeleton frame + canonical lines = canonical code");
assert.equal(fillInSolved, greedyCoinsCodeSource, "fill-in frame + canonical lines = canonical code");
const selectorHtml = renderToStaticMarkup(createElement(ImplementationLevelSelector, { level: "skeleton", onChange: () => {} }));
assert(selectorHtml.includes("data-input-level-selector"));
assert.equal((selectorHtml.match(/data-input-level-option=/g) || []).length, 3);
for (const label of ["全部書く", "骨格から書く", "穴埋めで書く"]) assert(selectorHtml.includes(label), `selector shows ${label}`);
assert.equal((selectorHtml.match(/aria-pressed="true"/g) || []).length, 1);

// ---- Python 実行: 参照コード・未着手テンプレート・典型的な誤り・最適化ソルバ ----
const optimalSolver = [
  "def greedy_coins(amount, coins):",
  "    infinity = amount + 1",
  "    min_count = [0] + [infinity] * amount",
  "    for total in range(1, amount + 1):",
  "        for coin in coins:",
  "            if coin <= total:",
  "                min_count[total] = min(min_count[total], min_count[total - coin] + 1)",
  "    result = []",
  "    remaining = amount",
  "    while remaining > 0:",
  "        for coin in coins:",
  "            if coin <= remaining and min_count[remaining - coin] == min_count[remaining] - 1:",
  "                result.append(coin)",
  "                remaining -= coin",
  "                break",
  "    return result",
].join("\n");
const variants = {
  reference: greedyCoinsCodeSource,
  optimalSolver,
  returnsCount: greedyCoinsCodeSource.replace("return result", "return len(result)"),
  smallestFirst: greedyCoinsCodeSource.replace("for coin in coins:", "for coin in reversed(coins):"),
  fullUntouched: content.templates.full,
  skeletonUntouched: content.templates.skeleton,
  fillInUntouched: content.templates["fill-in"],
  skeletonSolved, fillInSolved,
};
for (const name of ["returnsCount", "smallestFirst"]) assert.notEqual(variants[name], variants.reference, `${name} variant must differ`);
const python = spawnSync(process.env.PYTHON || "python3", ["-c", `
import json, sys
data = json.load(sys.stdin)
def run(code):
    ns = {}
    try:
        exec(code, ns)
    except Exception:
        return {test["id"]: False for test in data["tests"]}
    out = {}
    for test in data["tests"]:
        try:
            out[test["id"]] = ns[test["functionName"]](*test["args"]) == test["expected"]
        except Exception:
            out[test["id"]] = False
    return out
print(json.dumps({name: run(code) for name, code in data["variants"].items()}))
`], { input: JSON.stringify({ tests: plain(content.tests), variants }), encoding: "utf8" });
assert.equal(python.status, 0, python.stderr);
const results = JSON.parse(python.stdout);
const allTrue = { D1: true, J1: true, J2: true, J3: true, J4: true };
const allFalse = { D1: false, J1: false, J2: false, J3: false, J4: false };
assert.deepEqual(results.reference, allTrue, "reference code passes all five tests");
assert.deepEqual(results.optimalSolver, { D1: true, J1: true, J2: true, J3: true, J4: false },
  "An optimal solver passes the canonical coin systems but fails J4 (the counterexample), so J4 distinguishes greedy from optimal");
assert.equal(results.returnsCount.D1, false, "returning the coin count instead of the list fails");
assert.equal(results.smallestFirst.D1, false, "choosing the smallest coin first fails the main case");
assert.deepEqual(results.fullUntouched, allFalse, "an untouched full template must fail every test");
assert.deepEqual(results.skeletonUntouched, allFalse, "an untouched skeleton template must fail every test (placeholders remain)");
assert.deepEqual(results.fillInUntouched, allFalse, "an untouched fill-in template must fail every test (placeholders remain)");
assert.deepEqual(results.skeletonSolved, allTrue, "the canonical solution passes from the skeleton frame");
assert.deepEqual(results.fillInSolved, allTrue, "the canonical solution passes from the fill-in frame");

// ---- ヒント4: 全行並べ替えの練習盤面（固定なし、互換グループは引き継ぐ） ----
const parsons = content.hints.parsonsQuestion;
const phase6Parsons = greedyCoinsConsolidationContent.questions.find(question => "kind" in question && question.kind === "parsons");
assert.equal(parsons.fixedLineIds, undefined, "Hint Parsons is not faded");
assert.deepEqual([...parsons.lineIds].sort(), [...greedyCoinsCode.lines.map(line => line.id)].sort(), "Hint Parsons uses all eight lines");
assert.notDeepEqual(plain(parsons.lineIds), plain(parsons.correctAnswer.lineIds), "Hint Parsons presentation is shuffled");
assert.deepEqual(plain(parsons.correctAnswer.lineIds), plain(phase6Parsons.correctAnswer.lineIds), "Hint Parsons answer is the canonical order");
assert.deepEqual(plain(parsons.interchangeableLineGroups), [["append-coin", "subtract-coin"]], "Hint Parsons keeps the interchangeable group");
const parsonsHtml = renderToStaticMarkup(createElement(ParsonsBoard, { question: parsons, code: greedyCoinsCode }));
assert.equal((parsonsHtml.match(/data-parsons-line-id=/g) || []).length, 8);
assert(!parsonsHtml.includes('data-parsons-fixed="true"'), "Hint Parsons renders no fixed lines");
assert(!parsonsHtml.includes("この順序で回答する"), "Hint Parsons has no scoring action");
assert.equal(typeof ImplementationHints, "function", "Hint level 4 renders the same Parsons board through ImplementationHints (the board itself is asserted above; the MUI dialog is portal-based and not statically rendered)");
assert.deepEqual(plain(content.hints.skeletonLines.map(line => line.text)), ["    for coin in coins:", "        while remaining >= coin:"], "Hint level 3 shows the for and while skeleton lines in canonical text");
// ---- ヒント利用・エラー分類・進捗文言 ----
let usage = [0, 0, 0, 0];
for (const level of [2, 3, 4]) assert.equal(recordHintUsage(usage, level), usage);
for (const level of [1, 2, 3, 4]) {
  usage = recordHintUsage(usage, level);
  assert.equal(usage[level - 1], 1);
  if (level < 3) assert.equal(recordHintUsage(usage, 4), usage);
}
usage = recordHintUsage(usage, 4); assert.deepEqual(plain(usage), [1, 1, 1, 2]);
assert.deepEqual(plain(resultKinds([])), []);
assert.deepEqual(plain(resultKinds([{ id: "D1", passed: true }])), []);
for (const kind of ["syntax", "runtime", "timeout"]) assert.deepEqual(plain(resultKinds([{ id: "D1", passed: false, error: kind }])), [kind]);
assert.deepEqual(plain(resultKinds([{ id: "D1", passed: false }])), ["mismatch"]);
assert.equal(runningMessage(0, 5), content.status.running.replace("{current}", "1").replace("{total}", "5"));
const timeoutMessage = "Pythonの実行がタイムアウトしました。処理を見直してください。";
assert(fs.readFileSync(path.resolve(root, "../../lib/pyodideRunner.ts"), "utf8").includes(timeoutMessage), "Match the runner deadline message exactly");
assert.equal(classifyExecutionError(new Error(timeoutMessage)), "timeout");
assert.equal(classifyExecutionError(new Error("SyntaxError: bad syntax")), "syntax");
assert.equal(classifyExecutionError(new Error("ValueError: " + timeoutMessage)), "runtime");

// ---- 硬貨リストの値判定・差分・トレイ変換 ----
assert(isCoinListValue([500, 100])); assert(isCoinListValue([])); assert(!isCoinListValue("500")); assert(!isCoinListValue([500, 0])); assert(!isCoinListValue([500.5]));
assert.deepEqual(plain(coinListDifferences([500, 100, 100], [500, 100, 50])), [2]);
assert.equal(coinListDifferences([500], [500, 100]), null);
const tray = coinTrayCanvas(786, [500, 100, 50, 10, 5, 1], [500, 100, 100, 50, 10, 10, 10, 5, 1]);
validateGreedyCoinsBoard(tray.state);
assert.equal(tray.state.remaining, 0); assert.equal(tray.state.tray.length, 9);
assert.equal(coinTrayCanvas(786, [500, 100, 50, 10, 5, 1], [100, 500]), null, "A tray out of selection order cannot be drawn");
assert.equal(coinTrayCanvas(786, [500, 100, 50, 10, 5, 1], [500, 500]), null, "A tray over the amount cannot be drawn");
const outputHtml = renderToStaticMarkup(createElement(CoinListOutput, {
  expected: [500, 100, 100, 50, 10, 10, 10, 5, 1], actual: [500, 100, 100, 50, 10, 10, 10, 5, 1],
  amount: 786, coins: [500, 100, 50, 10, 5, 1],
}));
assert(outputHtml.includes('data-tray-count="9"'), "A drawable result renders as the coin tray");
assert(renderToStaticMarkup(createElement(CoinListOutput, { expected: [4, 1, 1], actual: "nope", amount: 6, coins: [4, 3, 1] })).includes(content.display.invalid));
assert(renderToStaticMarkup(createElement(CoinListOutput, { expected: [4, 1, 1], actual: [4, 1], amount: 6, coins: [4, 3, 1] })).includes(content.display.lengthMismatch));

(async () => {
// ---- テスト実行（モックランナー）: 表示用だけ実際の値を返し、判定用は秘匿する ----
assert.equal(allTestsPassed(content.tests, []), false);
assert.equal(allTestsPassed(content.tests, content.tests.map(test => ({ id: test.id, passed: true }))), true);
let disposed = 0;
runner.disposePyodideRunner = () => { disposed++; };
runner.preparePyodide = async () => ({ ready: true });
runner.runCourseMissionTests = async (code, tests) => {
  assert.equal(tests.length, 1);
  if (tests[0].id === "J1") throw new Error("SyntaxError: bad syntax");
  return { results: [{ ...tests[0], passed: tests[0].id !== "J2", actual: tests[0].expected }], stdout: "", stderr: "" };
};
const progressed = [];
const outcomes = await runImplementationTests("learner code", content.tests, next => progressed.push(next));
assert.equal(outcomes.length, 5);
assert.equal(outcomes.find(o => o.id === "D1").actual.join(","), "500,100,100,50,10,10,10,5,1", "Display outcomes carry the actual list");
assert.equal(outcomes.find(o => o.id === "J2").actual, undefined, "Judgement outcomes never carry the actual value");
assert.equal(outcomes.find(o => o.id === "J1").error, "syntax", "A thrown runner error becomes a classified outcome and later tests still run");
assert.deepEqual(progressed.map(next => next.length), [1, 2, 3, 4, 5], "Progress is reported per test");

// ---- 試しに実行: D1だけを新しいWorkerで実行する ----
assert.equal(freeDisplayCase.id, "D1"); assert.equal(freeDisplayCase.visibility, "display");
runner.runCourseMissionTests = async (code, tests) => {
  assert.equal(tests.length, 1); assert.equal(tests[0].id, "D1");
  return { results: [{ ...tests[0], passed: true, actual: [500, 100, 100, 50, 10, 10, 10, 5, 1] }], stdout: "", stderr: "" };
};
const free = await runGreedyCoinsFreeCode("learner code");
assert.equal(disposed, 1, "free execution rebuilds the worker");
assert.equal(free.returned, true); assert.equal(free.error, null);
assert.deepEqual(plain(free.actual), [500, 100, 100, 50, 10, 10, 10, 5, 1]);
const syntaxTrace = ["Traceback (most recent call last):", '  File "<exec>", line 3, in <module>', '  File "<string>", line 2', "    def solve(a, b)", "                 ^", "SyntaxError: expected ':'"].join("\n");
runner.runCourseMissionTests = async () => { throw new Error(syntaxTrace); };
const freeError = await runGreedyCoinsFreeCode("learner code");
assert.equal(freeError.returned, false); assert.equal(freeError.error, "syntax"); assert.equal(freeError.errorLine, 2, "free execution carries the learner line (#325)");
const { greedyCoinsEditorText: editorText } = load(file("units/greedy-coins/implementation/editor.content.ts"));
const freeHtml = renderToStaticMarkup(createElement(FreeExecutionConsole, {
  result: { stdout: "", outputTruncated: false, returned: false, error: "syntax", errorLine: 2 }, busy: false,
}));
assert(freeHtml.includes(editorText.errors.syntax + "（2行目付近）"), "console error text names the learner line");
assert(freeHtml.includes(editorText.syntaxNote), "syntax errors explain that not even print runs");

// ---- 結果表示: 表示用だけ詳細を出し、判定用の期待値は漏らさない ----
const resultsHtml = renderToStaticMarkup(createElement(ImplementationResults, {
  outcomes: [{ id: "D1", passed: false, actual: [500, 100] }],
  diagnostics: [{ id: "D1", passed: false, actual: [500, 100] }],
}));
assert(resultsHtml.includes("786円"), "Display case shows its amount");
assert(resultsHtml.includes("[500, 100, 100, 50, 10, 10, 10, 5, 1]"), "Display case shows its expected list");
assert(!resultsHtml.includes("[100, 100, 100, 10, 10, 10, 10, 1, 1]"), "Judgement case J2 expected list must not leak");
assert(!resultsHtml.includes("[25, 10, 5, 1]"), "Judgement case J3 inputs/expected must not leak as a list");
assert(resultsHtml.includes('data-error-kind="mismatch"'), "Diagnostics classify a plain failure as mismatch");

// ---- 画面契約: ライトテーマ、トレース接続（#388） ----
const impl = name => fs.readFileSync(file(`units/greedy-coins/implementation/${name}`), "utf8");
const adapterSource = impl("GreedyCoinsImplementationPreview.tsx");
  assert.match(adapterSource, /<ImplementationWorkspace/, "the unit uses the shared editor workspace");
  const previewSource = fs.readFileSync(`${root}/implementation/ImplementationWorkspace.tsx`, "utf8");
assert.match(previewSource, /theme=\{LEARNING_EDITOR_THEME\}/, "editor uses the shared learning theme");
assert.match(previewSource, /beforeMount=\{setupLearningEditor\}/, "editor setup is shared");
assert(!previewSource.includes("vs-dark"), "editor is light themed");
assert(adapterSource.includes("GreedyCoinsTraceDialog"), "Visual debugging is connected to the trace dialog (#388)");
assert(adapterSource.includes("traceGreedyCoinsCode"), "Visual debugging acquires the trace (#388)");
assert(load(file("units/greedy-coins/trace/trace.content.ts")).greedyCoinsTraceText.button === "硬貨が選ばれる様子を見る" && adapterSource.includes("traceText: greedyCoinsTraceText"), "The unit trace button label is injected (#388)");
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "greedy-coins-implementation"'), "Standalone preview is registered");
console.log("Greedy-coins implementation verified: five cases (D1 display, J1-J4 judgement including the counterexample J4 that an optimal solver fails), byte-exact baseline skeleton/fill-in templates with 0/3/2 placeholders and untouched-template failures, canonical Parsons reuse as an unfaded hint-4 board, hint gating, coin-tray output, free-execution and hidden-case redaction.");
})().catch(error => { console.error(error); process.exit(1); });
