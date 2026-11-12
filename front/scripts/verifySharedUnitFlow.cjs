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
const { PhaseBridgeScreen } = load(root + "/components/results/PhaseBridgeScreen.tsx");
const { UnitResultScreen, UnitFinalResult } = load(root + "/components/results/UnitResultScreens.tsx");
const elements = value => Array.isArray(value) ? value.flatMap(elements)
  : value && typeof value === "object" && value.props ? [value, ...elements(value.props.children)] : [];


const cases = [
  ["bfs", "Bfs", "bfs"], ["dfs", "Dfs", "dfs"],
  ["bubble-sort", "BubbleSort", "bubbleSort"],
  ["binary-search", "BinarySearch", "binarySearch"],
];
let tree;
function draw(entry) {
  cursor = 0; effects = [];
  tree = elements(entry.type(entry.props));
  effects.forEach(effect => effect());
}
const find = type => tree.find(item => item.type === type);
const nav = index => tree.find(item => item.props.children?.[0] === index + 1 && item.props.onClick);
async function verify([slug, name]) {
  const Preview = load(`${root}/${slug}/unit/${name}UnitPreview.tsx`)[`${name}UnitPreview`];
  slots = [];
  const entry = Preview();
  assert.equal(entry.type, LearningUnitPreview, `${slug}: shared controller`);
  const { unit } = entry.props;
  const view = index => find(unit.views[unit.phases[index].id]);
  assert.equal(unit.phases.length, 7);
  draw(entry);
  for (let index = 0; index < 7; index++) {
    assert.equal(nav(index).props["aria-current"], "step");
    assert(view(index), `${slug}: phase ${index + 1} mounted`);
    assert(view(index).props.embedded);
    view(index).props.onComplete({ totalQuestions: 2, firstAttemptCorrect: 1, testRuns: 2 });
    draw(entry);
    if (index === 6) { view(index).props.onShowFinalResult(); draw(entry); break; }
    if ([2,4].includes(index)) {
      const result = find(UnitResultScreen);
      assert.equal(result.props.figure, unit.resultFigure);
      assert.equal(result.props.summary.firstAttemptCorrect, 1);
      result.props.onNext(); draw(entry);
    } else if (index === 5) { view(index).props.onNext(); draw(entry); }
    const bridge = find(PhaseBridgeScreen);
    assert(bridge, `${slug}: completion uses a bridge`);
    assert.equal(bridge.props.phase.id, unit.phases[index + 1].id);
    bridge.props.onProceed(); draw(entry);
  }
  const final = find(UnitFinalResult);
  assert(final, `${slug}: explicit final-result action`);
  const html = renderToStaticMarkup(react.createElement(UnitFinalResult, final.props));
  assert(html.includes(unit.finalResult.title));
  assert.equal((html.match(/>復習する<\/button>/g) || []).length, 7);
  final.props.onReviewPhase(0); draw(entry);
  assert.equal(unit.phases.filter((_, i) => view(i)).length, 7, `${slug}: previously opened phases remain mounted`);
  assert.equal(view(6).props.active, !!unit.keepHiddenPlayersRunning, `${slug}: hidden-player policy is preserved`);
  nav(6).props.onClick(); draw(entry);
  assert.equal(nav(6).props["aria-current"], "step");

  // Failure/retry must keep the result and emit completion only once.
  slots = [];
  let settle, saveCount = 0;
  const events = [], generated = [];
  const saving = Preview({ initialPhaseIndex: 2,
    onPhaseComplete() { saveCount++; return new Promise((resolve,reject) => { settle = {resolve,reject}; }); },
    onLearningEvent: event => events.push(event),
    onCheckPhaseCompleted: (...args) => generated.push(args),
  });
  draw(saving); view(2).props.onComplete({ totalQuestions:2,firstAttemptCorrect:1 }); draw(saving);
  assert(find(UnitResultScreen), `${slug}: result appears while saving`);
  assert.equal(generated.length, 0);
  settle.reject(new Error("offline")); await new Promise(setImmediate); draw(saving);
  const error = tree.find(item => item.props.severity === "error"); assert(error);
  error.props.action.props.onClick(); draw(saving);
  assert(find(UnitResultScreen));
  settle.resolve(); await new Promise(setImmediate); draw(saving);
  assert.equal(saveCount, 2);
  assert.equal(events.filter(e=>e.eventType === "phase_complete").length,1);
  assert.deepEqual(generated, [[unit.phases[2].id, unit.phases[3].id]]);

  // Application-stage navigation cannot race persistence; feedback follows the saved result.
  slots = [];
  let resolveSave;
  const application = Preview({ initialPhaseIndex:5,
    onPhaseComplete: () => new Promise(resolve=>{resolveSave=resolve;}),
    feedbackEnabled:true,
    renderPhaseFeedbackScreen: (key,next,actions) => react.createElement("section",{"data-test-feedback":key,actions}),
  });
  draw(application);
  view(5).props.onComplete({totalQuestions:2,firstAttemptCorrect:1});draw(application);
  view(5).props.onNext();draw(application);
  assert(!find(PhaseBridgeScreen));
  assert(!tree.some(item=>item.props["data-test-feedback"]));
  resolveSave();await new Promise(setImmediate);draw(application);
  view(5).props.onNext();draw(application);
  const feedback=tree.find(item=>item.props["data-test-feedback"]);
  assert.equal(feedback.props["data-test-feedback"],unit.phases[5].id);
  feedback.props.actions.goNext();draw(application);
  assert.equal(find(PhaseBridgeScreen).props.phase.id,unit.phases[6].id);
  console.log(`${slug}: shared flow, review/mount retention, save retry, one completion, feedback after persistence verified`);
}
(async()=>{for(const entry of cases) await verify(entry);})().catch(error=>{console.error(error);process.exitCode=1;});
