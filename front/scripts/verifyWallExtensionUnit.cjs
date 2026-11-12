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

const { wallExtensionUnitPhases, wallExtensionUnitTitle, wallExtensionUnitText, nextPhaseLabel } = load(`${root}/units/wall-extension/unit/unit.content.ts`);

// 単元は棒倒し法で、フェーズ1〜7が順番どおりに並ぶ。
assert.equal(wallExtensionUnitTitle, "棒倒し法");
assert.deepEqual(plain(wallExtensionUnitPhases.map(phase => phase.phase)), [1, 2, 3, 4, 5, 6, 7]);
// フェーズと単品プレビュー（contentId）の対応が崩れていない。
assert.deepEqual(plain(wallExtensionUnitPhases.map(phase => phase.id)), [
  "wall-extension-motivation", "wall-extension-execution", "wall-extension-check", "wall-extension-code-mapping", "wall-extension-code-check", "wall-extension-consolidation", "wall-extension-implementation",
]);
// 遷移は BFS 単元と同じ統一モデル：前進はすべてブリッジを挟み、3・5の後は単元リザルト（事実のみ）を経てブリッジ、6は内の結果からブリッジ、7の後は最終リザルト。
assert.deepEqual(plain(wallExtensionUnitPhases.map(phase => phase.transitionOut)), [
  "bridge", "bridge", "result", "bridge", "result", "result-in-phase", "final",
]);
for (const phase of wallExtensionUnitPhases) {
  assert.ok(phase.shortName.length > 0 && phase.formalName.length > 0, `phase ${phase.phase} names`);
  if (phase.transitionOut === "result") {
    assert.ok(phase.result && phase.result.heading.length > 0, `phase ${phase.phase} result content`);
    assert.ok(!("nextPreview" in phase.result), `phase ${phase.phase} result carries facts only; the bridge states the next goal`);
  }
  if (phase.phase > 1) assert.ok(phase.bridge && phase.bridge.length > 0, `phase ${phase.phase} bridge text`);
  else assert.ok(!phase.bridge, "phase 1 is the unit entry and has no bridge");
}
// 段階の表示名は共通名セットに固定する（BFS・DFS以降の単元と同じ）。
assert.deepEqual(plain(wallExtensionUnitPhases.map(phase => phase.formalName)), [
  "導入", "動きの説明", "動きの確認問題", "動きとコードの対応", "コードの確認問題", "応用問題", "自分で実装",
]);
// カードのレアリティは基準データ §5 の配布位置どおり（フェーズ2=RARE、フェーズ5=COMMON、フェーズ7=EPIC）。
assert.deepEqual(plain(wallExtensionUnitPhases.map(phase => phase.cardRarity ?? null)), [null, "RARE", null, null, "COMMON", null, "EPIC"]);
// 遷移ボタンの文言は「次の段階の正式名称＋へ進む」で導出され、「フェーズ」を含まない（#142）。
for (const phase of wallExtensionUnitPhases.slice(0, -1)) {
  const next = wallExtensionUnitPhases[phase.phase];
  assert.equal(nextPhaseLabel(phase), `${next.formalName}へ進む`, `phase ${phase.phase} transition label`);
  assert.doesNotMatch(nextPhaseLabel(phase), /フェーズ/, `phase ${phase.phase} label has no developer term`);
}

// レジストリに BFS と並んで登録され、コースIDで引ける。
const { learningUnits, findLearningUnit, resumePhaseIndex } = load(`${root}/config/unitRegistry.ts`);
assert.equal(learningUnits[0].courseId, "course-algorithm-breadth-first-search-v1", "BFS stays first in the registry");
const wallUnit = findLearningUnit("course-algorithm-wall-extension-v1");
assert.ok(wallUnit, "wall-extension unit is registered");
assert.equal(wallUnit.kind, "wall-extension");
assert.equal(wallUnit.title, "棒倒し法");
assert.equal(wallUnit.phases.length, 7);
assert.equal(resumePhaseIndex(wallUnit, { courseId: wallUnit.courseId, unit: null, phases: [] }), 0);
assert.equal(resumePhaseIndex(wallUnit, { courseId: wallUnit.courseId, unit: null, phases: wallUnit.phases.map(phase => ({ phaseKey: phase.id, status: "COMPLETED" })) }), null);

