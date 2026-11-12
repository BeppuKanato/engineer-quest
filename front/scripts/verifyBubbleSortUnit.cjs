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
    if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
    const base = name.startsWith("@/") ? path.resolve(__dirname, "../src", name.slice(2)) : path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename }); return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const plain = value => JSON.parse(JSON.stringify(value));
const read = filename => fs.readFileSync(filename, "utf8");

const { bubbleSortUnitPhases, bubbleSortUnitTitle, bubbleSortUnitText, nextPhaseLabel } = load(`${root}/bubble-sort/unit/unit.content.ts`);

// 単元はバブルソートで、フェーズ1〜7が順番どおりに並ぶ。
assert.equal(bubbleSortUnitTitle, "バブルソート");
assert.deepEqual(plain(bubbleSortUnitPhases.map(phase => phase.phase)), [1, 2, 3, 4, 5, 6, 7]);
// フェーズと単品プレビュー（contentId）の対応が崩れていない。
assert.deepEqual(plain(bubbleSortUnitPhases.map(phase => phase.id)), [
  "bubble-sort-motivation", "bubble-sort-execution", "bubble-sort-check", "bubble-sort-code-mapping", "bubble-sort-code-check", "bubble-sort-consolidation", "bubble-sort-implementation",
]);
// 遷移は BFS 単元と同じ統一モデル：前進はすべてブリッジを挟み、3・5の後は単元リザルト（事実のみ）を経てブリッジ、6は内の結果からブリッジ、7の後は最終リザルト。
assert.deepEqual(plain(bubbleSortUnitPhases.map(phase => phase.transitionOut)), [
  "bridge", "bridge", "result", "bridge", "result", "result-in-phase", "final",
]);
for (const phase of bubbleSortUnitPhases) {
  assert.ok(phase.shortName.length > 0 && phase.formalName.length > 0, `phase ${phase.phase} names`);
  if (phase.transitionOut === "result") {
    assert.ok(phase.result && phase.result.heading.length > 0, `phase ${phase.phase} result content`);
    assert.ok(!("nextPreview" in phase.result), `phase ${phase.phase} result carries facts only; the bridge states the next goal`);
  }
  if (phase.phase > 1) assert.ok(phase.bridge && phase.bridge.length > 0, `phase ${phase.phase} bridge text`);
  else assert.ok(!phase.bridge, "phase 1 is the unit entry and has no bridge");
}
// 段階の表示名は共通名セットに固定する（BFS・DFS以降の単元と同じ）。
assert.deepEqual(plain(bubbleSortUnitPhases.map(phase => phase.formalName)), [
  "導入", "動きの説明", "動きの確認問題", "動きとコードの対応", "コードの確認問題", "応用問題", "自分で実装",
]);
// カードのレアリティは基準データ §5 の配布位置どおり（フェーズ2=RARE、フェーズ5=COMMON、フェーズ7=EPIC）。
assert.deepEqual(plain(bubbleSortUnitPhases.map(phase => phase.cardRarity ?? null)), [null, "RARE", null, null, "COMMON", null, "EPIC"]);
// 遷移ボタンの文言は「次の段階の正式名称＋へ進む」で導出され、「フェーズ」を含まない（#142）。
for (const phase of bubbleSortUnitPhases.slice(0, -1)) {
  const next = bubbleSortUnitPhases[phase.phase];
  assert.equal(nextPhaseLabel(phase), `${next.formalName}へ進む`, `phase ${phase.phase} transition label`);
  assert.doesNotMatch(nextPhaseLabel(phase), /フェーズ/, `phase ${phase.phase} label has no developer term`);
}

// レジストリに BFS と並んで登録され、既存コースIDで引ける。
const { learningUnits, findLearningUnit, resumePhaseIndex } = load(`${root}/app/unitRegistry.ts`);
assert.equal(learningUnits[0].courseId, "course-algorithm-breadth-first-search-v1", "BFS stays first in the registry");
const bubbleUnit = findLearningUnit("course-algorithm-bubble-sort-v2");
assert.ok(bubbleUnit, "bubble-sort unit is registered");
assert.equal(bubbleUnit.kind, "bubble-sort");
assert.equal(bubbleUnit.title, "バブルソート");
assert.equal(bubbleUnit.phases.length, 7);
assert.equal(resumePhaseIndex(bubbleUnit, { courseId: bubbleUnit.courseId, unit: null, phases: [] }), 0);
assert.equal(resumePhaseIndex(bubbleUnit, { courseId: bubbleUnit.courseId, unit: null, phases: bubbleUnit.phases.map(phase => ({ phaseKey: phase.id, status: "COMPLETED" })) }), null);

