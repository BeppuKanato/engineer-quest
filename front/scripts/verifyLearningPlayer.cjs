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
const { layoutGraphCanvas } = load("../src/features/learning/player/graphLayout.ts");
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

// 表示枠に追従しつつ、図と内部状態は重ならず、長いキューも折り返せる。
for (const [width, height] of [[358, 680], [1334, 600], [2510, 1100]]) {
  for (const content of [stepPreviewContent, scenePreviewContent]) {
    for (const step of content.steps) {
      const layout = layoutGraphCanvas(step.canvas, width, height);
      for (const node of layout.nodes) {
        assert(node.x > 0 && node.x < width && node.y > 0 && node.y < layout.graphHeight);
      }
      for (const structure of layout.structures) {
        assert(structure.y >= layout.graphHeight);
        for (const item of structure.items) {
          assert(item.x >= 28 && item.x <= width - 28);
          assert(item.y > layout.graphHeight && item.y + 22 < height);
        }
      }
      if (step.canvas.state.variables.length) assert(layout.variableY < height);
    }
  }
}
// 横長・縦長でも辺とノードの比率を同じ倍率で保つ（横だけの引き伸ばしを拒否）。
for (const [width, height] of [[358, 680], [1334, 600], [2510, 1100]]) {
  const layout = layoutGraphCanvas(canvas, width, height);
  for (const [index, node] of layout.nodes.entries()) {
    for (const [otherIndex, other] of layout.nodes.entries()) {
      for (const axis of ["x", "y"]) {
        const logical = canvas.data.nodes[index][axis] - canvas.data.nodes[otherIndex][axis];
        assert(Math.abs(node[axis] - other[axis] - logical * layout.unit) < 1e-8);
      }
    }
  }
}
const longQueue = { ...canvas, state: { ...canvas.state, structures: [{
  ...canvas.state.structures[0], items: Array.from({ length: 12 }, (_, i) => ({ id: `item-${i}`, value: String(i), status: "queued" })),
}] } };
const wrapped = layoutGraphCanvas(longQueue, 358, 680).structures[0].items;
assert(new Set(wrapped.map(item => item.y)).size > 1, "A long queue should wrap");
assert.equal(new Set(wrapped.map(item => `${item.x}:${item.y}`)).size, 12, "Items must not overlap");
console.log("Learning player: playback, snapshots, reference validation and responsive canvas layout passed.");

// 実際の3キャンバスを描画し、共通SVG・半径・枠・辺・文字・リングの回帰を検出する。
const { renderToStaticMarkup } = require("react-dom/server");
const { createElement } = require("react");
const renderCache = new Map();
function loadRenderer(filename) {
  if (renderCache.has(filename)) return renderCache.get(filename);
  const exports = {};
  renderCache.set(filename, exports);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { exports, require: name => {
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return loadRenderer([`${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate)));
  } }, { filename });
  return exports;
}
const sourceRoot = path.resolve(__dirname, "../src/features/learning");
const { bfsMotivationContent } = loadRenderer(`${sourceRoot}/bfs/motivation/motivation.content.ts`);
const { bfsExecutionContent } = loadRenderer(`${sourceRoot}/bfs/execution/execution.content.ts`);
const { bfsGraph } = loadRenderer(`${sourceRoot}/bfs/bfsGraph.ts`);
const { BfsMotivationCanvas } = loadRenderer(`${sourceRoot}/bfs/motivation/BfsMotivationCanvas.tsx`);
const { BfsExecutionCanvas } = loadRenderer(`${sourceRoot}/bfs/execution/BfsExecutionCanvas.tsx`);
const { GraphCanvas } = loadRenderer(`${sourceRoot}/player/GraphCanvas.tsx`);
const generic = { data: bfsGraph, state: { nodes: bfsGraph.nodes.map(node => ({ id: node.id, status: "idle" })), structures: [], variables: [] },
  highlights: [{ kind: "node", id: "B", tone: "processing" }, { kind: "edge", id: "ab", tone: "processing" }] };
const motivation = bfsMotivationContent.steps.find(step => step.id === "bridge-entrance").canvas;
const execution = bfsExecutionContent.steps.find(step => step.id === "discover-b").canvas;
for (const [Component, canvas] of [[GraphCanvas, generic], [BfsMotivationCanvas, motivation], [BfsExecutionCanvas, execution]]) {
  const html = renderToStaticMarkup(createElement(Component, { canvas }));
  assert.match(html, /viewBox="0 0 600 450"/);
  assert.match(html, /preserveAspectRatio="xMidYMid meet"/);
  assert.equal((html.match(/data-node-id=/g) || []).length, 6);
  assert.equal((html.match(/data-edge-id=/g) || []).length, 7);
  assert.equal((html.match(/r="30"[^>]*stroke-width="2"/g) || []).length, 6);
  assert.equal((html.match(/font-size="24" font-weight="700"/g) || []).length, 6);
  assert.match(html, /r="37"[^>]*stroke-width="3" stroke-dasharray="5 4"/);
  assert.match(html, /data-edge-id="ab"[^>]*stroke-width="5"/);
  assert.match(html, /data-edge-id="df"[^>]*stroke-width="2"/);
}
const overlayHtml = renderToStaticMarkup(createElement(BfsExecutionCanvas, { canvas: execution,
  renderNodeOverlay: (id, radius) => createElement("foreignObject", { width: radius * 2, height: radius * 2 },
    createElement("button", { "aria-label": `${id}を選ぶ` })),
}));
assert.equal((overlayHtml.match(/<foreignObject width="60" height="60"/g) || []).length, 6);
assert.equal((overlayHtml.match(/role="group" aria-label="[A-F]：/g) || []).length, 6);
console.log("Shared graph drawing: all three renderers, uniform geometry and phase-3 overlay coordinates passed.");

// シーク表示の統一契約（UI 定義 §3・#145）: 全教材で幅320px以下のスライダーに統一し、セグメント表示は持たない。
const playerSource = fs.readFileSync(`${sourceRoot}/player/LearningPlayer.tsx`, "utf8");
assert.match(playerSource, /data-seek-slider/);
assert.match(playerSource, /maxWidth: 320/);
assert.doesNotMatch(playerSource, /data-seek-bar|SEGMENT_SEEK/);
console.log("Learning player: unified slider seek presentation passed.");