// 単品プレビューのルートに単元フローが接続されている。
const page = read(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"));
assert.match(page, /contentId === "wall-extension-unit"/);
assert.match(page, /WallExtensionUnitPreview/);

// 学習画面は kind で単元コンテナを出し分ける（進捗・フィードバックの経路は共通）。
const screenSource = read(`${root}/screens/LearningScreen.tsx`);
assert.match(screenSource, /unit\.kind === "wall-extension"/, "learning screen dispatches on unit kind");
assert.match(screenSource, /<WallExtensionUnitPreview \{\.\.\.unitPreviewProps\} \/>/, "wall-extension container receives the shared connection props");
assert.match(screenSource, /<BfsUnitPreview \{\.\.\.unitPreviewProps\} \/>/, "BFS container receives the same connection props");

// 単元コンテナが7フェーズすべてを埋め込んでいる。
const adapter = read(`${root}/units/wall-extension/unit/WallExtensionUnitPreview.tsx`);
assert.match(adapter, /<LearningUnitPreview \{\.\.\.props\} unit=/, "The unit uses the common controller");
const container = read(`${root}/unit/LearningUnitPreview.tsx`);
for (const component of ["WallExtensionMotivationPreview", "WallExtensionExecutionPreview", "WallExtensionCheckPreview", "WallExtensionCodeMappingPreview", "WallExtensionCodeCheckPreview", "WallExtensionConsolidationPreview", "WallExtensionImplementationPreview"]) {
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
for (const file of ["motivation/WallExtensionMotivationPreview", "execution/WallExtensionExecutionPreview", "check/WallExtensionCheckPreview", "code-mapping/WallExtensionCodeMappingPreview", "code-check/WallExtensionCodeCheckPreview", "consolidation/WallExtensionConsolidationPreview", "implementation/WallExtensionImplementationPreview"]) {
  const adapter = read(`${root}/units/wall-extension/${file}.tsx`);
  if (file.startsWith("implementation/")) assert.match(adapter, /<ImplementationWorkspace \{\.\.\.props\}/, "implementation forwards its props");
  const source = file.startsWith("implementation/") ? read(`${root}/implementation/ImplementationWorkspace.tsx`) : adapter;
  assert.match(source, /embedded/, `${file} embedded prop`);
  assert.match(source, /onComplete/, `${file} onComplete prop`);
}
assert.match(read(`${root}/units/wall-extension/consolidation/WallExtensionConsolidationPreview.tsx`), /onNext/, "consolidation onNext");

// 到達図の壁は正本の choices から導出し、教材の迷路と一致する（9×9: 外周32＋柱9＋伸長9＝50）。
const { buildWallExtensionWalls, wallExtensionMainChoices, wallExtensionMainSize } = load(`${root}/units/wall-extension/wallExtensionMaze.ts`);
assert.equal(buildWallExtensionWalls(wallExtensionMainSize, wallExtensionMainChoices).length, 50, "Result figure walls derive from the canonical choices");
const figureSource = read(`${root}/units/wall-extension/unit/WallExtensionResultFigure.tsx`);
assert.match(figureSource, /buildWallExtensionWalls/, "The figure derives walls from the canonical maze data");
assert.match(figureSource, /wallExtensionMainPath/, "The figure reuses the phase-1 route for the start-to-goal path");

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
assert.equal(wallExtensionUnitText.backToCourses, "コース一覧に戻る", "final result exit label");
const phaseResultSource = resultScreensSource.slice(resultScreensSource.indexOf("export function UnitResultScreen"), resultScreensSource.indexOf("function summaryLine"));
assert.match(phaseResultSource, /<UnitResultCelebration heading=\{phase\.result\.heading\}/);
assert.doesNotMatch(phaseResultSource, /phaseResultPraise|data-phase-result-praise/, "Phase results carry no standalone praise copy");
assert.match(adapter, /resultFigure: <WallExtensionResultFigure/, "The unit supplies its reached figure");
assert.match(phaseResultSource, /\{figure\}/, "Shared result screens render the supplied figure");
assert.match(phaseResultSource, /<ResultScoreDots/, "Phase results render the score dots");

// フェーズリザルトを実際に描く：見出し・スコアのドット・到達図（完成した迷路）が出る。
const { createElement } = require("react"), { renderToStaticMarkup } = require("react-dom/server");
const { UnitResultScreen } = load(`${root}/components/results/UnitResultScreens.tsx`);
const { WallExtensionResultFigure } = load(`${root}/units/wall-extension/unit/WallExtensionResultFigure.tsx`);
for (const phase of wallExtensionUnitPhases.filter(phase => phase.transitionOut === "result")) {
  for (const summary of [undefined, { totalQuestions: 2, firstAttemptCorrect: 2 }, { totalQuestions: 2, firstAttemptCorrect: 1 }]) {
    const html = renderToStaticMarkup(createElement(UnitResultScreen, { phase, summary, figure: createElement(WallExtensionResultFigure), onNext: () => {} }));
    assert.ok(html.includes(phase.result.heading));
    assert.ok(html.includes("data-result-figure"), "Phase results show the unit's completed figure");
    assert.equal((html.match(/data-maze-wall="true"/g) ?? []).length, 50, "The figure is the completed 9x9 maze");
    assert.equal((html.match(/data-maze-flag=/g) ?? []).length, 2, "The figure carries the start and goal flags");
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
// ブリッジ画面（BFS 側の共通部品）は棒倒し法のフェーズでも、ステージ名・つなぎ文・行き先ボタンだけを持つ（#141）。
const { PhaseBridgeScreen } = load(`${root}/components/results/PhaseBridgeScreen.tsx`);
for (const phase of wallExtensionUnitPhases.filter(phase => phase.phase > 1)) {
  const html = renderToStaticMarkup(createElement(PhaseBridgeScreen, { phase, onProceed: () => {} }));
  assert.ok(html.includes(`次は「${phase.formalName}」`), `bridge heading for phase ${phase.phase}`);
  assert.ok(html.includes(phase.bridge), `bridge text for phase ${phase.phase}`);
  assert.ok(html.includes(`${phase.formalName}へ進む`), `bridge button for phase ${phase.phase}`);
}

console.log("verifyWallExtensionUnit: OK");
