const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const react = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

let slots = [], cursor = 0, effects = [];
const hooks = {
  ...react,
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], update => { slots[index] = typeof update === "function" ? update(slots[index]) : update; }];
  },
  useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
  useEffect(effect) { effects.push(effect); },
  useMemo(factory) { return factory(); },
  useCallback(callback) { return callback; },
};

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
    if (filename.endsWith("LearningUnitPreview.tsx")) {
      if (name === "react") return hooks;
      if (name === "../instrumentation/useLearningVisit") return { useLearningVisit() {} };
    }
    if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
    const base = name.startsWith("@/") ? path.resolve(__dirname, "../src", name.slice(2)) : path.resolve(path.dirname(filename), name);
    return load([base + ".ts", base + ".tsx"].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}

const root = path.resolve(__dirname, "../src/features/learning");
const { LearningUnitPreview } = load(root + "/unit/LearningUnitPreview.tsx");
const { DfsUnitPreview } = load(root + "/units/dfs/unit/DfsUnitPreview.tsx");
const { BfsUnitPreview } = load(root + "/units/bfs/unit/BfsUnitPreview.tsx");
const { PhaseBridgeScreen } = load(root + "/components/results/PhaseBridgeScreen.tsx");
const { UnitResultScreen, UnitFinalResult } = load(root + "/components/results/UnitResultScreens.tsx");
const plain = value => JSON.parse(JSON.stringify(value));
const elements = value => Array.isArray(value) ? value.flatMap(elements)
  : value && typeof value === "object" && value.props ? [value, ...elements(value.props.children)] : [];

const dfs = DfsUnitPreview();
assert.equal(dfs.type, LearningUnitPreview);
assert.equal(dfs.props.onPhaseComplete, undefined, "The preview has no progress persistence");
const { unit } = dfs.props;
assert.equal(unit.title, "深さ優先探索（DFS）");
const ids = ["dfs-motivation", "dfs-execution", "dfs-check", "dfs-code-mapping", "dfs-code-check", "dfs-consolidation", "dfs-implementation"];
assert.deepEqual(plain(unit.phases.map(phase => phase.id)), ids);
assert.deepEqual(plain(unit.phases.map(phase => phase.formalName)),
  ["導入", "動きの説明", "動きの確認問題", "動きとコードの対応", "コードの確認問題", "応用問題", "自分で実装"]);
assert.deepEqual(plain(unit.phases.map(phase => phase.transitionOut)),
  ["bridge", "bridge", "result", "bridge", "result", "result-in-phase", "final"]);
assert.deepEqual(Object.keys(unit.views), ids);
assert(unit.phases.slice(1).every(phase => phase.bridge));

let tree;
function draw(entry = dfs) {
  cursor = 0;
  effects = [];
  tree = elements(entry.type(entry.props));
  effects.forEach(effect => effect());
}
const find = type => tree.find(item => item.type === type);
const phaseView = index => find(unit.views[ids[index]]);
const nav = index => tree.find(item => item.props.children?.[0] === index + 1 && item.props.onClick);
function currentPhase(index) {
  assert.equal(nav(index).props["aria-current"], "step");
  assert.equal(phaseView(index).props.embedded, true);
  assert.equal(phaseView(index).props.active, true);
  assert(!find(PhaseBridgeScreen) && !find(UnitResultScreen) && !find(UnitFinalResult));
}
function bridge(index) {
  const screen = find(PhaseBridgeScreen);
  assert.equal(screen.props.phase.id, ids[index]);
  assert.equal(screen.props.total, 7);
  screen.props.onProceed();
  draw();
  currentPhase(index);
}

draw();
currentPhase(0);
assert.equal(nav(1).props.disabled, true);
phaseView(0).props.onComplete();
draw();
bridge(1);
assert.equal(phaseView(0).props.active, false);
phaseView(1).props.onComplete();
draw();
bridge(2);

for (const [index, summary] of [[2, { firstAttemptCorrect: 0, totalQuestions: 2 }], [4, { firstAttemptCorrect: 1, totalQuestions: 2 }]]) {
  phaseView(index).props.onComplete(summary);
  draw();
  const screen = find(UnitResultScreen);
  assert.equal(screen.props.phase.id, ids[index]);
  assert.equal(screen.props.summary, summary);
  const html = renderToStaticMarkup(react.createElement(UnitResultScreen, screen.props));
  assert(html.includes("初回の正解") && html.includes("基本例の訪問順"));
  assert(!html.includes("全2問に正解しました"));
  screen.props.onNext();
  draw();
  bridge(index + 1);
  if (index === 2) {
    phaseView(3).props.onComplete();
    draw();
    bridge(4);
  }
}

phaseView(5).props.onComplete({ firstAttemptCorrect: 3, totalQuestions: 5 });
draw();
currentPhase(5);
phaseView(5).props.onNext();
draw();
bridge(6);

assert(!tree.some(item => item.props.children === "単元リザルト"));
phaseView(6).props.onComplete({ testRuns: 2, hintUsage: [1, 0, 0, 0] });
draw();
currentPhase(6);
phaseView(6).props.onShowFinalResult();
draw();
const final = find(UnitFinalResult);
assert.equal(final.props.phases, unit.phases);
assert.deepEqual(plain(final.props.summaries), {
  2: { firstAttemptCorrect: 0, totalQuestions: 2 },
  4: { firstAttemptCorrect: 1, totalQuestions: 2 },
  5: { firstAttemptCorrect: 3, totalQuestions: 5 },
  6: { testRuns: 2, hintUsage: [1, 0, 0, 0] },
});
const finalHtml = renderToStaticMarkup(react.createElement(UnitFinalResult, final.props));
assert(finalHtml.includes("深さ優先探索（DFS）マスター！"));
assert(!finalHtml.includes("幅優先探索"));
assert.equal((finalHtml.match(/>復習する<\/button>/g) || []).length, 7);

