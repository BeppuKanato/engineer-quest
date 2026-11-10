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
const { bfsImplementationContent: content } = load(`${root}/bfs/implementation/implementation.content.ts`);
const { bfsCode } = load(`${root}/bfs/code-mapping/bfsCode.ts`);
const { bfsConsolidationContent } = load(`${root}/bfs/consolidation/consolidation.content.ts`);
const { ImplementationResults } = load(`${root}/bfs/implementation/ImplementationResults.tsx`);
const { ParsonsBoard } = load(`${root}/bfs/consolidation/ParsonsBoard.tsx`);
const { recordHintUsage, resultKinds, classifyExecutionError, runningMessage, distanceEntries, allTestsPassed, runImplementationTests } = load(`${root}/bfs/implementation/implementation.ts`);
const runner = load(path.resolve(root, "../../lib/pyodideRunner.ts"));
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const plain = value => JSON.parse(JSON.stringify(value));
assert.equal(content.id, "bfs-implementation"); assert.equal(content.phase, 7); assert.equal(content.version, 1);
assert.match(content.template, /^from collections import deque\ndef bfs_distances\(graph, start\):\n/u);
assert.match(content.template, /\n +pass$/u);
assert.deepEqual(plain(content.hints.tokens), ["deque", "queue", "distances", "graph", "start", "node", "neighbor", "popleft()", "append()", "while", "for", "if", "not in", "return"]);
assert.equal(new Set(content.hints.tokens).size, 14);
const referenceCode = bfsCode.lines.map(line => line.text).join("\n");
assert.deepEqual(plain(content.hints.skeletonLineIds), ["while-queue", "for-neighbor", "if-undiscovered"]);
content.hints.skeletonLines.forEach((line, index) => assert.equal(line, bfsCode.lines.find(line => line.id === content.hints.skeletonLineIds[index])));
assert.equal(content.hints.labels.length, 4);
assert.equal(content.hints.flow.length, 4);
for (const file of fs.readdirSync(`${root}/bfs/implementation`).filter(file => /\.tsx?$/u.test(file))) {
  assert(!/codeDiff|diffLines|from ["']diff["']|diffTitle|referenceCode/u.test(fs.readFileSync(`${root}/bfs/implementation/${file}`, "utf8")), "No diff hint dependency remains in the feature");
}
assert.equal(bfsCode.id, "bfs-distances-deque"); assert.equal(bfsCode.version, 1);
assert.equal(content.hints.parsonsQuestion, bfsConsolidationContent.questions.find(question => question.kind === "parsons"));
assert.deepEqual(plain(content.tests.map(test => test.id)), ["D1", "D2", "J1", "J2", "J3"]);
assert.deepEqual(plain(content.tests.map(test => test.visibility)), ["display", "display", "judgement", "judgement", "judgement"]);
// 教材の期待値・既存BFSヘルパーを使わず、隣接リストから独立に再計算。
for (const test of content.tests) {
  assert.equal(test.functionName, "bfs_distances"); assert.equal(test.args.length, 2);
  const [graph, start] = plain(test.args);
  const queue = [start], distances = { [start]: 0 };
  for (let index = 0; index < queue.length; index++) {
    const node = queue[index];
    for (const neighbor of graph[node] ?? []) if (!Object.hasOwn(distances, neighbor)) {
      distances[neighbor] = distances[node] + 1; queue.push(neighbor);
    }
  }
  assert.deepEqual(distances, plain(test.expected), test.id);
}
assert.deepEqual(plain(content.tests[0].args), [{ A: ["B", "C"], B: ["A", "D", "E"], C: ["A", "E"], D: ["B", "F"], E: ["B", "C", "F"], F: ["D", "E"] }, "A"]);
assert.deepEqual(plain(content.tests[1].args), [{ G: ["H", "I"], H: ["G", "J"], I: ["G", "J", "K"], J: ["H", "I", "L"], K: ["I", "L"], L: ["J", "K"] }, "G"]);
assert.deepEqual(plain(content.tests[2].args), [{ ...plain(content.tests[0].args[0]), Z: [] }, "A"]);
assert.deepEqual(plain(content.tests[3].args), [{ A: [] }, "A"]);
assert.deepEqual(plain(content.tests[4].args), [{ A: ["B"] }, "A"]);
const python = spawnSync(process.env.PYTHON || "python3", ["-c", `import ast,json,sys\ndata=json.load(sys.stdin)\nast.parse(data['template'])\nns={}\nexec(data['code'],ns)\nfor test in data['tests']:\n assert ns[test['functionName']](*test['args']) == test['expected'], test['id']\n`], {
  input: JSON.stringify({ template: content.template, code: referenceCode, tests: content.tests }), encoding: "utf8",
});
assert.equal(python.status, 0, python.stderr);
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
const { bfsEditorText: editorText } = load(`${root}/bfs/implementation/editor.content.ts`);
const { FreeExecutionConsole } = load(`${root}/bfs/implementation/FreeExecutionConsole.tsx`);
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
const errorLinePreviewSource = fs.readFileSync(`${root}/bfs/implementation/BfsImplementationPreview.tsx`, "utf8");
assert.match(errorLinePreviewSource, /useErrorLineDecoration/, "preview highlights the error line in the editor (#325)");
assert.match(errorLinePreviewSource, /setErrorLine\(undefined\)/, "changing code or rerunning clears the error line");
assert(fs.readFileSync(path.resolve(root, "../../app/globals.css"), "utf8").includes(".eq-error-line-highlight"), "the error line highlight has a global style");

assert.deepEqual(plain(resultKinds([{ id: "D1", passed: false }, { id: "D2", passed: false, error: "timeout" }])), ["timeout", "mismatch"]);
for (let done = 0; done < 5; done++) assert.equal(runningMessage(done, 5), `テストを実行中です（${done + 1}/5件目）`);
const entries = distanceEntries({ A: 0, B: 1, C: 1 }, { A: 0, B: 99, Z: 3 });
assert.deepEqual(plain(entries.map(entry => [entry.node, entry.state])), [["A", "same"], ["B", "different"], ["C", "missing"], ["Z", "extra"]]);
const { searchGraph } = load(`${root}/graphs/searchGraph.ts`);
const { transferGraph } = load(`${root}/bfs/consolidation/consolidation.graphs.ts`);
assert.equal(content.displayScenes[0].graph, searchGraph); assert.equal(content.displayScenes[1].graph, transferGraph);
for (const scene of content.displayScenes) {
  const test = content.tests.find(test => test.id === scene.testId), graph = scene.graph;
  assert.equal(scene.start, test.args[1]);
  for (const node of graph.nodes) {
    const neighbors = graph.edges.flatMap(edge => edge.from === node.id ? [edge.to] : edge.to === node.id ? [edge.from] : []);
    assert.deepEqual(plain(neighbors), plain(test.args[0][node.id]));
  }
}
// ---- 入力量レベル（Issue #328）: テンプレート構成・プレースホルダ・下書きキー・セレクタ ----
const {
  implementationInputLevels, implementationInputLevelText, implementationDraftKey,
  countImplementationPlaceholders, isImplementationPlaceholderLine,
} = load(`${root}/implementation/inputLevel.ts`);
const { ImplementationLevelSelector } = load(`${root}/implementation/ImplementationLevelSelector.tsx`);
assert.deepEqual(plain(implementationInputLevels), ["full", "skeleton", "fill-in"]);
assert.deepEqual(Object.keys(content.templates).sort(), ["fill-in", "full", "skeleton"]);
assert.equal(content.template, content.templates.full, "the legacy template is the full level");
assert.equal(countImplementationPlaceholders(content.templates.full), 0);
assert.equal(countImplementationPlaceholders(content.templates.skeleton), 5, "skeleton leaves every substantive line as a placeholder");
assert.equal(countImplementationPlaceholders(content.templates["fill-in"]), 2, "fill-in leaves only the key lines as placeholders");
for (const level of implementationInputLevels) assert(content.templates[level].startsWith("from collections import deque"), `${level} template keeps the contract import`);
assert.equal(implementationInputLevelText.levels.full.label, "全部書く");
assert.equal(implementationInputLevelText.levels.skeleton.label, "骨格から書く");
assert.equal(implementationInputLevelText.levels["fill-in"].label, "穴埋めで書く");
assert.equal(implementationDraftKey("base-key", "full"), "base-key", "the full level keeps the legacy draft key");
assert.equal(implementationDraftKey("base-key", "skeleton"), "base-key:level:skeleton");
assert.equal(implementationDraftKey("base-key", "fill-in"), "base-key:level:fill-in");
const canonicalById = new Map(bfsCode.lines.map(line => [line.id, line.text]));
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
const skeletonSolved = solveTemplate(content.templates.skeleton, [
  ["initialize-distances"], ["initialize-queue"], ["dequeue-node"], ["assign-distance"], ["enqueue-neighbor"],
]);
const fillInSolved = solveTemplate(content.templates["fill-in"], [
  ["assign-distance"], ["enqueue-neighbor"],
]);
assert.equal(skeletonSolved, referenceCode, "skeleton frame + canonical lines = canonical code");
assert.equal(fillInSolved, referenceCode, "fill-in frame + canonical lines = canonical code");
const levelPython = spawnSync(process.env.PYTHON || "python3", ["-c", `
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
            got = ns[test["functionName"]](*test["args"])
            out[test["id"]] = got == {key: value for key, value in test["expected"].items()}
        except Exception:
            out[test["id"]] = False
    return out
print(json.dumps({name: run(code) for name, code in data["variants"].items()}))
`], {
  input: JSON.stringify({
    tests: plain(content.tests),
    variants: {
      skeletonUntouched: content.templates.skeleton, fillInUntouched: content.templates["fill-in"],
      skeletonSolved, fillInSolved,
    },
  }),
  encoding: "utf8",
});
assert.equal(levelPython.status, 0, levelPython.stderr);
const levelResults = JSON.parse(levelPython.stdout);
const allFalse = { D1: false, D2: false, J1: false, J2: false, J3: false };
const allTrue = { D1: true, D2: true, J1: true, J2: true, J3: true };
assert.deepEqual(levelResults.skeletonUntouched, allFalse, "an untouched skeleton template must fail every test (placeholders remain)");
// 穴埋め未編集は完了にならない。出発点だけのグラフ（J2）はプレースホルダ行に到達しないため通るが、全テスト通過にはならない。
assert.deepEqual(levelResults.fillInUntouched, { D1: false, D2: false, J1: false, J2: true, J3: false }, "an untouched fill-in template must not pass all tests (placeholders remain)");
assert.deepEqual(levelResults.skeletonSolved, allTrue, "the canonical solution passes from the skeleton frame");
assert.deepEqual(levelResults.fillInSolved, allTrue, "the canonical solution passes from the fill-in frame");
const selectorHtml = renderToStaticMarkup(createElement(ImplementationLevelSelector, { level: "skeleton", onChange: () => {} }));
assert(selectorHtml.includes("data-input-level-selector"));
assert.equal((selectorHtml.match(/data-input-level-option=/g) || []).length, 3, "the selector offers all three levels");
for (const label of ["全部書く", "骨格から書く", "穴埋めで書く"]) assert(selectorHtml.includes(label), `selector shows ${label}`);
assert.equal((selectorHtml.match(/aria-pressed="true"/g) || []).length, 1, "exactly the selected level is pressed");

const passed = content.tests.map(test => ({ id: test.id, passed: true }));
assert(allTestsPassed(content.tests, passed)); assert(!allTestsPassed(content.tests, passed.slice(1)));
assert(!allTestsPassed(content.tests, passed.map(test => test.id === "J3" ? { ...test, passed: false } : test)));
assert(!allTestsPassed([], []));
const hiddenOutcomes = content.tests.map(test => ({ id: test.id, passed: false, actual: { PRIVATE_OUTPUT_SENTINEL: 9 } }));
const html = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: hiddenOutcomes }));
assert.equal((html.match(/PRIVATE_OUTPUT_SENTINEL/g) || []).length, 2, "Only two display cases expose actual output");
for (const id of ["J1", "J2", "J3"]) {
  const item = html.match(new RegExp(`data-test-id="${id}"[\\s\\S]*?</li>`))[0];
  assert(!/入力|期待値|実際の出力|PRIVATE_OUTPUT_SENTINEL/u.test(item));
}
const { ImplementationHints } = load(`${root}/bfs/implementation/ImplementationHints.tsx`);
// Dialog portals are tested in the browser; verify the shared board has no scoring action here.
assert.equal(typeof ImplementationHints, "function");
const unchangedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [] }));
assert(!unchangedHtml.includes("data-error-kind"));
assert(unchangedHtml.includes(content.display.statuses.unexecuted.icon));
assert.equal((unchangedHtml.match(/<svg/g) || []).length, 2);
assert.equal((unchangedHtml.match(/data-node-id=/g) || []).length, 12);
for (const test of content.tests) assert(!unchangedHtml.includes(`>${test.id} `), "Internal IDs stay out of visible headings");
const mismatchedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: [{ id: "D1", passed: false, actual: { A: 9, Z: 1 } }] }));
for (const state of ["different", "missing", "extra"]) assert(mismatchedHtml.includes(`data-distance-state="${state}"`));
assert(mismatchedHtml.includes(content.display.statuses.failed.icon));
assert(mismatchedHtml.includes("期待と異なる")); assert(mismatchedHtml.includes("項目なし")); assert(mismatchedHtml.includes("余分な項目"));
// 通過したテストには描き込まれるチェックが1件ずつ付く（#180）。未実施・未通過には付かない。
const passedHtml = renderToStaticMarkup(createElement(ImplementationResults, { outcomes: content.tests.map(test => ({ id: test.id, passed: true, actual: test.expected })) }));
assert(!passedHtml.includes("data-phase-result-check"), "result rows carry the text mark only; the drawn check belongs to the completion view");
assert.equal(passedHtml.split(content.display.statuses.passed.icon).length - 1, content.tests.length, "each passed test shows its text mark in the list");
assert(!(unchangedHtml.includes("data-phase-result-check")), "unexecuted tests have no drawn check");
assert(!(mismatchedHtml.includes("data-phase-result-check")), "failed tests have no drawn check");
const review = renderToStaticMarkup(createElement(ParsonsBoard, { question: content.hints.parsonsQuestion, code: bfsCode }));
assert.equal((review.match(/data-parsons-line-id=/g) || []).length, 11);
assert(!review.includes("この順序で回答する"), "Hint Parsons has no scoring action");
(async () => {
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
  assert.equal(outcomes[1].errorLine, undefined, "label-only errors carry no line into outcomes");
  runner.runCourseMissionTests = async () => { throw new Error(runtimeTrace); };
  const tracedOutcomes = await runImplementationTests("learner code", content.tests.slice(0, 1), () => {});
  assert.equal(tracedOutcomes[0].error, "runtime"); assert.equal(tracedOutcomes[0].errorLine, 3, "test outcomes carry the learner line (#325)");
  assert(!JSON.stringify(outcomes.slice(2)).includes("HIDDEN"), "Judgement values never enter UI state");
  assert(!JSON.stringify(outcomes).includes("HIDDEN_EXCEPTION"));
  assert.equal(progress[0].length, 1, "Earlier progress snapshots stay unchanged");
  let active = true;
  const cancelled = await runImplementationTests("learner code", content.tests, () => { active = false; }, () => active);
  assert.equal(cancelled.length, 1, "Unmounting stops subsequent case requests");
  // 画面契約（#149）: エディタはライトテーマ＋枠と見出しで分離し、ダーク基調を持たない。ヒント2はフロー表示、結果の状態はアニメーションで現れる。
  const impl = (file) => fs.readFileSync(`${root}/bfs/implementation/${file}`, "utf8");
  const previewSource = impl("BfsImplementationPreview.tsx");
  assert.match(previewSource, /theme={LEARNING_EDITOR_THEME}/, "editor uses the shared learning theme");
  assert.match(previewSource, /beforeMount={setupLearningEditor}/, "editor setup is shared");
  assert.match(previewSource, /learningEditorTextCursor/, "editor text cursor is the shared dark I-beam");
  assert(!previewSource.includes("vs-dark"), "editor is light themed");
  const editorSetupSource = fs.readFileSync(`${root}/code/learningEditor.ts`, "utf8");
  assert.match(editorSetupSource, /base: "vs"/, "shared editor theme is based on the light vs theme");
  assert.match(editorSetupSource, /"editorCursor\.foreground": "#111827"/, "shared editor theme pins a dark caret colour");
  assert.match(previewSource, /border: `2px solid \$\{colors\.focus\}`/, "editor area is framed in the focus colour");
  assert(!/Implementation(Results|Hints) dark/.test(previewSource), "no dark variants remain");
  assert(!impl("editor.tokens.ts").includes("#1e1e1e"), "editor tokens are light");
  const hintsSource = impl("ImplementationHints.tsx");
  assert.match(hintsSource, /キューが空になるまでくり返し/, "hint 2 shows the loop as a flow");
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
  // 画面契約（#180→#325で改訂）: 行の通過印はテキスト（✓）に一本化し、全通過時は完了表示で紙吹雪と大きなチェックで祝う。
  assert.match(previewSource, /ResultConfetti/, "all-pass fires the phase confetti");
  assert.match(previewSource, /data-completion-banner/, "all-pass keeps the workspace and overlays the achievement banner (#305)");
  assert.match(previewSource, /DrawnCheck size=\{44\}/, "the completion banner leads with a drawn check");
  assert.match(previewSource, /onShowFinalResult/, "the final result is reached by the learner's button, not automatically (#305)");
  assert.match(previewSource, /answerCorrect/, "each newly passed test plays the small check sound (#305)");
  assert.match(previewSource, /useImplementationInputLevel/, "phase 7 manages code per input level (#328)");
  assert.match(previewSource, /ImplementationLevelSelector/, "phase 7 renders the shared level selector (#328)");
  assert.match(previewSource, /implementation_level_select/, "level changes are recorded in the learning log (#328)");
  assert.match(previewSource, /inputLevel: level/, "the completion summary carries the level in effect (#328)");
  const unitSource = fs.readFileSync(`${root}/unit/LearningUnitPreview.tsx`, "utf8");
  assert.match(unitSource, /codeDraftBaseKey=\{codeDraftBaseKey\}/, "the unit flow hands the per-level draft base key to phase 7 (#328)");
  const traceText = fs.readFileSync(`${root}/bfs/trace/trace.content.ts`, "utf8");
  assert.match(traceText, /button: "グラフで動きを見る"/, "trace button says what it does");
  console.log("BFS implementation: independent BFS on five cases, canonical skeleton, hint-1 tokens, four staged hints, mini graphs and distance differences, timeout classification, hidden-case redaction, all-pass gate and runner progress/error/cancellation checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
