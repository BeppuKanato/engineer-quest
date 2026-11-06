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
// リザルトは常に全問正解への到達点。初回全正解だったかだけを事実どおりに称える。
const { phaseResultPraise } = load(`${root}/bfs/unit/unitResult.presentation.ts`);
assert.equal(phaseResultPraise({ totalQuestions: 2, firstAttemptCorrect: 2 }), "やった！ 全問、初回で正解しました！");
for (const firstAttemptCorrect of [0, 1]) {
  const summary = Object.freeze({ totalQuestions: 2, firstAttemptCorrect });
  assert.equal(phaseResultPraise(summary), "最後まで取り組んで、全問正解にたどり着きました！");
  assert.equal(summary.firstAttemptCorrect, firstAttemptCorrect, "Presentation does not rewrite the score");
}
const standardPraise = "やった！ 確認問題を最後まで解き切りました！";
for (const summary of [undefined, {}, { totalQuestions: 2 }, { firstAttemptCorrect: 2 },
  { totalQuestions: 0, firstAttemptCorrect: 0 }, { totalQuestions: 2, firstAttemptCorrect: 3 },
  { totalQuestions: 2, firstAttemptCorrect: -1 }, { totalQuestions: 2, firstAttemptCorrect: 0.5 },
  { totalQuestions: NaN, firstAttemptCorrect: 2 }]) {
  assert.equal(phaseResultPraise(summary), standardPraise, "Missing / invalid counts must not invent first-attempt success");
}

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
const confetti = animated.find(node => Object.hasOwn(node.props, "data-phase-result-confetti"));
assert.equal(confetti.props["aria-hidden"], "true", "Confetti is decorative");
assert.equal(confetti.props.sx.pointerEvents, "none", "Confetti never intercepts next / review actions");
assert.equal(confetti.props.sx.position, "fixed");
assert.equal(confetti.props.sx.left, 0);
assert.equal(confetti.props.sx.right, 0, "Confetti spans the screen, including outside the last-answer symbol");
assert.equal(confetti.props.sx.height, "85dvh");
assert.ok(confetti.props.sx.zIndex < 1300, "Reward dialogs remain above the confetti");
const particles = animated.filter(node => Object.hasOwn(node.props, "data-confetti-piece"));
assert.ok(particles.length >= 100 && particles.length <= 140, "Confetti must remain clearly visible on large screens");
assert.deepEqual([...new Set(particles.map(node => node.props.sx.left))].sort(), ["12%", "88%"], "Exactly two party-popper origins");
for (const side of ["left", "right"]) {
  const burst = particles.filter(node => node.props["data-confetti-origin"] === side);
  assert.equal(burst.length, 60);
  assert.ok(burst.every(node => node.props.sx.top === "70%"), "Launch from the lower sides, not a rain band");
  const horizontalSpread = burst.map(node => parseFloat(node.props.animate.x[2]));
  assert.ok(Math.max(...horizontalSpread) - Math.min(...horizontalSpread) > 25, "Each popper opens into a fan");
  assert.ok(burst.every(node => node.props.transition.delay <= 0.11), "Each pop is a simultaneous burst");
}
for (const particle of particles) {
  assert.equal(particle.props.initial.opacity, 0);
  assert.equal(particle.props.animate.x[0], "0vw");
  const vertical = particle.props.animate.y.map(parseFloat);
  assert.equal(vertical[0], 0);
  assert.ok(vertical[1] < 0 && vertical[2] < vertical[1], "Confetti shoots upwards first");
  assert.ok(vertical[3] > vertical[2] && vertical.at(-1) > 0, "After the apex, confetti falls below its origin");
  assert.ok(particle.props.transition.times[2] <= 0.2, "The upward pop is quick; the fall provides the afterglow");
  assert.equal(particle.props.animate.opacity.at(-1), 0, "Confetti ends invisible");
  assert.ok(particle.props.transition.duration >= 3 && particle.props.transition.duration + particle.props.transition.delay <= 5,
    "Keep confetti visible beyond the 1.5-second answer symbol, then finish");
  assert.ok(particle.props.sx.width >= 10 && particle.props.sx.height >= 14);
  assert.equal(particle.props.transition.repeat, 0);
}
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
assert.ok(!still.some(node => Object.hasOwn(node.props, "data-confetti-piece")), "Reduced motion omits confetti");
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
    assert.ok(html.includes(phaseResultPraise(summary)), "Both phase screens use the same praise function");
    assert.ok(html.includes("次のフェーズへ進む"), "Next remains immediately available");
    assert.ok(!html.includes("data-phase-result-confetti"), "Reduced-motion markup is complete without decoration");
    assert.doesNotMatch(html, /mascot|Mascot/);
  }
}
reducedMotion = false;
const celebrationSource = read(`${root}/bfs/unit/UnitResultCelebration.tsx`);
assert.doesNotMatch(celebrationSource, /mascot|Mascot|useSoundEffect|useLearningRewards|setTimeout|setInterval|whileInView|onAnimationComplete|Math\.random/);
assert.match(celebrationSource, /prefers-reduced-motion: reduce/, "CSS also stops animation before hydration");
const resultSource = read(`${root}/bfs/unit/UnitResultScreens.tsx`);
const phaseResultSource = resultSource.slice(resultSource.indexOf("export function UnitResultScreen"), resultSource.indexOf("function summaryLine"));
const finalResultSource = resultSource.slice(resultSource.indexOf("export function UnitFinalResult"));
assert.match(phaseResultSource, /<UnitResultCelebration heading=\{phase\.result\.heading\}/);
assert.match(phaseResultSource, /phaseResultPraise\(summary\)/);
assert.doesNotMatch(phaseResultSource, /mascot|Mascot|<UnitResultCelebration[^>]*key=/);
assert.doesNotMatch(finalResultSource, /UnitResultCelebration|phaseResultPraise/, "The final result is outside #144");
assert.match(container, /<UnitResultScreen phase=\{bfsUnitPhases\[screen\.index\]\} summary=\{summaries\[screen\.index\]\}/);

console.log("verifyBfsUnitFlow: OK");
