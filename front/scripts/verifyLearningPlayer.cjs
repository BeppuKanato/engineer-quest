// DB / API / ブラウザに依存しない再生と教材参照の契約チェック。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const cache = new Map();
function load(relativePath) {
  const filename = path.resolve(__dirname, relativePath);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require: (name) => load(path.resolve(path.dirname(filename), `${name}.ts`)),
  }, { filename });
  return exports;
}

const { advancePlayback } = load("../src/features/learning/player/playback.ts");
const { defineLearningContent } = load("../src/features/learning/player/content.types.ts");
const { validateGraphCanvas } = load("../src/features/learning/player/graphCanvas.types.ts");
const { stepPreviewContent, scenePreviewContent } = load("../src/features/learning/player/content/previewContent.ts");
const equalState = (actual, expected) => assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);

let state = advancePlayback({ index: 0, playing: false }, { type: "toggle" }, 3);
equalState(state, { index: 0, playing: true });
state = advancePlayback(state, { type: "tick" }, 3);
equalState(state, { index: 1, playing: true });
state = advancePlayback(state, { type: "tick" }, 3);
equalState(state, { index: 2, playing: false });
state = advancePlayback(state, { type: "toggle" }, 3);
equalState(state, { index: 0, playing: true });
equalState(advancePlayback(state, { type: "toggle" }, 3), { index: 0, playing: false });
for (const [index, expected] of [[-10, 0], [99, 2], [1.9, 1], [NaN, 0]]) {
  equalState(advancePlayback(state, { type: "seek", index }, 3), { index: expected, playing: false });
}
equalState(advancePlayback({ index: 1, playing: false }, { type: "tick" }, 3), { index: 1, playing: false });
equalState(advancePlayback({ index: 0, playing: false }, { type: "toggle" }, 1), { index: 0, playing: false });

for (const content of [stepPreviewContent, scenePreviewContent]) {
  defineLearningContent(content, validateGraphCanvas);
  // シーク順に関係なく、1ステップだけで対象・内部状態・強調を復元できる。
  for (const step of [...content.steps].reverse()) validateGraphCanvas(step.canvas);
}
const first = stepPreviewContent.steps[0];
assert.throws(() => defineLearningContent({ ...stepPreviewContent, steps: [] }, validateGraphCanvas), /needs a step/);
assert.throws(() => defineLearningContent({ ...stepPreviewContent, steps: [first, first] }, validateGraphCanvas), /unique IDs/);
assert.throws(() => defineLearningContent({ ...stepPreviewContent, steps: [{ ...first, caption: "" }] }, validateGraphCanvas), /caption/);
assert.throws(() => defineLearningContent({ ...stepPreviewContent, version: 2 }, validateGraphCanvas), /Unsupported/);
assert.throws(() => defineLearningContent({ ...stepPreviewContent, intervalMs: -1 }, validateGraphCanvas), /interval/);
const canvas = first.canvas;
assert.throws(() => validateGraphCanvas({ ...canvas, highlights: [{ kind: "node", id: "missing", tone: "queued" }] }), /highlight/);
assert.throws(() => validateGraphCanvas({ ...canvas, data: { ...canvas.data, edges: [{ id: "bad", from: "A", to: "missing" }] } }), /endpoint/);
assert.throws(() => validateGraphCanvas({ ...canvas, state: { ...canvas.state, nodes: [] } }), /needs a state/);
assert.equal(scenePreviewContent.steps[0].canvas.state.structures.length, 0);
const enqueueB = stepPreviewContent.steps.find((step) => step.id === "enqueue-b");
assert.equal(enqueueB.canvas.state.structures[0].items[0].nodeId, "B");
assert(enqueueB.canvas.highlights.some((target) => target.kind === "node" && target.id === "B"));
assert(enqueueB.canvas.highlights.some((target) => target.kind === "item" && target.id === "queue-B"));
console.log("Learning player: playback boundaries, pause, seek, replay, single-step, fixtures and reference validation passed.");
