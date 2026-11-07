const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const ts = require("typescript");
let reducedMotion = false;
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {}; cache.set(filename, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => {
    if (name === "framer-motion") return { ...require(name), useReducedMotion: () => reducedMotion };
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename }); return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const plain = value => JSON.parse(JSON.stringify(value));
const read = filename => fs.readFileSync(filename, "utf8");

const { binarySearchUnitPhases, binarySearchUnitTitle, binarySearchUnitText, nextPhaseLabel } = load(`${root}/binary-search/unit/unit.content.ts`);

// 単元は二分探索で、フェーズ1〜7が順番どおりに並ぶ。
assert.equal(binarySearchUnitTitle, "二分探索");
assert.deepEqual(plain(binarySearchUnitPhases.map(phase => phase.phase)), [1, 2, 3, 4, 5, 6, 7]);
// フェーズと単品プレビュー（contentId）の対応が崩れていない。
assert.deepEqual(plain(binarySearchUnitPhases.map(phase => phase.id)), [
  "binary-search-motivation", "binary-search-execution", "binary-search-check", "binary-search-code-mapping", "binary-search-code-check", "binary-search-consolidation", "binary-search-implementation",
]);
// 遷移は BFS 単元と同じ統一モデル：前進はすべてブリッジを挟み、3・5の後は単元リザルト（事実のみ）を経てブリッジ、6は内の結果からブリッジ、7の後は最終リザルト。
assert.deepEqual(plain(binarySearchUnitPhases.map(phase => phase.transitionOut)), [
  "bridge", "bridge", "result", "bridge", "result", "result-in-phase", "final",
]);
for (const phase of binarySearchUnitPhases) {
  assert.ok(phase.shortName.length > 0 && phase.formalName.length > 0, `phase ${phase.phase} names`);
  if (phase.transitionOut === "result") {
    assert.ok(phase.result && phase.result.heading.length > 0, `phase ${phase.phase} result content`);
    assert.ok(!("nextPreview" in phase.result), `phase ${phase.phase} result carries facts only; the bridge states the next goal`);
  }
  if (phase.phase > 1) assert.ok(phase.bridge && phase.bridge.length > 0, `phase ${phase.phase} bridge text`);
  else assert.ok(!phase.bridge, "phase 1 is the unit entry and has no bridge");
}
// 段階の表示名は共通名セットに固定する（BFS・DFS以降の単元と同じ）。
assert.deepEqual(plain(binarySearchUnitPhases.map(phase => phase.formalName)), [
  "導入", "動きの説明", "動きの確認問題", "動きとコードの対応", "コードの確認問題", "応用問題", "自分で実装",
]);
// カードのレアリティは基準データ §5 の配布位置どおり（フェーズ2=RARE、フェーズ5=COMMON、フェーズ7=EPIC）。
assert.deepEqual(plain(binarySearchUnitPhases.map(phase => phase.cardRarity ?? null)), [null, "RARE", null, null, "COMMON", null, "EPIC"]);
// 遷移ボタンの文言は「次の段階の正式名称＋へ進む」で導出され、「フェーズ」を含まない（#142）。
for (const phase of binarySearchUnitPhases.slice(0, -1)) {
  const next = binarySearchUnitPhases[phase.phase];
  assert.equal(nextPhaseLabel(phase), `${next.formalName}へ進む`, `phase ${phase.phase} transition label`);
  assert.doesNotMatch(nextPhaseLabel(phase), /フェーズ/, `phase ${phase.phase} label has no developer term`);
}

// レジストリに既存単元と並んで登録され、コースIDで引ける（コース seed は既存の course-algorithm-binary-search-v1）。
const { learningUnits, findLearningUnit, resumePhaseIndex } = load(`${root}/app/unitRegistry.ts`);
assert.equal(learningUnits[0].courseId, "course-algorithm-breadth-first-search-v1", "BFS stays first in the registry");
assert.ok(findLearningUnit("course-algorithm-wall-extension-v1"), "wall-extension unit stays registered");
assert.ok(findLearningUnit("course-algorithm-bubble-sort-v2"), "bubble-sort unit stays registered");
assert.ok(findLearningUnit("course-algorithm-maze-digging-v1"), "maze-digging unit stays registered");
const searchUnit = findLearningUnit("course-algorithm-binary-search-v1");
assert.ok(searchUnit, "binary-search unit is registered");
assert.equal(searchUnit.kind, "binary-search");
assert.equal(searchUnit.title, "二分探索");
assert.equal(searchUnit.phases.length, 7);
assert.equal(resumePhaseIndex(searchUnit, { courseId: searchUnit.courseId, unit: null, phases: [] }), 0);
assert.equal(resumePhaseIndex(searchUnit, { courseId: searchUnit.courseId, unit: null, phases: searchUnit.phases.map(phase => ({ phaseKey: phase.id, status: "COMPLETED" })) }), null);

