const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const ts = require("typescript");
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const { bubbleSortImplementationContent: content } = load(`${root}/bubble-sort/implementation/implementation.content.ts`);
const { bubbleSortCode, bubbleSortCodeSource } = load(`${root}/bubble-sort/code-mapping/bubbleSortCode.ts`);
const { bubbleSortConsolidationContent } = load(`${root}/bubble-sort/consolidation/consolidation.content.ts`);
const { bubbleSortExecutionContent } = load(`${root}/bubble-sort/execution/execution.content.ts`);
const { ImplementationResults } = load(`${root}/bubble-sort/implementation/ImplementationResults.tsx`);
const { ImplementationHints } = load(`${root}/bubble-sort/implementation/ImplementationHints.tsx`);
const { FreeExecutionConsole } = load(`${root}/bubble-sort/implementation/FreeExecutionConsole.tsx`);
const { ParsonsBoard } = load(`${root}/bfs/consolidation/ParsonsBoard.tsx`);
const {
  recordHintUsage, resultKinds, classifyExecutionError, runningMessage, allTestsPassed, runImplementationTests,
  isNumberListValue, isDrawableArrayValue, arrayBarsCanvas, arrayDifferences,
} = load(`${root}/bubble-sort/implementation/implementation.ts`);
const { validateArrayBarsCanvas } = load(`${root}/player/arrayBars.types.ts`);
const { freeDisplayCase, runBubbleSortFreeCode } = load(`${root}/bubble-sort/implementation/freeExecution.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const plain = value => JSON.parse(JSON.stringify(value));

// ---- コンテンツの基本契約 ----
assert.equal(content.id, "bubble-sort-implementation"); assert.equal(content.phase, 7); assert.equal(content.version, 1);
assert.match(content.template, /^def bubble_sort\(values\):\n/u);
assert.match(content.template, /\n +pass$/u);
assert.equal(bubbleSortCode.id, "bubble-sort-v1"); assert.equal(bubbleSortCode.version, 1);
assert.deepEqual(plain(content.hints.skeletonLineIds), ["for-pass", "for-compare", "if-larger"]);
content.hints.skeletonLines.forEach((line, index) => assert.equal(line, bubbleSortCode.lines.find(line => line.id === content.hints.skeletonLineIds[index])));
assert.equal(content.hints.labels.length, 4);
assert.deepEqual(plain(content.hints.flow), ["左端から右端まで、隣同士を比べていく", "左が大きければ入れ替える", "右端が決まったら、範囲を1つ狭めてくり返す"]);
assert.equal(new Set(content.hints.tokens).size, content.hints.tokens.length);
assert.equal(content.hints.parsonsQuestion, bubbleSortConsolidationContent.questions.find(question => question.kind === "parsons"));
for (const file of fs.readdirSync(`${root}/bubble-sort/implementation`).filter(file => /\.tsx?$/.test(file))) {
  assert(!/codeDiff|diffLines|from ["']diff["']|diffTitle|referenceCode/u.test(fs.readFileSync(`${root}/bubble-sort/implementation/${file}`, "utf8")), "No diff hint dependency remains in the feature");
}

// ---- テストの入力は基準データの確定値、期待値は独立に数値ソートで確認 ----
assert.deepEqual(plain(content.tests.map(test => test.id)), ["D1", "D2", "J1", "J2", "J3"]);
assert.deepEqual(plain(content.tests.map(test => test.visibility)), ["display", "display", "judgement", "judgement", "judgement"]);
assert.deepEqual(plain(content.tests.map(test => plain(test.args))), [
  [[4, 2, 5, 1, 3]],
  [[3, 1, 4, 2]],
  [[3, 1, 3, 2]],
  [[5, 4, 3, 2, 1]],
  [[1, 2, 3, 4]],
]);
for (const test of content.tests) {
  assert.equal(test.functionName, "bubble_sort");
  const input = plain(test.args[0]);
  assert.deepEqual(plain(test.expected), [...input].sort((a, b) => a - b), `${test.id} expected is the sorted input`);
  assert.deepEqual([...plain(test.expected)].sort((a, b) => a - b), [...input].sort((a, b) => a - b), `${test.id} expected is a permutation of the input`);
}
// D1の期待する並びはフェーズ2の完成ステップと一致する。
{
  const complete = bubbleSortExecutionContent.steps.find(step => step.id === "complete");
  assert(complete, "phase 2 complete step exists");
  assert.deepEqual(plain(complete.canvas.state.values), plain(content.tests[0].expected), "D1 matches the phase 2 completed array");
}

// ---- Python で参照コード・テンプレート・典型的な誤りを実行検証 ----
// 入力を直接並び替える変異（inPlace）と、範囲が狭まらない変異（nonNarrowing）は、
// 戻り値の一致だけでは落とせないことを含めて確認する（実施記録の留保参照）。
const variants = {
  reference: bubbleSortCodeSource,
  reversed: bubbleSortCodeSource.replace("if result[j] > result[j + 1]:", "if result[j] < result[j + 1]:"),
  wide: bubbleSortCodeSource.split("range(n - 1 - i)").join("range(n - i)"),
  narrow: bubbleSortCodeSource.split("range(n - 1 - i)").join("range(n - 2 - i)"),
  nonNarrowing: bubbleSortCodeSource.split("range(n - 1 - i)").join("range(n - 1)"),
  inPlace: bubbleSortCodeSource.replace("result = list(values)", "result = values"),
};
for (const name of ["reversed", "wide", "narrow", "nonNarrowing", "inPlace"]) assert.notEqual(variants[name], variants.reference, `${name} variant must differ`);
const python = spawnSync(process.env.PYTHON || "python3", ["-c", `
import ast, copy, json, sys
data = json.load(sys.stdin)
ast.parse(data["template"])
def run(code):
    ns = {}
    exec(code, ns)
    out = {}
    for test in data["tests"]:
        try:
            out[test["id"]] = ns[test["functionName"]](*copy.deepcopy(test["args"])) == test["expected"]
        except Exception:
            out[test["id"]] = False
    return out
def mutates(code):
    ns = {}
    exec(code, ns)
    probe = [4, 2, 5, 1, 3]
    try:
        ns["bubble_sort"](probe)
    except Exception:
        return False
    return probe != [4, 2, 5, 1, 3]
print(json.dumps({
  "results": {name: run(code) for name, code in data["variants"].items()},
  "mutates": {name: mutates(code) for name, code in data["variants"].items()},
}))
`], {
  input: JSON.stringify({ template: content.template, tests: plain(content.tests), variants }), encoding: "utf8",
});
assert.equal(python.status, 0, python.stderr);
const { results, mutates } = JSON.parse(python.stdout);
assert.deepEqual(results.reference, { D1: true, D2: true, J1: true, J2: true, J3: true }, "reference code passes all five tests");
assert.equal(mutates.reference, false, "reference code does not mutate its input");
assert.deepEqual(results.reversed, { D1: false, D2: false, J1: false, J2: false, J3: false }, "reversed swap condition sorts the wrong way and fails");
assert.equal(results.wide.D1, false, "an inner range wider than the unfixed range must fail");
assert.equal(results.narrow.D1, false, "an inner range narrower than the unfixed range must fail D1");
// 範囲が狭まらない変異は結果が正しくなる（比較回数が増えるだけ）ため、結果ベースのテストでは落とせない。
assert.deepEqual(results.nonNarrowing, { D1: true, D2: true, J1: true, J2: true, J3: true }, "a non-narrowing inner range still returns the sorted list");
// 入力を直接並び替える変異は契約違反だが、戻り値の一致判定だけでは検出できない（基盤の留保）。
assert.deepEqual(results.inPlace, { D1: true, D2: true, J1: true, J2: true, J3: true }, "in-place sorting passes value equality");
assert.equal(mutates.inPlace, true, "the in-place variant really does mutate its argument");

// ---- ヒント利用・エラー分類・進捗文言（先行フェーズ7と同じ契約） ----
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
const timeoutMessage = "Pythonの実行がタイムアウトしました。処理を見直してください。";
assert(fs.readFileSync(path.resolve(root, "../../lib/pyodideRunner.ts"), "utf8").includes(timeoutMessage), "Match the runner deadline message exactly");
assert.equal(classifyExecutionError(new Error(timeoutMessage)), "timeout");
assert.equal(classifyExecutionError(new Error("SyntaxError: bad syntax")), "syntax");
assert.equal(classifyExecutionError(new Error("IndentationError: bad indentation")), "syntax");
assert.equal(classifyExecutionError(new Error("ValueError: " + timeoutMessage)), "runtime", "Do not mistake a Python exception mentioning a timeout for the runner deadline");
assert.deepEqual(plain(resultKinds([{ id: "D1", passed: false }, { id: "D2", passed: false, error: "timeout" }])), ["timeout", "mismatch"]);
for (let done = 0; done < 5; done++) assert.equal(runningMessage(done, 5), `テストを実行中です（${done + 1}/5件目）`);
const passedOutcomes = content.tests.map(test => ({ id: test.id, passed: true }));
assert(allTestsPassed(content.tests, passedOutcomes)); assert(!allTestsPassed(content.tests, passedOutcomes.slice(1)));
assert(!allTestsPassed(content.tests, passedOutcomes.map(test => test.id === "J3" ? { ...test, passed: false } : test)));
assert(!allTestsPassed([], []));

// ---- 配列ヘルパー ----
const d1Expected = plain(content.tests[0].expected);
assert(isNumberListValue(d1Expected)); assert(isDrawableArrayValue(d1Expected));
assert(!isNumberListValue("not a list")); assert(!isNumberListValue([])); assert(!isNumberListValue([1, "2"]));
assert(!isNumberListValue([Number.NaN])); assert(!isNumberListValue([Infinity]));
assert(isNumberListValue([-1, 2])); assert(!isDrawableArrayValue([-1, 2]), "negative values cannot be drawn as bars");
assert.deepEqual(plain(arrayDifferences(d1Expected, d1Expected)), []);
assert.deepEqual(plain(arrayDifferences([1, 2, 3, 4, 5], [1, 2, 3, 5, 4])), [3, 4]);
assert.equal(arrayDifferences(d1Expected, [1, 2]), null, "different lengths are not position differences");
assert.equal(arrayDifferences(d1Expected, "not a list"), null);
{
  const canvas = arrayBarsCanvas([2, 1, 3], [1]);
  validateArrayBarsCanvas(canvas);
  assert.deepEqual(plain(canvas.state.values), [2, 1, 3]);
  assert.equal(canvas.state.comparing, null);
  assert.equal(canvas.state.fixedFrom, 3);
  assert.deepEqual(plain(canvas.highlights), [{ kind: "cell", id: 1 }]);
}

// ---- 結果表示の描画契約 ----
const unchangedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [] }));
assert(!unchangedHtml.includes("data-error-kind"));
assert(unchangedHtml.includes(content.display.statuses.unexecuted.icon));
assert.equal((unchangedHtml.match(/<svg/g) || []).length, 2, "only the two display cases draw their expected arrays");
assert.equal((unchangedHtml.match(/data-array-bar=/g) || []).length, 5 + 4);
assert(!unchangedHtml.includes("data-phase-result-check"), "unexecuted tests have no drawn check");
for (const test of content.tests) assert(!unchangedHtml.includes(`>${test.id} `), "Internal IDs stay out of visible headings");
for (const id of ["J1", "J2", "J3"]) {
  const item = unchangedHtml.match(new RegExp(`data-test-id="${id}"[\\s\\S]*?</li>`))[0];
  assert(!/期待する並び|実際の並び|data-array-bar/u.test(item), "judgement cases show no input, expected or actual array");
}
const passedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: content.tests.map(test => ({ id: test.id, passed: true, actual: test.expected })) }));
assert.equal((passedHtml.match(/data-phase-result-check/g) || []).length, content.tests.length, "each passed test draws in its own check");
assert(!passedHtml.includes("data-array-different-count"), "matching arrays report no different positions");
const swappedTail = [1, 2, 3, 5, 4];
const mismatchedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [{ id: "D1", passed: false, actual: swappedTail }] }));
assert(mismatchedHtml.includes('data-array-different-count="2"'));
assert(mismatchedHtml.includes('data-array-highlight="3"'), "a different position is framed on the actual array");
assert(mismatchedHtml.includes('data-array-highlight="4"'), "a different position is framed on the actual array");
assert(mismatchedHtml.includes(content.display.statuses.failed.icon));
assert(!mismatchedHtml.includes("data-phase-result-check"), "failed tests have no drawn check");
const invalidHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [{ id: "D1", passed: false, actual: { PRIVATE_OUTPUT_SENTINEL: 9 } }] }));
assert(invalidHtml.includes(content.display.invalid));
assert(!invalidHtml.includes("PRIVATE_OUTPUT_SENTINEL"), "non-list return values are never rendered raw");
assert.equal(typeof ImplementationHints, "function");
const review = renderToStaticMarkup(createElement(ParsonsBoard, { question: content.hints.parsonsQuestion, code: bubbleSortCode }));
assert.equal((review.match(/data-parsons-line-id=/g) || []).length, 8);
assert(!review.includes("この順序で回答する"), "Hint Parsons has no scoring action");

// ---- 試しに実行（D1）は戻り値のリストを棒グラフで示す ----
assert.equal(freeDisplayCase, content.tests[0]);
const freeHtml = renderToStaticMarkup(createElement(FreeExecutionConsole, {
  result: { stdout: "", outputTruncated: false, returned: true, actual: content.tests[0].expected, error: null }, busy: false,
}));
assert(freeHtml.includes("data-free-return"));
assert.equal((freeHtml.match(/data-array-bar=/g) || []).length, 5);
assert(!freeHtml.includes("data-array-different-count"));
const freeMismatchHtml = renderToStaticMarkup(createElement(FreeExecutionConsole, {
  result: { stdout: "", outputTruncated: false, returned: true, actual: swappedTail, error: "mismatch" }, busy: false,
}));
assert(freeMismatchHtml.includes('data-array-different-count="2"'));
assert(freeMismatchHtml.includes('data-free-error-kind="mismatch"'));

(async () => {
  // runImplementationTests: 例外後も続行し、判定用の値はUI状態へ渡さない。
  const calls = [], progress = [];
  runner.runCourseMissionTests = async (code, tests) => {
    assert.equal(code, "learner code"); assert.equal(tests.length, 1); calls.push(tests[0].id);
    const test = tests[0];
    if (test.id === "D2") throw new Error("SyntaxError: HIDDEN_EXCEPTION");
    if (test.id === "J1") throw new Error("KeyError: HIDDEN_EXCEPTION");
    if (test.id === "J2") throw new Error(timeoutMessage);
    return { results: [{ ...test, passed: true, actual: "HIDDEN_VALUE" }], stdout: "HIDDEN_STDOUT", stderr: "HIDDEN_STDERR" };
  };
  const outcomes = await runImplementationTests("learner code", content.tests, next => progress.push(next));
  assert.deepEqual(calls, ["D1", "D2", "J1", "J2", "J3"], "Continue after case errors");
  assert.deepEqual(progress.map(next => next.length), [1, 2, 3, 4, 5]);
  assert.equal(outcomes[1].error, "syntax"); assert.equal(outcomes[2].error, "runtime"); assert.equal(outcomes[3].error, "timeout");
  assert(!JSON.stringify(outcomes.slice(2)).includes("HIDDEN"), "Judgement values never enter UI state");
  assert(!JSON.stringify(outcomes).includes("HIDDEN_EXCEPTION"));
  assert.equal(progress[0].length, 1, "Earlier progress snapshots stay unchanged");
  let active = true;
  const cancelled = await runImplementationTests("learner code", content.tests, () => { active = false; }, () => active);
  assert.equal(cancelled.length, 1, "Unmounting stops subsequent case requests");

  // 試しに実行: Workerを作り直し、D1だけで実行して戻り値をそのまま返す。
  let disposed = 0;
  runner.disposePyodideRunner = () => { disposed++; };
  runner.preparePyodide = async () => ({ ready: true });
  runner.runCourseMissionTests = async (code, tests) => {
    assert.equal(tests.length, 1); assert.equal(tests[0].id, "D1");
    return { results: [{ ...tests[0], passed: true, actual: d1Expected }], stdout: "", stderr: "" };
  };
  const free = await runBubbleSortFreeCode("learner code");
  assert.equal(disposed, 1, "free execution rebuilds the worker");
  assert.equal(free.returned, true); assert.equal(free.error, null);
  assert.deepEqual(plain(free.actual), d1Expected);

  // 画面契約（#149）: エディタはライトテーマ＋枠と見出しで分離し、ダーク基調を持たない。ヒント2はフロー表示、結果の状態はアニメーションで現れる。
  const impl = (file) => fs.readFileSync(`${root}/bubble-sort/implementation/${file}`, "utf8");
  const previewSource = impl("BubbleSortImplementationPreview.tsx");
  assert.match(previewSource, /theme="vs"/);
  assert(!previewSource.includes("vs-dark"), "editor is light themed");
  assert.match(previewSource, /border: `2px solid \$\{colors\.focus\}`/, "editor area is framed in the focus colour");
  assert(!impl("editor.tokens.ts").includes("#1e1e1e"), "editor tokens are light");
  const hintsSource = impl("ImplementationHints.tsx");
  assert.match(hintsSource, /content\.hints\.loopLabel/, "hint 2 shows the loop as a flow");
  assert.match(hintsSource, /min\(92vw, 760px\)/, "hint dialog width is capped for readability");
  const resultsSource = impl("ImplementationResults.tsx");
  assert.match(resultsSource, /data-test-status/, "test status changes animate in");
  assert.match(resultsSource, /component=\{motion\.span\} key=\{statusKey\}/, "a status change mounts its own short animation");
  assert.match(resultsSource, /initial=\{reducedMotion \? false/, "reduced motion skips the initial animation state");
  assert.match(resultsSource, /duration: reducedMotion \? 0 : 0\.3/, "reduced motion removes the transition");
  assert.match(resultsSource, /DrawnCheck/, "passed tests show the shared drawn check");
  assert.match(resultsSource, /outcome\?\.passed && /, "the drawn check is gated on passing");
  assert.match(previewSource, /ResultConfetti/, "all-pass fires the phase confetti");
  assert.match(previewSource, /DrawnCheck size=\{76\}/, "the completion view leads with a large drawn check");
  assert(!previewSource.includes("Trace"), "visual debugging stays in issue #234");
  console.log("Bubble-sort implementation: five cases verified against an independent sort and CPython reference, typical-mistake mutations (reversed swap condition, too-wide and too-narrow inner ranges), documented non-failing variants (non-narrowing range, in-place sorting), canonical skeleton and Parsons reuse, hint gating, array difference display, free-execution array rendering, hidden-case redaction, all-pass gate and runner progress/error/cancellation checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
