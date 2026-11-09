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
const { binarySearchImplementationContent: content } = load(`${root}/binary-search/implementation/implementation.content.ts`);
const { binarySearchCode, binarySearchCodeSource } = load(`${root}/binary-search/code-mapping/binarySearchCode.ts`);
const { binarySearchConsolidationContent } = load(`${root}/binary-search/consolidation/consolidation.content.ts`);
const { runBinarySearch } = load(`${root}/binary-search/binarySearch.ts`);
const { ImplementationResults } = load(`${root}/binary-search/implementation/ImplementationResults.tsx`);
const { ImplementationHints } = load(`${root}/binary-search/implementation/ImplementationHints.tsx`);
const { FreeExecutionConsole } = load(`${root}/binary-search/implementation/FreeExecutionConsole.tsx`);
const { ParsonsBoard } = load(`${root}/bfs/consolidation/ParsonsBoard.tsx`);
const {
  recordHintUsage, resultKinds, classifyExecutionError, runningMessage, allTestsPassed, runImplementationTests,
  isIndexValue, indexCanvas,
} = load(`${root}/binary-search/implementation/implementation.ts`);
const { validateArrayBarsCanvas } = load(`${root}/player/arrayBars.types.ts`);
const { freeDisplayCase, runBinarySearchFreeCode } = load(`${root}/binary-search/implementation/freeExecution.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const plain = value => JSON.parse(JSON.stringify(value));

// ---- コンテンツの基本契約 ----
assert.equal(content.id, "binary-search-implementation"); assert.equal(content.phase, 7); assert.equal(content.version, 1);
assert.match(content.template, /^def binary_search\(values, target\):\n/u);
assert.match(content.template, /"""[^"]+"""/u, "template carries the contract docstring");
assert.match(content.template, /\n +pass$/u);
assert.equal(binarySearchCode.id, "binary-search-v1"); assert.equal(binarySearchCode.version, 1);
assert.deepEqual(plain(content.hints.skeletonLineIds), ["while-range", "if-hit", "elif-smaller", "else-larger"]);
content.hints.skeletonLines.forEach((line, index) => assert.equal(line, binarySearchCode.lines.find(line => line.id === content.hints.skeletonLineIds[index])));
assert.equal(content.hints.labels.length, 4);
assert.deepEqual(plain(content.hints.flow), [
  "探す範囲の両端（左端と右端）を決める",
  "真ん中の位置を計算して、その値と探す値を比べる",
  "一致したら、その位置を返す",
  "真ん中より小さい側か大きい側かを捨てて、範囲を狭める",
  "範囲が空になったら、無いことを表す -1 を返す",
]);
assert.equal(new Set(content.hints.tokens).size, content.hints.tokens.length);
assert.equal(content.hints.parsonsQuestion, binarySearchConsolidationContent.questions.find(question => question.kind === "parsons"));
for (const file of fs.readdirSync(`${root}/binary-search/implementation`).filter(file => /\.tsx?$/.test(file))) {
  assert(!/codeDiff|diffLines|from ["']diff["']|diffTitle|referenceCode/u.test(fs.readFileSync(`${root}/binary-search/implementation/${file}`, "utf8")), "No diff hint dependency remains in the feature");
}

// ---- テストの入力は基準データの確定値、期待値は独立に（indexOf の意味論）確認 ----
assert.deepEqual(plain(content.tests.map(test => test.id)), ["D1", "J1", "J2", "J3"]);
assert.deepEqual(plain(content.tests.map(test => test.visibility)), ["display", "judgement", "judgement", "judgement"]);
assert.deepEqual(plain(content.tests.map(test => plain(test.args))), [
  [[3, 7, 12, 19, 25, 31, 42], 25],
  [[3, 7, 12, 19, 25, 31, 42], 25],
  [[2, 5, 8, 12, 16, 23, 38, 56, 72, 91], 23],
  [[3, 7, 12, 19, 25, 31, 42], 20],
]);
assert.deepEqual(plain(content.tests.map(test => test.expected)), [4, 4, 5, -1]);
for (const test of content.tests) {
  assert.equal(test.functionName, "binary_search");
  const [values, target] = plain(test.args);
  assert.equal(test.expected, values.indexOf(target), `${test.id} expected is the position of the target (or -1)`);
  assert.equal(test.expected, runBinarySearch(values, target), `${test.id} expected follows the verified execution record`);
}

// ---- Python で参照コード・テンプレート・典型的な誤りを実行検証 ----
// 無限ループになる変異（lo = mid / hi = mid）はステップ数上限で打ち切って不合格にする。
const variants = {
  reference: binarySearchCodeSource,
  loStays: binarySearchCodeSource.replace("lo = mid + 1", "lo = mid"),
  hiStays: binarySearchCodeSource.replace("hi = mid - 1", "hi = mid"),
  returnsNone: binarySearchCodeSource.replace("return -1", "return None"),
  returnsValue: binarySearchCodeSource.replace("return mid", "return values[mid]"),
};
for (const name of ["loStays", "hiStays", "returnsNone", "returnsValue"]) assert.notEqual(variants[name], variants.reference, `${name} variant must differ`);
const python = spawnSync(process.env.PYTHON || "python3", ["-c", `
import ast, copy, json, sys
data = json.load(sys.stdin)
ast.parse(data["template"])
def run(code):
    ns = {}
    exec(code, ns)
    out = {}
    for test in data["tests"]:
        steps = [0]
        def tracer(frame, event, arg):
            if event == "line":
                steps[0] += 1
                if steps[0] > 200000:
                    raise RuntimeError("step limit")
            return tracer
        sys.settrace(tracer)
        try:
            out[test["id"]] = ns[test["functionName"]](*copy.deepcopy(test["args"])) == test["expected"]
        except Exception:
            out[test["id"]] = False
        finally:
            sys.settrace(None)
    return out
def mutates(code):
    ns = {}
    exec(code, ns)
    probe = [3, 7, 12, 19, 25, 31, 42]
    try:
        ns["binary_search"](probe, 25)
    except Exception:
        return False
    return probe != [3, 7, 12, 19, 25, 31, 42]
print(json.dumps({
  "results": {name: run(code) for name, code in data["variants"].items()},
  "mutates": {name: mutates(code) for name, code in data["variants"].items()},
}))
`], {
  input: JSON.stringify({ template: content.template, tests: plain(content.tests), variants }), encoding: "utf8",
});
assert.equal(python.status, 0, python.stderr);
const { results, mutates } = JSON.parse(python.stdout);
assert.deepEqual(results.reference, { D1: true, J1: true, J2: true, J3: true }, "reference code passes all four tests");
assert.equal(mutates.reference, false, "reference code does not mutate its input");
// mid 自身を範囲に残すと、真ん中が進まなくなるケースで無限ループになる。
assert.deepEqual(results.loStays, { D1: true, J1: true, J2: false, J3: false }, "lo = mid never narrows past the middle on the transfer and absent cases");
// hi 側も同様に、最後の1個が探す値より大きい不在ケースで真ん中が進まなくなる。
assert.deepEqual(results.hiStays, { D1: true, J1: true, J2: true, J3: false }, "hi = mid never narrows past the last element on the absent case");
// 無い場合に None を返すと、不在ケースだけが落ちる。
assert.deepEqual(results.returnsNone, { D1: true, J1: true, J2: true, J3: false }, "returning None instead of -1 fails only the absent case");
// 位置ではなく値そのものを返すと、基本ケースが落ちる。
assert.equal(results.returnsValue.D1, false, "returning the value instead of its position fails");

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
// ---- エラー行の抽出と表示（#325）: 行番号は学習者コード基準で持ち回り、表示と検証に使う ----
const { analyzeExecutionError, extractExecutionErrorLine } = load(path.resolve(root, "../../lib/executionError.ts"));
const syntaxTrace = ["Traceback (most recent call last):", '  File "<exec>", line 3, in <module>', '  File "<string>", line 2', "    def solve(a, b)", "                 ^", "SyntaxError: expected ':'"].join("\n");
assert.deepEqual(plain(analyzeExecutionError(new Error(syntaxTrace))), { kind: "syntax", line: 2 }, "syntax errors carry the learner line from the traceback");
const runtimeTrace = ["Traceback (most recent call last):", '  File "<exec>", line 12, in <module>', '  File "<string>", line 5, in solve', '  File "<string>", line 3, in helper', "NameError: name 'x' is not defined"].join("\n");
assert.deepEqual(plain(analyzeExecutionError(new Error(runtimeTrace))), { kind: "runtime", line: 3 }, "runtime errors use the deepest learner frame");
assert.deepEqual(plain(analyzeExecutionError(new Error('Traceback (most recent call last):\n  File "<exec>", line 8, in <module>\nNameError: HIDDEN'))), { kind: "runtime" }, "harness-only frames give no learner line");
assert.deepEqual(plain(analyzeExecutionError(new Error(timeoutMessage))), { kind: "timeout" }, "timeouts carry no line");
assert.equal(extractExecutionErrorLine("SyntaxError: no traceback"), undefined);
const { binarySearchEditorText: editorText } = load(`${root}/binary-search/implementation/editor.content.ts`);
const syntaxFreeHtml = renderToStaticMarkup(createElement(FreeExecutionConsole, {
  result: { stdout: "", outputTruncated: false, returned: false, error: "syntax", errorLine: 2 }, busy: false,
}));
assert(syntaxFreeHtml.includes(editorText.errors.syntax + "（2行目付近）"), "console error text names the learner line");
assert(syntaxFreeHtml.includes(editorText.syntaxNote), "syntax errors explain that not even print runs");
assert(syntaxFreeHtml.includes('data-free-error-line="2"'), "console exposes the error line");
const runtimeFreeHtml = renderToStaticMarkup(createElement(FreeExecutionConsole, {
  result: { stdout: "", outputTruncated: false, returned: false, error: "runtime" }, busy: false,
}));
assert(!runtimeFreeHtml.includes("行目付近"), "no line note when the line is unknown");
assert(!runtimeFreeHtml.includes(editorText.syntaxNote), "the nothing-runs note is syntax-only");
const lineSummaryHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [{ id: "D1", passed: false, error: "runtime", errorLine: 7 }] }));
assert(lineSummaryHtml.includes(content.display.messages.runtime + "（7行目付近）"), "test summary names the learner line");
assert(lineSummaryHtml.includes('data-error-line="7"'), "test summary exposes the error line");
const errorLinePreviewSource = fs.readFileSync(`${root}/binary-search/implementation/BinarySearchImplementationPreview.tsx`, "utf8");
assert.match(errorLinePreviewSource, /useErrorLineDecoration/, "preview highlights the error line in the editor (#325)");
assert.match(errorLinePreviewSource, /setErrorLine\(undefined\)/, "changing code or rerunning clears the error line");
assert(fs.readFileSync(path.resolve(root, "../../app/globals.css"), "utf8").includes(".eq-error-line-highlight"), "the error line highlight has a global style");

assert.deepEqual(plain(resultKinds([{ id: "D1", passed: false }, { id: "J1", passed: false, error: "timeout" }])), ["timeout", "mismatch"]);
for (let done = 0; done < 4; done++) assert.equal(runningMessage(done, 4), `テストを実行中です（${done + 1}/4件目）`);
const passedOutcomes = content.tests.map(test => ({ id: test.id, passed: true }));
assert(allTestsPassed(content.tests, passedOutcomes)); assert(!allTestsPassed(content.tests, passedOutcomes.slice(1)));
assert(!allTestsPassed(content.tests, passedOutcomes.map(test => test.id === "J3" ? { ...test, passed: false } : test)));
assert(!allTestsPassed([], []));

// ---- 位置の値判定と描画用 Canvas ----
const mainValues = plain(content.tests[0].args[0]);
assert(isIndexValue(4)); assert(isIndexValue(-1)); assert(isIndexValue(0));
assert(!isIndexValue(2.5)); assert(!isIndexValue("4")); assert(!isIndexValue(null)); assert(!isIndexValue(Number.NaN)); assert(!isIndexValue(undefined));
{
  const canvas = indexCanvas(mainValues, 4);
  validateArrayBarsCanvas(canvas);
  assert.deepEqual(plain(canvas.state.values), mainValues);
  assert.equal(canvas.state.comparing, null);
  assert.equal(canvas.state.fixedFrom, mainValues.length);
  assert.equal(canvas.state.cellStatuses[4], "processing");
  assert(canvas.state.cellStatuses.every((status, index) => index === 4 || status === "idle"));
  assert.deepEqual(plain(canvas.highlights), [{ kind: "cell", id: 4 }]);
}
{
  const notFound = indexCanvas(mainValues, -1);
  validateArrayBarsCanvas(notFound);
  assert(notFound.state.cellStatuses.every(status => status === "idle"), "-1 points at no cell");
  assert.deepEqual(plain(notFound.highlights), []);
  const outOfRange = indexCanvas(mainValues, 99);
  validateArrayBarsCanvas(outOfRange);
  assert.deepEqual(plain(outOfRange.highlights), [], "an out-of-range position points at no cell");
}

// ---- 結果表示の描画契約 ----
const unchangedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [] }));
assert(!unchangedHtml.includes("data-error-kind"));
assert(unchangedHtml.includes(content.display.statuses.unexecuted.icon));
assert.equal((unchangedHtml.match(/<svg/g) || []).length, 1, "only the display case draws its expected figure");
assert.equal((unchangedHtml.match(/data-array-bar=/g) || []).length, 7);
assert(unchangedHtml.includes('data-index-position="4"'), "the expected position is stated as a number, not colour alone");
assert(!unchangedHtml.includes("data-phase-result-check"), "unexecuted tests have no drawn check");
for (const test of content.tests) assert(!unchangedHtml.includes(`>${test.id} `), "Internal IDs stay out of visible headings");
for (const id of ["J1", "J2", "J3"]) {
  const item = unchangedHtml.match(new RegExp(`data-test-id="${id}"[\\s\\S]*?</li>`))[0];
  assert(!/期待する位置|実際の位置|data-array-bar/u.test(item), "judgement cases show no input, expected or actual figure");
}
const passedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: content.tests.map(test => ({ id: test.id, passed: true, actual: test.expected })) }));
assert(!passedHtml.includes("data-phase-result-check"), "result rows carry the text mark only; the drawn check belongs to the completion view");
assert.equal(passedHtml.split(content.display.statuses.passed.icon).length - 1, content.tests.length, "each passed test shows its text mark in the list");
const wrongPositionHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [{ id: "D1", passed: false, actual: 3 }] }));
assert(wrongPositionHtml.includes('data-array-highlight="3"'), "a wrong position is framed on the actual figure");
assert(wrongPositionHtml.includes('data-index-position="3"'));
assert(wrongPositionHtml.includes(content.display.statuses.failed.icon));
assert(!wrongPositionHtml.includes("data-phase-result-check"), "failed tests have no drawn check");
const notFoundHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [{ id: "D1", passed: false, actual: -1 }] }));
assert(notFoundHtml.includes("data-index-not-found"), "returning -1 for a present value is shown as not found");
const invalidHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [{ id: "D1", passed: false, actual: { PRIVATE_OUTPUT_SENTINEL: 9 } }] }));
assert(invalidHtml.includes(content.display.invalid));
assert(!invalidHtml.includes("PRIVATE_OUTPUT_SENTINEL"), "non-numeric return values are never rendered raw");
assert.equal(typeof ImplementationHints, "function");
const review = renderToStaticMarkup(createElement(ParsonsBoard, { question: content.hints.parsonsQuestion, code: binarySearchCode }));
assert.equal((review.match(/data-parsons-line-id=/g) || []).length, 8);
assert(!review.includes("この順序で回答する"), "Hint Parsons has no scoring action");

// ---- 試しに実行（D1）は戻り値の位置を図で示す ----
assert.equal(freeDisplayCase, content.tests[0]);
const freeHtml = renderToStaticMarkup(createElement(FreeExecutionConsole, {
  result: { stdout: "", outputTruncated: false, returned: true, actual: 4, error: null }, busy: false,
}));
assert(freeHtml.includes("data-free-return"));
assert.equal((freeHtml.match(/data-array-bar=/g) || []).length, 7);
assert(freeHtml.includes('data-index-position="4"'));
const freeMismatchHtml = renderToStaticMarkup(createElement(FreeExecutionConsole, {
  result: { stdout: "", outputTruncated: false, returned: true, actual: 3, error: "mismatch" }, busy: false,
}));
assert(freeMismatchHtml.includes('data-array-highlight="3"'));
assert(freeMismatchHtml.includes('data-free-error-kind="mismatch"'));

(async () => {
  // runImplementationTests: 例外後も続行し、判定用の値はUI状態へ渡さない。
  const calls = [], progress = [];
  runner.runCourseMissionTests = async (code, tests) => {
    assert.equal(code, "learner code"); assert.equal(tests.length, 1); calls.push(tests[0].id);
    const test = tests[0];
    if (test.id === "J1") throw new Error("SyntaxError: HIDDEN_EXCEPTION");
    if (test.id === "J2") throw new Error("KeyError: HIDDEN_EXCEPTION");
    if (test.id === "J3") throw new Error(timeoutMessage);
    return { results: [{ ...test, passed: true, actual: "HIDDEN_VALUE" }], stdout: "HIDDEN_STDOUT", stderr: "HIDDEN_STDERR" };
  };
  const outcomes = await runImplementationTests("learner code", content.tests, next => progress.push(next));
  assert.deepEqual(calls, ["D1", "J1", "J2", "J3"], "Continue after case errors");
  assert.deepEqual(progress.map(next => next.length), [1, 2, 3, 4]);
  assert.equal(outcomes[1].error, "syntax"); assert.equal(outcomes[2].error, "runtime"); assert.equal(outcomes[3].error, "timeout");
  assert.equal(outcomes[1].errorLine, undefined, "label-only errors carry no line into outcomes");
  runner.runCourseMissionTests = async () => { throw new Error(runtimeTrace); };
  const tracedOutcomes = await runImplementationTests("learner code", content.tests.slice(0, 1), () => {});
  assert.equal(tracedOutcomes[0].error, "runtime"); assert.equal(tracedOutcomes[0].errorLine, 3, "test outcomes carry the learner line (#325)");
  assert(!JSON.stringify(outcomes.slice(1)).includes("HIDDEN"), "Judgement values never enter UI state");
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
    return { results: [{ ...tests[0], passed: true, actual: 4 }], stdout: "", stderr: "" };
  };
  const free = await runBinarySearchFreeCode("learner code");
  assert.equal(disposed, 1, "free execution rebuilds the worker");
  assert.equal(free.returned, true); assert.equal(free.error, null);
  runner.runCourseMissionTests = async () => { throw new Error(syntaxTrace); };
  const freeError = await runBinarySearchFreeCode("learner code");
  assert.equal(freeError.returned, false); assert.equal(freeError.error, "syntax"); assert.equal(freeError.errorLine, 2, "free execution carries the learner line (#325)");
  assert.equal(free.actual, 4);

  // 画面契約（#149）: エディタはライトテーマ＋枠と見出しで分離し、ダーク基調を持たない。ヒント2はフロー表示、結果の状態はアニメーションで現れる。
  const impl = (file) => fs.readFileSync(`${root}/binary-search/implementation/${file}`, "utf8");
  const previewSource = impl("BinarySearchImplementationPreview.tsx");
  assert.match(previewSource, /theme={LEARNING_EDITOR_THEME}/, "editor uses the shared learning theme");
  assert.match(previewSource, /beforeMount={setupLearningEditor}/, "editor setup is shared");
  assert.match(previewSource, /learningEditorTextCursor/, "editor text cursor is the shared dark I-beam");
  assert(!previewSource.includes("vs-dark"), "editor is light themed");
  const editorSetupSource = fs.readFileSync(`${root}/code/learningEditor.ts`, "utf8");
  assert.match(editorSetupSource, /base: "vs"/, "shared editor theme is based on the light vs theme");
  assert.match(editorSetupSource, /"editorCursor\.foreground": "#111827"/, "shared editor theme pins a dark caret colour");
  assert.match(previewSource, /border: `2px solid \$\{colors\.focus\}`/, "editor area is framed in the focus colour");
  assert(!impl("editor.tokens.ts").includes("#1e1e1e"), "editor tokens are light");
  const hintsSource = impl("ImplementationHints.tsx");
  assert.match(hintsSource, /content\.hints\.loopLabel/, "hint 2 shows the loop as a flow");
  assert.match(hintsSource, /min\(92vw, 760px\)/, "hint dialog width is capped for readability");
  const resultsSource = impl("ImplementationResults.tsx");
  assert.match(resultsSource, /ImplementationTestResults/, "results render through the shared list-first component (#325)");
  assert(!resultsSource.includes("DrawnCheck"), "rows carry the text mark only; the drawn check belongs to the completion view");
  const sharedResultsSource = fs.readFileSync(`${root}/implementation/ImplementationTestResults.tsx`, "utf8");
  assert.match(sharedResultsSource, /data-test-status/, "test status changes animate in");
  assert.match(sharedResultsSource, /component=\{motion\.span\} key=\{row\.statusKey\}/, "a status change mounts its own short animation");
  assert.match(sharedResultsSource, /initial=\{reducedMotion \? false/, "reduced motion skips the initial animation state");
  assert.match(sharedResultsSource, /duration: reducedMotion \? 0 : 0\.3/, "reduced motion removes the transition");
  assert.match(sharedResultsSource, /statusKey !== "passed"/, "passed display figures start collapsed");
  assert.match(previewSource, /ResultConfetti/, "all-pass fires the phase confetti");
  assert.match(previewSource, /data-completion-banner/, "all-pass keeps the workspace and overlays the achievement banner (#305)");
  assert.match(previewSource, /DrawnCheck size=\{44\}/, "the completion banner leads with a drawn check");
  assert.match(previewSource, /onShowFinalResult/, "the final result is reached by the learner's button, not automatically (#305)");
  assert.match(previewSource, /answerCorrect/, "each newly passed test plays the small check sound (#305)");
  // プレビュー登録（視覚デバッグの接続は Issue #293 で行うため、ここでは登録だけを確認する）。
  const pageSource = fs.readFileSync(path.resolve(root, "../../app/learning-preview/[contentId]/page.tsx"), "utf8");
  assert.match(pageSource, /binary-search-implementation/, "preview route is registered");
  assert.match(pageSource, /BinarySearchImplementationPreview/, "preview component is wired");
  console.log("Binary-search implementation: four cases verified against indexOf semantics and CPython reference, typical-mistake mutations (lo = mid stalls on the transfer and absent cases, hi = mid stalls on the absent case, returning None instead of -1, returning the value instead of its position), canonical skeleton and Parsons reuse, hint gating, position display (figure plus number, -1 as not found), free-execution rendering, hidden-case redaction, all-pass gate and runner progress/error/cancellation checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