// 単品プレビューのルートに単元フローとフェーズ1が接続され、フェーズ1専用ページは残っていない（登録の統一）。
const page = read(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"));
assert.match(page, /contentId === "binary-search-unit"/);
assert.match(page, /BinarySearchUnitPreview/);
assert.match(page, /contentId === "binary-search-motivation"/);
assert.ok(!fs.existsSync(path.resolve(__dirname, "../src/app/learning-preview/binary-search-unit/page.tsx")), "dedicated phase-1 preview page is removed");

// 学習画面は kind で単元コンテナを出し分ける（進捗・フィードバックの経路は共通）。
const screenSource = read(`${root}/app/LearningScreen.tsx`);
assert.match(screenSource, /unit\.kind === "binary-search"/, "learning screen dispatches on unit kind");
assert.match(screenSource, /<BinarySearchUnitPreview \{\.\.\.unitPreviewProps\} \/>/, "binary-search container receives the shared connection props");
assert.match(screenSource, /<MazeDiggingUnitPreview \{\.\.\.unitPreviewProps\} \/>/, "maze-digging container receives the same connection props");
assert.match(screenSource, /<BfsUnitPreview \{\.\.\.unitPreviewProps\} \/>/, "BFS container receives the same connection props");
// フィードバック（#202）は LearningScreen 側の共通配線から届く（先行生成・フェーズ結果・単元結果）。
assert.match(screenSource, /onCheckPhaseCompleted/, "check-phase completion starts feedback generation");
assert.match(screenSource, /renderPhaseFeedback/, "phase feedback slot is shared");
assert.match(screenSource, /renderUnitFeedback/, "unit feedback slot is shared");

// 単元コンテナが7フェーズすべてを埋め込んでいる。
const container = read(`${root}/binary-search/unit/BinarySearchUnitPreview.tsx`);
for (const component of ["BinarySearchMotivationPreview", "BinarySearchExecutionPreview", "BinarySearchCheckPreview", "BinarySearchCodeMappingPreview", "BinarySearchCodeCheckPreview", "BinarySearchConsolidationPreview", "BinarySearchImplementationPreview"]) {
  assert.ok(container.includes(`<${component} embedded`), `container renders ${component} embedded`);
}
// 上部フロー表示はチップ間を矢印でつなぎ、流れとして読めるようにする（#140）。
assert.match(container, /ArrowForwardIcon/, "phase nav chips are connected by arrows");
assert.match(container, /kind: "bridge"/, "preview routes forward completion through the bridge screen");
assert.match(container, /"phase_bridge_view"/, "bridge views are logged with the target phase");
// フィードバック接続（#202）：確認フェーズの結果と最終結果にだけ差し込み、先行生成する。
assert.match(container, /isCheckPhase/, "Feedback mounts only on check-phase results and the final result");
assert.match(container, /onCheckPhaseCompleted/, "Check-phase completion requests feedback generation early");
assert.match(container, /renderUnitFeedback/, "The final result carries the unit feedback slot");
assert.match(container, /<UnitResultScreen phase=\{binarySearchUnitPhases\[screen\.index\]\} summary=\{summaries\[screen\.index\]\}/);

// 接続の前提となる各フェーズプレビューの受け口がそろっている（フェーズ1・2・4のポートは各フェーズ実装時に用意済み）。
for (const file of ["motivation/BinarySearchMotivationPreview", "execution/BinarySearchExecutionPreview", "check/BinarySearchCheckPreview", "code-mapping/BinarySearchCodeMappingPreview", "code-check/BinarySearchCodeCheckPreview", "consolidation/BinarySearchConsolidationPreview", "implementation/BinarySearchImplementationPreview"]) {
  const source = read(`${root}/binary-search/${file}.tsx`);
  assert.match(source, /embedded/, `${file} embedded prop`);
  assert.match(source, /onComplete/, `${file} onComplete prop`);
}
assert.match(read(`${root}/binary-search/consolidation/BinarySearchConsolidationPreview.tsx`), /onNext/, "consolidation onNext");

// 到達図は正本の実行記録から導出し、主教材 [3,7,12,19,25,31,42] で 25 がインデックス4に見つかった盤面と一致する。
const { binarySearchMainValues, binarySearchMainTarget, binarySearchProbes, runBinarySearch } = load(`${root}/binary-search/binarySearch.ts`);
assert.equal(runBinarySearch(binarySearchMainValues, binarySearchMainTarget), 4, "Result figure target is found at index 4");
assert.equal(binarySearchProbes(binarySearchMainValues, binarySearchMainTarget).length, 3, "Main example takes 3 probes");
const figureSource = read(`${root}/binary-search/unit/BinarySearchResultFigure.tsx`);
assert.match(figureSource, /binarySearchProbes/, "The figure derives the board from the canonical run record");
assert.match(figureSource, /runBinarySearch/, "The figure derives the found index from the canonical contract");
assert.match(figureSource, /validateBinarySearchExecutionCanvas/, "The figure validates with the unit-side board validator");

// 単元リザルトは専用スクロールを持たず、終了導線はコース一覧へ向ける（#150）。
const resultScreensSource = read(`${root}/binary-search/unit/UnitResultScreens.tsx`);
const finalResultOnly = resultScreensSource.slice(resultScreensSource.indexOf("export function UnitFinalResult"));
assert.doesNotMatch(finalResultOnly, /overflowY: "auto"/, "final result does not own an inner scroll area");
assert.match(finalResultOnly, /<ResultConfetti preset="final"/, "final result fires the stronger confetti preset");
assert.match(finalResultOnly, /<UnitPathMiniMap/, "final result shows the fully-lit mini map");
assert.match(finalResultOnly, /data-final-stats/, "final result shows summary stat tiles");
assert.match(finalResultOnly, /<DrawnCheck/, "final result mark uses the same drawn check as phase results");
assert.match(finalResultOnly, /data-final-result-mark/, "final result mark pops in like the phase mark");
assert.match(resultScreensSource, /href="\/courses"/, "final result exits to the course list");
assert.equal(binarySearchUnitText.backToCourses, "コース一覧に戻る", "final result exit label");
const phaseResultSource = resultScreensSource.slice(resultScreensSource.indexOf("export function UnitResultScreen"), resultScreensSource.indexOf("function summaryLine"));
assert.match(phaseResultSource, /<UnitResultCelebration heading=\{phase\.result\.heading\}/);
assert.doesNotMatch(phaseResultSource, /phaseResultPraise|data-phase-result-praise/, "Phase results carry no standalone praise copy");
assert.match(phaseResultSource, /<BinarySearchResultFigure/, "Phase results render the reached figure");
assert.match(phaseResultSource, /<ResultScoreDots/, "Phase results render the score dots");

// フェーズリザルトを実際に描く：見出し・スコアのドット・到達図（25 が見つかった盤面）が出る。
const { createElement } = require("react"), { renderToStaticMarkup } = require("react-dom/server");
const { UnitResultScreen } = load(`${root}/binary-search/unit/UnitResultScreens.tsx`);
for (const phase of binarySearchUnitPhases.filter(phase => phase.transitionOut === "result")) {
  for (const summary of [undefined, { totalQuestions: 2, firstAttemptCorrect: 2 }, { totalQuestions: 2, firstAttemptCorrect: 1 }]) {
    const html = renderToStaticMarkup(createElement(UnitResultScreen, { phase, summary, onNext: () => {} }));
    assert.ok(html.includes(phase.result.heading));
    assert.ok(html.includes("data-result-figure"), "Phase results show the unit's completed figure");
    assert.equal((html.match(/data-array-bar=/g) ?? []).length, 7, "The figure is the 7-value main array");
    assert.deepEqual([...html.matchAll(/data-array-value="(\d+)"/g)].map(match => Number(match[1])), [3, 7, 12, 19, 25, 31, 42], "The figure shows the main values");
    assert.equal((html.match(/data-array-status="completed"/g) ?? []).length, 6, "Discarded cells render as out-of-range in the figure");
    assert.equal((html.match(/data-array-status="processing"/g) ?? []).length, 1, "Only the found cell renders as confirmed in the figure");
    assert.equal((html.match(/data-array-highlight="4"/g) ?? []).length, 1, "The found cell (index 4) carries the emphasis ring");
    if (summary?.totalQuestions !== undefined) {
      assert.ok(html.includes("data-score-dots"), "Phase results visualize the score as dots");
      assert.equal((html.match(/data-dot-state="first"/g) ?? []).length, summary.firstAttemptCorrect);
    } else {
      assert.ok(!html.includes("data-score-dots"), "No score dots without a recorded score");
    }
    assert.ok(html.includes("次へ進む"), "Result screens advance toward the bridge; the destination-named button lives on the bridge");
    assert.ok(!html.includes("<canvas"), "Confetti is an effect only; markup is complete without decoration");
    assert.doesNotMatch(html, /mascot|Mascot/);
  }
}
// ブリッジ画面（BFS 側の共通部品）は二分探索のフェーズでも、ステージ名・つなぎ文・行き先ボタンだけを持つ（#141）。
const { PhaseBridgeScreen } = load(`${root}/bfs/unit/PhaseBridgeScreen.tsx`);
for (const phase of binarySearchUnitPhases.filter(phase => phase.phase > 1)) {
  const html = renderToStaticMarkup(createElement(PhaseBridgeScreen, { phase, onProceed: () => {} }));
  assert.ok(html.includes(`次は「${phase.formalName}」`), `bridge heading for phase ${phase.phase}`);
  assert.ok(html.includes(phase.bridge), `bridge text for phase ${phase.phase}`);
  assert.ok(html.includes(`${phase.formalName}へ進む`), `bridge button for phase ${phase.phase}`);
}

console.log("verifyBinarySearchUnit: OK");