final.props.onReviewPhase(1);
draw();
currentPhase(1);
assert.equal(phaseView(6).props.active, false, "The editor stays mounted during review");
nav(6).props.onClick();
draw();
currentPhase(6);

slots = [];
const bfs = BfsUnitPreview({ initialPhaseIndex: 3, initialFurthestIndex: 4, initialCompletedPhases: ["bfs-motivation"] });
assert.equal(bfs.type, LearningUnitPreview);
draw(bfs);
assert.equal(nav(3).props["aria-current"], "step");
assert.equal(nav(4).props.disabled, false);
assert.equal(nav(5).props.disabled, true);
assert(!find(PhaseBridgeScreen), "Resume enters the selected stage directly");
nav(0).props.onClick();
draw(bfs);
assert.equal(nav(0).props["aria-current"], "step");
assert.equal(find(bfs.props.unit.views["bfs-code-mapping"]).props.active, true, "BFS standalone background playback is preserved");

const page = fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8");
assert.match(page, /if \(contentId === "dfs-unit"\) return <DfsUnitPreview \/>/u);
const learningScreen = fs.readFileSync(root + "/screens/LearningScreen.tsx", "utf8");
assert.match(learningScreen, /unit.kind === "dfs" \? <DfsUnitPreview \{\.\.\.unitPreviewProps\}/u);
const overview = fs.readFileSync(root + "/screens/UnitOverview.tsx", "utf8");
assert.match(overview, /next === null && <Button[^>]+href=\{learnUrl\(courseId\)\}[^>]*>単元の結果を見る/u);
async function verifyBfsSaving() {
  slots = [];
  let settle, saved = 0;
  const logged = [];
  const started = [];
  const entry = BfsUnitPreview({
    initialPhaseIndex: 2,
    onPhaseComplete(key) {
      assert.equal(key, "bfs-check");
      saved++;
      return new Promise((resolve, reject) => { settle = { resolve, reject }; });
    },
    onLearningEvent: event => logged.push(event),
    onCheckPhaseCompleted: (...args) => started.push(args),
  });
  const Check = entry.props.unit.views["bfs-check"];
  draw(entry);
  find(Check).props.onComplete({ firstAttemptCorrect: 1, totalQuestions: 2 });
  draw(entry);
  assert(find(UnitResultScreen), "BFS shows the result while saving");
  assert(tree.some(item => item.props.children === "進捗を保存しています…"));
  assert.equal(started.length, 0);
  settle.reject(new Error("offline"));
  await new Promise(setImmediate);
  draw(entry);
  const error = tree.find(item => item.props.severity === "error");
  assert(error, "A failed save shows the retry alert");
  const retry = error.props.action;
  retry.props.onClick();
  draw(entry);
  assert(find(UnitResultScreen), "A retry keeps the result visible");
  settle.resolve();
  await new Promise(setImmediate);
  draw(entry);
  assert.equal(saved, 2);
  assert.deepEqual(started, [["bfs-check", "bfs-code-mapping"]]);
  assert.equal(logged.filter(event => event.eventType === "phase_complete").length, 1);
  assert(!tree.some(item => item.props.severity === "error"));
}

async function verifyDfsAppSaving() {
  slots = [];
  let resolveSave;
  const saved = [];
  const entry = DfsUnitPreview({
    embedded: true, initialPhaseIndex: 5,
    onPhaseComplete(key, summary) {
      saved.push([key, summary]);
      return new Promise(resolve => { resolveSave = resolve; });
    },
    renderPhaseAchievements: key => "achievement:" + key,
  });
  draw(entry);
  const application = phaseView(5);
  assert.equal(application.props.achievements, "achievement:dfs-consolidation");
  application.props.onComplete({ firstAttemptCorrect: 5, totalQuestions: 5 });
  draw(entry);
  assert.equal(phaseView(5).props.advancePending, true);
  phaseView(5).props.onNext();
  draw(entry);
  assert(!find(PhaseBridgeScreen), "DFS waits for the application stage to save");
  resolveSave();
  await new Promise(setImmediate);
  draw(entry);
  phaseView(5).props.onNext();
  draw(entry);
  find(PhaseBridgeScreen).props.onProceed();
  draw(entry);
  phaseView(6).props.onComplete({ testRuns: 1, hintUsage: [0, 0, 0, 0] });
  draw(entry);
  phaseView(6).props.onShowFinalResult();
  draw(entry);
  assert(!find(UnitFinalResult), "DFS waits for the final phase to save");
  resolveSave();
  await new Promise(setImmediate);
  draw(entry);
  phaseView(6).props.onShowFinalResult();
  draw(entry);
  assert(find(UnitFinalResult));
  assert.deepEqual(saved.map(([key]) => key), ["dfs-consolidation", "dfs-implementation"]);
}

verifyBfsSaving().then(verifyDfsAppSaving).then(() => {
  console.log("DFS unit verified: seven stages, bridges, results, review, app save gates, and BFS resume/save compatibility.");
}).catch(error => { console.error(error); process.exitCode = 1; });