// 単品プレビューのルートに単元フローが接続されている。
const page = read(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"));
assert.match(page, /contentId === "bubble-sort-unit"/);
assert.match(page, /BubbleSortUnitPreview/);

// 学習画面は kind で単元コンテナを出し分ける（進捗・フィードバックの経路は共通）。
const screenSource = read(`${root}/app/LearningScreen.tsx`);
assert.match(screenSource, /unit\.kind === "bubble-sort"/, "learning screen dispatches on unit kind");
assert.match(screenSource, /<BubbleSortUnitPreview \{\.\.\.unitPreviewProps\} \/>/, "bubble-sort container receives the shared connection props");
assert.match(screenSource, /<BfsUnitPreview \{\.\.\.unitPreviewProps\} \/>/, "BFS container receives the same connection props");

// 単元コンテナが7フェーズすべてを埋め込んでいる。
const adapter = read(`${root}/bubble-sort/unit/BubbleSortUnitPreview.tsx`);
assert.match(adapter, /<LearningUnitPreview \{\.\.\.props\} unit=/, "The unit uses the common controller");
const container = read(`${root}/unit/LearningUnitPreview.tsx`);
for (const component of ["BubbleSortMotivationPreview", "BubbleSortExecutionPreview", "BubbleSortCheckPreview", "BubbleSortCodeMappingPreview", "BubbleSortCodeCheckPreview", "BubbleSortConsolidationPreview", "BubbleSortImplementationPreview"]) {
  assert.ok(adapter.includes(`: ${component}`), `unit registers ${component}`);
  assert.match(container, /<View embedded/, "shared controller embeds every registered view");
}
// 上部フロー表示はチップ間を矢印でつなぎ、流れとして読めるようにする（#140）。
assert.match(container, /ArrowForwardIcon/, "phase nav chips are connected by arrows");
assert.match(container, /kind: "bridge"/, "preview routes forward completion through the bridge screen");
assert.match(container, /"phase_bridge_view"/, "bridge views are logged with the target phase");
// フィードバック接続（#202）：確認フェーズの結果と最終結果にだけ差し込み、先行生成する。
assert.match(container, /isCheckPhase/, "Feedback mounts only on check-phase results and the final result");
assert.match(container, /onCheckPhaseCompleted/, "Check-phase completion requests feedback generation early");
assert.match(container, /renderUnitFeedback/, "The final result carries the unit feedback slot");
assert.match(container, /<UnitResultScreen phase=\{phases\[screen\.index\]\} summary=\{summaries\[screen\.index\]\}/);

// 接続の前提となる各フェーズプレビューの受け口がそろっている。
for (const file of ["motivation/BubbleSortMotivationPreview", "execution/BubbleSortExecutionPreview", "check/BubbleSortCheckPreview", "code-mapping/BubbleSortCodeMappingPreview", "code-check/BubbleSortCodeCheckPreview", "consolidation/BubbleSortConsolidationPreview", "implementation/BubbleSortImplementationPreview"]) {
  const adapter = read(`${root}/bubble-sort/${file}.tsx`);
  if (file.startsWith("implementation/")) assert.match(adapter, /<ImplementationWorkspace \{\.\.\.props\}/, "implementation forwards its props");
  const source = file.startsWith("implementation/") ? read(`${root}/implementation/ImplementationWorkspace.tsx`) : adapter;
  assert.match(source, /embedded/, `${file} embedded prop`);
  assert.match(source, /onComplete/, `${file} onComplete prop`);
}
assert.match(read(`${root}/bubble-sort/consolidation/BubbleSortConsolidationPreview.tsx`), /onNext/, "consolidation onNext");

// 到達図の並びは正本の手順から導出し、教材の結果と一致する（主教材 [4,2,5,1,3] → [1,2,3,4,5]）。
const { bubbleSortMainValues, runBubbleSort } = load(`${root}/bubble-sort/bubbleSort.ts`);
assert.deepEqual(plain(bubbleSortMainValues), [4, 2, 5, 1, 3], "Main teaching values stay canonical");
assert.deepEqual(plain(runBubbleSort(bubbleSortMainValues)), [1, 2, 3, 4, 5], "Result figure values derive from the canonical procedure");
const figureSource = read(`${root}/bubble-sort/unit/BubbleSortResultFigure.tsx`);
assert.match(figureSource, /runBubbleSort/, "The figure derives the sorted values from the canonical procedure");
assert.match(figureSource, /bubbleSortMainValues/, "The figure uses the main teaching values");
assert.match(figureSource, /fixedFrom: 0/, "The figure shows the fully fixed (completed) array");

// 単元リザルトは専用スクロールを持たず、終了導線はコース一覧へ向ける（#150）。
const resultScreensSource = read(`${root}/components/results/UnitResultScreens.tsx`);
const finalResultOnly = resultScreensSource.slice(resultScreensSource.indexOf("export function UnitFinalResult"));
assert.doesNotMatch(finalResultOnly, /overflowY: "auto"/, "final result does not own an inner scroll area");
// フェーズリザルトとブリッジも専用スクロールを持たず、単元コンテナのラッパーが唯一のスクロール領域になる（#298）。
const phaseResultOnly = resultScreensSource.slice(resultScreensSource.indexOf("export function UnitResultScreen"), resultScreensSource.indexOf("export function UnitFinalResult"));
assert.doesNotMatch(phaseResultOnly, /overflowY: "auto"/, "phase result does not own an inner scroll area (#298)");
assert.doesNotMatch(read(`${root}/components/results/PhaseBridgeScreen.tsx`), /overflowY: "auto"/, "bridge does not own an inner scroll area (#298)");
// 結果・ブリッジ・最終結果では内側カラムが内容の高さで伸び、スクロールはラッパー側で起きる（#298）。
assert.match(container, /height: screen\.kind === "phase" \? "100%" : "auto"/, "result/bridge/final columns grow with content (#298)");
// 「直前の回答」は内側カラムの中ではなく、ヘッダー直下の固定ゾーン（ラッパーより前）に置く（#298）。
assert.ok(container.indexOf("AnswerFeedbackNotice") > -1 && container.indexOf("AnswerFeedbackNotice") < container.indexOf("画面より高い内容はこの中でスクロールさせ"), "answer notice sits in the fixed zone under the header (#298)");
assert.match(finalResultOnly, /<ResultConfetti preset="final"/, "final result fires the stronger confetti preset");
assert.match(finalResultOnly, /<UnitPathMiniMap/, "final result shows the fully-lit mini map");
assert.match(finalResultOnly, /data-final-stats/, "final result shows summary stat tiles");
assert.match(finalResultOnly, /<DrawnCheck/, "final result mark uses the same drawn check as phase results");
assert.match(finalResultOnly, /data-final-result-mark/, "final result mark pops in like the phase mark");
assert.match(resultScreensSource, /href="\/courses"/, "final result exits to the course list");
assert.equal(bubbleSortUnitText.backToCourses, "コース一覧に戻る", "final result exit label");
const phaseResultSource = resultScreensSource.slice(resultScreensSource.indexOf("export function UnitResultScreen"), resultScreensSource.indexOf("function summaryLine"));
assert.match(phaseResultSource, /<UnitResultCelebration heading=\{phase\.result\.heading\}/);
assert.doesNotMatch(phaseResultSource, /phaseResultPraise|data-phase-result-praise/, "Phase results carry no standalone praise copy");
assert.match(adapter, /resultFigure: <BubbleSortResultFigure/, "The unit supplies its reached figure");
assert.match(phaseResultSource, /\{figure\}/, "Shared result screens render the supplied figure");
assert.match(phaseResultSource, /<ResultScoreDots/, "Phase results render the score dots");

// フェーズリザルトを実際に描く：見出し・スコアのドット・到達図（完成した並び）が出る。
const { createElement } = require("react"), { renderToStaticMarkup } = require("react-dom/server");
const { UnitResultScreen } = load(`${root}/components/results/UnitResultScreens.tsx`);
const { BubbleSortResultFigure } = load(`${root}/bubble-sort/unit/BubbleSortResultFigure.tsx`);
for (const phase of bubbleSortUnitPhases.filter(phase => phase.transitionOut === "result")) {
  for (const summary of [undefined, { totalQuestions: 2, firstAttemptCorrect: 2 }, { totalQuestions: 2, firstAttemptCorrect: 1 }]) {
    const html = renderToStaticMarkup(createElement(UnitResultScreen, { phase, summary, figure: createElement(BubbleSortResultFigure), onNext: () => {} }));
    assert.ok(html.includes(phase.result.heading));
    assert.ok(html.includes("data-result-figure"), "Phase results show the unit's completed figure");
    assert.equal((html.match(/data-array-bar=/g) ?? []).length, 5, "The figure is the completed 5-value array");
    assert.deepEqual([...html.matchAll(/data-array-value="(\d+)"/g)].map(match => Number(match[1])), [1, 2, 3, 4, 5], "The figure is sorted ascending");
    assert.equal((html.match(/data-array-fixed="true"/g) ?? []).length, 5, "Every value in the figure is fixed");
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
// ブリッジ画面（BFS 側の共通部品）はバブルソートのフェーズでも、ステージ名・つなぎ文・行き先ボタンだけを持つ（#141）。
const { PhaseBridgeScreen } = load(`${root}/components/results/PhaseBridgeScreen.tsx`);
for (const phase of bubbleSortUnitPhases.filter(phase => phase.phase > 1)) {
  const html = renderToStaticMarkup(createElement(PhaseBridgeScreen, { phase, onProceed: () => {} }));
  assert.ok(html.includes(`次は「${phase.formalName}」`), `bridge heading for phase ${phase.phase}`);
  assert.ok(html.includes(phase.bridge), `bridge text for phase ${phase.phase}`);
  assert.ok(html.includes(`${phase.formalName}へ進む`), `bridge button for phase ${phase.phase}`);
}

console.log("verifyBubbleSortUnit: OK");
