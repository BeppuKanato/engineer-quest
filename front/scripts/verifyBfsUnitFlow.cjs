const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const ts = require("typescript");
const cache = new Map();
function load(filename) {
  if (cache.has(filename)) return cache.get(filename);
  const exports = {}; cache.set(filename, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename }); return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const plain = value => JSON.parse(JSON.stringify(value));
const read = filename => fs.readFileSync(filename, "utf8");

const { bfsUnitPhases, bfsUnitTitle, bfsUnitText, nextPhaseLabel } = load(`${root}/bfs/unit/unit.content.ts`);

// 単元は幅優先探索（BFS）で、フェーズ1〜7が順番どおりに並ぶ。
assert.equal(bfsUnitTitle, "幅優先探索（BFS）");
assert.deepEqual(plain(bfsUnitPhases.map(phase => phase.phase)), [1, 2, 3, 4, 5, 6, 7]);
// フェーズと単品プレビュー（contentId）の対応が崩れていない。
assert.deepEqual(plain(bfsUnitPhases.map(phase => phase.id)), [
  "bfs-motivation", "bfs-execution", "bfs-check", "bfs-code-mapping", "bfs-code-check", "bfs-consolidation", "bfs-implementation",
]);
// 遷移は指針の3類型どおり：1→2=意思確認、2→3と4→5=シームレス、3・5の後は単元リザルト、6は診断がリザルト、7の後は最終リザルト。
assert.deepEqual(plain(bfsUnitPhases.map(phase => phase.transitionOut)), [
  "choice", "seamless", "result", "seamless", "result", "result-in-phase", "final",
]);
for (const phase of bfsUnitPhases) {
  assert.ok(phase.shortName.length > 0 && phase.formalName.length > 0, `phase ${phase.phase} names`);
  if (phase.transitionOut === "result") {
    assert.ok(phase.result && phase.result.heading.length > 0 && phase.result.nextPreview.length > 0, `phase ${phase.phase} result content`);
  }
}
// 遷移ボタンの文言は「次の段階の正式名称＋へ進む」で導出され、「フェーズ」を含まない（#142）。
for (const phase of bfsUnitPhases.slice(0, -1)) {
  const next = bfsUnitPhases[phase.phase];
  assert.equal(nextPhaseLabel(phase), `${next.formalName}へ進む`, `phase ${phase.phase} transition label`);
  assert.doesNotMatch(nextPhaseLabel(phase), /フェーズ/, `phase ${phase.phase} label has no developer term`);
}
// 遷移ボタンは共通部品 PhaseNextButton に統一されている（#142）。
for (const file of ["player/LearningPlayer.tsx", "bfs/motivation/BfsMotivationCanvas.tsx", "bfs/unit/UnitResultScreens.tsx", "bfs/consolidation/BfsConsolidationPreview.tsx"]) {
  assert.match(read(`${root}/${file}`), /PhaseNextButton/, `${file} uses the shared transition button`);
}
assert.match(read(`${root}/bfs/motivation/motivation.content.ts`), /exit: \{ label: "アルゴリズム説明へ進む"/, "motivation exit label names the destination");
// フェーズ1の出口ボタンは SVG の外に置き、拡大率で大きさが変わらないようにする（#157）。
assert.doesNotMatch(read(`${root}/bfs/motivation/BfsMotivationCanvas.tsx`), /<foreignObject/, "motivation exit button stays outside the SVG");

// 単品プレビューのルートに単元フローが接続されている。
const page = read(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"));
assert.match(page, /contentId === "bfs-unit"/);
assert.match(page, /BfsUnitPreview/);

// 単元コンテナが7フェーズすべてを埋め込んでいる。
const container = read(`${root}/bfs/unit/BfsUnitPreview.tsx`);
for (const component of ["BfsMotivationPreview", "BfsExecutionPreview", "BfsCheckPreview", "BfsCodeMappingPreview", "BfsCodeCheckPreview", "BfsConsolidationPreview", "BfsImplementationPreview"]) {
  assert.ok(container.includes(`<${component} embedded`), `container renders ${component} embedded`);
}

// 接続の前提となる各部品の受け口が残っている。
assert.match(read(`${root}/player/LearningPlayer.tsx`), /endAction/, "player endAction");
assert.match(read(`${root}/bfs/motivation/BfsMotivationCanvas.tsx`), /onExit/, "motivation canvas onExit");
for (const file of ["motivation/BfsMotivationPreview", "execution/BfsExecutionPreview", "check/BfsCheckPreview", "code-mapping/BfsCodeMappingPreview", "code-check/BfsCodeCheckPreview", "consolidation/BfsConsolidationPreview", "implementation/BfsImplementationPreview"]) {
  const source = read(`${root}/bfs/${file}.tsx`);
  assert.match(source, /embedded/, `${file} embedded prop`);
  assert.match(source, /onComplete/, `${file} onComplete prop`);
}
assert.match(read(`${root}/bfs/consolidation/BfsConsolidationPreview.tsx`), /onNext/, "consolidation onNext");

// 上部フロー表示はチップ間を矢印でつなぎ、流れとして読めるようにする（#140）。
assert.match(container, /ArrowForwardIcon/, "phase nav chips are connected by arrows");
// 単元画面は共通パンくず AppBreadcrumbs を使い、教材内（学習画面）にはパンくずを置かない（#139, #140）。
assert.match(read(`${root}/app/UnitOverview.tsx`), /AppBreadcrumbs/, "unit overview uses the shared breadcrumbs");
assert.doesNotMatch(read(`${root}/app/LearningScreen.tsx`), /AppBreadcrumbs/, "learning screen has no breadcrumbs inside the material");
// 単元リザルトは専用スクロールを持たず、終了導線はコース一覧へ向ける（#150）。
const finalResult = read(`${root}/bfs/unit/UnitResultScreens.tsx`);
assert.doesNotMatch(finalResult, /overflowY: "auto"/, "final result does not own an inner scroll area");
assert.match(finalResult, /href="\/courses"/, "final result exits to the course list");
assert.equal(bfsUnitText.backToCourses, "コース一覧に戻る", "final result exit label");

console.log("verifyBfsUnitFlow: OK");
