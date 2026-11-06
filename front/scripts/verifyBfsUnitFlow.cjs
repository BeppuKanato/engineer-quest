const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const ts = require("typescript");
let reducedMotion = false;
const cache = new Map();
function load(filename) {
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
// 段階の表示名はテーマ2で採用した共通名に固定する（DFS以降の単元も同じ名称セットを使う）。
assert.deepEqual(plain(bfsUnitPhases.map(phase => phase.formalName)), [
  "導入", "動きの説明", "動きの確認問題", "動きとコードの対応", "コードの確認問題", "応用問題", "自分で実装",
]);
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
assert.match(read(`${root}/bfs/motivation/motivation.content.ts`), /exit: \{ label: "動きの説明へ進む"/, "motivation exit label names the destination");
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
assert.doesNotMatch(read(`${root}/app/LearningScreen.tsx`), /単元画面へ戻る/, "learning screen has no back link inside the material");
// 単元リザルトは専用スクロールを持たず、終了導線はコース一覧へ向ける（#150）。
const resultScreensSource = read(`${root}/bfs/unit/UnitResultScreens.tsx`);
const finalResultOnly = resultScreensSource.slice(resultScreensSource.indexOf("export function UnitFinalResult"));
assert.doesNotMatch(finalResultOnly, /overflowY: "auto"/, "final result does not own an inner scroll area");
assert.match(resultScreensSource, /href="\/courses"/, "final result exits to the course list");
assert.equal(bfsUnitText.backToCourses, "コース一覧に戻る", "final result exit label");
// 独立した称賛文は置かない（#165）。フェーズリザルトに残すのは事実文と紙吹雪だけ。
assert.ok(!fs.existsSync(`${root}/bfs/unit/unitResult.presentation.ts`), "Praise copy module is removed");

// 到達図の距離は正本グラフから導出し、教材の距離と一致する。
const { bfsDistancesFrom } = load(`${root}/bfs/bfsGraph.ts`);
assert.deepEqual(plain(Object.fromEntries(bfsDistancesFrom("A"))), { A: 0, B: 1, C: 1, D: 2, E: 2, F: 3 }, "Result figure distances derive from the canonical graph");
// スコアのドットは件数の集計表示。初回正解が塗り、再挑戦分が輪郭。不正な件数では描かない。
const { ResultScoreDots } = load(`${root}/app/ResultScoreDots.tsx`);
const dotStates = value => value === null ? null : value.props.children.map(child => child.props["data-dot-state"]);
assert.deepEqual(plain(dotStates(ResultScoreDots({ total: 2, firstAttemptCorrect: 2 }))), ["first", "first"]);
assert.deepEqual(plain(dotStates(ResultScoreDots({ total: 2, firstAttemptCorrect: 1 }))), ["first", "retry"]);
assert.equal(ResultScoreDots({ total: 0, firstAttemptCorrect: 0 }), null);
assert.equal(ResultScoreDots({ total: 2, firstAttemptCorrect: 3 }), null);

// 実コンポーネントの宣言を検査する。限定された一度きりの演出で、操作や報酬と結び付けない。
const { UnitResultCelebration } = load(`${root}/bfs/unit/UnitResultCelebration.tsx`);
const nodes = element => {
  const list = [];
  const visit = item => {
    if (Array.isArray(item)) { item.forEach(visit); return; }
    if (!item || typeof item !== "object" || !item.props) return;
    list.push(item); visit(item.props.children);
  };
  visit(element); return list;
};
const renderCelebration = () => nodes(UnitResultCelebration({ heading: "確認が終わりました", headingRef: null }));
const animated = renderCelebration();
// 紙吹雪は canvas-confetti ライブラリに任せ、発射専用コンポーネントとして一度だけマウントする。
assert.ok(animated.some(node => node.type?.name === "PhaseResultConfetti"), "Confetti launcher mounts with the celebration");

for (const attribute of ["data-phase-result-mark", "data-phase-result-heading"]) {
  const element = animated.find(node => Object.hasOwn(node.props, attribute));
  assert.equal(element.props.transition.repeat, 0);
  assert.equal(element.props.animate.opacity, 1);
  assert.ok(element.props.transition.duration <= 0.7);
}
// 通常の再描画でkey・初期状態を変えない。ダイアログ閉鎖で新たな開始状態を作らない。
assert.deepEqual(plain(renderCelebration().map(node => [node.key, node.props.initial, node.props.animate])),
  plain(animated.map(node => [node.key, node.props.initial, node.props.animate])));
reducedMotion = true;
const still = renderCelebration();
assert.ok(!still.some(node => node.type?.name === "PhaseResultConfetti"), "Reduced motion omits confetti");
for (const attribute of ["data-phase-result-mark", "data-phase-result-heading"]) {
  const element = still.find(node => Object.hasOwn(node.props, attribute));
  assert.equal(element.props.initial, false, "Reduced motion starts in the completed state");
  assert.equal(element.props.animate.opacity, 1);
  assert.equal(element.props.transition.duration, 0);
  assert.equal(element.props.transition.delay ?? 0, 0);
}
const { createElement } = require("react"), { renderToStaticMarkup } = require("react-dom/server");
const { UnitResultScreen } = load(`${root}/bfs/unit/UnitResultScreens.tsx`);
for (const phase of bfsUnitPhases.filter(phase => phase.transitionOut === "result")) {
  for (const summary of [undefined, { totalQuestions: 2, firstAttemptCorrect: 2 }, { totalQuestions: 2, firstAttemptCorrect: 1 }]) {
    const html = renderToStaticMarkup(createElement(UnitResultScreen, { phase, summary, onNext: () => {} }));
    assert.ok(html.includes(phase.result.heading) && html.includes(phase.result.nextPreview));
    if (summary?.totalQuestions !== undefined) {
      assert.ok(html.includes("data-score-dots"), "Phase results visualize the score as dots");
      assert.equal((html.match(/data-dot-state="first"/g) ?? []).length, summary.firstAttemptCorrect);
      assert.ok(html.includes("data-result-figure"), "Phase results show the unit's completed figure");
    } else {
      assert.ok(!html.includes("data-score-dots"), "No score dots without a recorded score");
    }
    assert.ok(html.includes(nextPhaseLabel(phase)), "Next remains immediately available");
    assert.ok(!html.includes("<canvas"), "Confetti is an effect only; markup is complete without decoration");
    assert.doesNotMatch(html, /mascot|Mascot/);
  }
}
reducedMotion = false;
const celebrationSource = read(`${root}/bfs/unit/UnitResultCelebration.tsx`);
assert.doesNotMatch(celebrationSource, /mascot|Mascot|useSoundEffect|useLearningRewards|setTimeout|setInterval|whileInView|onAnimationComplete|Math\.random/);
assert.match(celebrationSource, /prefers-reduced-motion: reduce/, "CSS also stops animation before hydration");
// 紙吹雪はライブラリ（canvas-confetti）の発射契約として固定する。自前粒子の生成は持たない。
assert.match(celebrationSource, /from "canvas-confetti"/, "Confetti comes from the library");
assert.doesNotMatch(celebrationSource, /data-confetti-piece/, "No hand-rolled confetti pieces remain");
assert.match(celebrationSource, /particleCount: 60/, "Each popper fires 60 pieces");
assert.match(celebrationSource, /angle: 60, origin: \{ x: 0\.12, y: 0\.7 \}/, "Left popper fires up-right from the lower left");
assert.match(celebrationSource, /angle: 120, origin: \{ x: 0\.88, y: 0\.7 \}/, "Right popper fires up-left from the lower right");
assert.match(celebrationSource, /zIndex: 1200/, "Confetti stays below reward dialogs (1300)");
assert.match(celebrationSource, /disableForReducedMotion: true/, "The library also honours reduced motion");
assert.match(celebrationSource, /firedRef/, "Confetti fires once per mount, never on re-render or dialog close");
const resultSource = read(`${root}/bfs/unit/UnitResultScreens.tsx`);
const phaseResultSource = resultSource.slice(resultSource.indexOf("export function UnitResultScreen"), resultSource.indexOf("function summaryLine"));
const finalResultSource = resultSource.slice(resultSource.indexOf("export function UnitFinalResult"));
assert.match(phaseResultSource, /<UnitResultCelebration heading=\{phase\.result\.heading\}/);
assert.doesNotMatch(phaseResultSource, /phaseResultPraise|data-phase-result-praise/, "Phase results carry no standalone praise copy");
assert.match(phaseResultSource, /<BfsResultFigure/, "Phase results render the reached figure");
assert.match(phaseResultSource, /<ResultScoreDots/, "Phase results render the score dots");
const figureSource = read(`${root}/bfs/unit/BfsResultFigure.tsx`);
assert.match(figureSource, /bfsDistancesFrom/, "The figure derives distances from the canonical graph");
assert.match(figureSource, /status: "processing"/, "The figure paints nodes in achievement blue");
assert.doesNotMatch(figureSource, /status: "completed"/, "The figure never uses the completed grey for achievement");
const consolidationSource = read(`${root}/bfs/consolidation/BfsConsolidationPreview.tsx`);
assert.match(consolidationSource, /"応用問題の結果"/, "Phase 6 result screen is named as a result, not a diagnosis");
assert.doesNotMatch(consolidationSource, /応用問題の診断結果|診断結果を見る|診断には初回の回答|初回不正解/, "No diagnosis wording or failure labels in phase 6 user-facing strings");
assert.match(consolidationSource, /<ResultTagRow/, "Phase 6 renders per-tag result rows");
const tagRowSource = read(`${root}/app/ResultTagRow.tsx`);
assert.match(tagRowSource, /復習で確認できます/, "Tags not reached on the first attempt point at review instead of blame");
assert.doesNotMatch(tagRowSource, /初回不正解/, "Tag rows never label a first attempt as a failure");
assert.doesNotMatch(phaseResultSource, /mascot|Mascot|<UnitResultCelebration[^>]*key=/);
assert.doesNotMatch(finalResultSource, /UnitResultCelebration|phaseResultPraise/, "The final result is outside #144");
assert.match(container, /<UnitResultScreen phase=\{bfsUnitPhases\[screen\.index\]\} summary=\{summaries\[screen\.index\]\}/);

console.log("verifyBfsUnitFlow: OK");
