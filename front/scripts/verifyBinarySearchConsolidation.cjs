const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const ts = require("typescript"), React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
function createLoader(overrides = {}) {
  const cache = new Map();
  return function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename);
    const exports = {}; cache.set(filename, exports);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(source, { exports, require: name => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (!name.startsWith(".")) return require(name);
      const base = path.resolve(path.dirname(filename), name);
      return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
    } }, { filename });
    return exports;
  };
}
const root = path.resolve(__dirname, "../src/features/learning");
const file = relative => `${root}/${relative}`;
const load = createLoader();
const plain = value => JSON.parse(JSON.stringify(value));
const { binarySearchConsolidationContent: content, validateBinarySearchConsolidation } = load(file("binary-search/consolidation/consolidation.content.ts"));
const binarySearch = load(file("binary-search/binarySearch.ts"));
const { binarySearchCodeMappingContent: mapping } = load(file("binary-search/code-mapping/codeMapping.content.ts"));
const { binarySearchCode: code } = load(file("binary-search/code-mapping/binarySearchCode.ts"));
const { toArrayBars } = load(file("binary-search/execution/BinarySearchExecutionCanvas.tsx"));
const { selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateArrayBarsCanvas } = load(file("player/arrayBars.types.ts"));
const { createAssessmentState, activeQuestion, answerQuestion, advanceAssessment, assessmentComplete, diagnoseAssessment, sameAnswer } = load(file("assessment/assessment.ts"));
const [q1, q2, q3, q4] = content.questions;

// 基準データ §3 フェーズ6の構成（転移タップ・不在の選択・Parsons・前提の選択の4問）。
validateBinarySearchConsolidation(content);
assert.equal(content.id, "binary-search-consolidation"); assert.equal(content.phase, 6); assert.equal(content.stageName, "応用問題");
assert.equal(content.questions.length, 4);
assert.equal(content.code, code); assert.equal(code.id, "binary-search-v1"); assert.equal(code.version, 1);
const stageBracket = name => `${String.fromCharCode(0x3010)}${name}${String.fromCharCode(0x3011)}`;
assert.equal(content.completion, `理解の状況が確認できました。それでは${stageBracket("自分で実装")}に進み、自分の手でコードを完成させましょう！`);
assert.deepEqual(plain(content.questions.map(q => [q.id, q.kind, q.tags[0]])), [
  ["first-center-transfer", "node", "新しいリストでの真ん中の位置"],
  ["absent-target", "choice", "探す値が無いときの終わり方"],
  ["whole-code-order", "parsons", "コード全体の流れ"],
  ["why-sorted-matters", "choice", "並んでいることが前提の理由"],
]);

// 教材モジュールを使わず、基準データ §2 の参照コードの手順から実行記録を独立に再実装する。
function binarySearchTrace(values, target) {
  const probes = [];
  let lo = 0, hi = values.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const value = values[mid];
    if (value === target) { probes.push({ lo, hi, mid, value, outcome: "hit" }); return { probes, result: mid }; }
    if (value < target) { probes.push({ lo, hi, mid, value, outcome: "drop-left" }); lo = mid + 1; }
    else { probes.push({ lo, hi, mid, value, outcome: "drop-right" }); hi = mid - 1; }
  }
  return { probes, result: -1 };
}
// 共有の組み立て（binarySearch.ts）が独立トレースと一致することを先に固定する。
const MAIN = [3, 7, 12, 19, 25, 31, 42], TRANSFER = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], UNSORTED = [25, 3, 42, 7, 19];
for (const [values, target] of [[MAIN, 25], [TRANSFER, 23], [MAIN, 20], [UNSORTED, 7]]) {
  const independent = binarySearchTrace(values, target);
  assert.deepEqual(plain(binarySearch.binarySearchProbes(values, target)), independent.probes, "Shared builder matches the independent trace");
  assert.equal(binarySearch.runBinarySearch(values, target), independent.result, "Shared runner matches the independent trace");
}

// Q1: 転移用の検証済みトレースと、場面・候補・正解の一致。
const transfer = binarySearchTrace(TRANSFER, 23);
assert.deepEqual(transfer.probes.map(probe => [probe.lo, probe.hi, probe.mid, probe.value, probe.outcome]), [
  [0, 9, 4, 16, "drop-left"], [5, 9, 7, 56, "drop-right"], [5, 6, 5, 23, "hit"],
], "Independent transfer trace");
assert.equal(transfer.result, 5, "Transfer search finds 23 at index 5");
assert.equal(q1.prompt, "新しいリスト [2, 5, 8, 12, 16, 23, 38, 56, 72, 91] で 23 を探すとき、最初に調べる真ん中のマスはどれか");
assert.deepEqual(plain(q1.scene.state.values), TRANSFER);
assert.deepEqual(plain(q1.scene.state.cellStatuses), TRANSFER.map(() => "idle"), "Opening scene: the whole list is still in range");
assert.equal(q1.scene.state.comparing, null);
assert.equal(q1.scene.state.fixedFrom, TRANSFER.length);
assert.deepEqual(plain(q1.scene.highlights), []);
assert.equal(q1.correctAnswer.nodeId, String(transfer.probes[0].mid));
assert.equal(q1.correctAnswer.nodeId, "4");
assert.equal(q1.allowNone, false);
assert.deepEqual(plain(q1.nodeIds), TRANSFER.map((_, index) => String(index)), "Every cell of the fresh range is a candidate");
validateArrayBarsCanvas(q1.scene);
// 場面は単元盤面型の開始スナップショットを、フェーズ2・3と同じ写像で変換したものと一致する。
assert.deepEqual(plain(q1.scene), plain(toArrayBars({
  data: { kind: "binary-search-execution" },
  state: { values: TRANSFER, target: 23, lo: 0, hi: 9, mid: null, cells: TRANSFER.map(() => "in-range") },
  highlights: [],
})), "Q1 scene equals the canonical conversion of the opening snapshot");

// Q2: 不在ケース。独立実行（比較列 19 → 31 → 25、結果 -1）から正解を裏づけ、誤答3件を反証する。
const absent = binarySearchTrace(MAIN, 20);
assert.deepEqual(absent.probes.map(probe => probe.value), [19, 31, 25], "Absent case follows the same probe path as the main target");
assert.deepEqual(absent.probes.map(probe => probe.outcome), ["drop-left", "drop-right", "drop-right"]);
assert.equal(absent.result, -1, "The value is absent: the search ends with -1, not with a find");
assert.equal(absent.probes.length, 3, "The search does not stop at the first probe");
assert.equal(absent.probes.at(-1).value, 25, "The last single candidate is 25, not 20");
assert.equal(q2.choices.length, 4);
assert.equal(q2.correctAnswer.choiceId, "narrows-to-empty");
assert.equal(q2.choices.find(choice => choice.id === "narrows-to-empty").text, "最後の1個まで絞っても 20 はなく、範囲が空になって探索が終わる");
assert.deepEqual(plain(q2.scene.state.values), MAIN);
assert.deepEqual(plain(q2.scene.state.cellStatuses), ["completed", "completed", "completed", "completed", "processing", "completed", "completed"],
  "Scene is the final probe: only the last candidate (25) is being looked at");
validateArrayBarsCanvas(q2.scene);

// Q4: 未整列リストでは、真ん中と比べて捨てた側に探す値が残ることを独立実行で示す。
const unsorted = binarySearchTrace(UNSORTED, 7);
assert.deepEqual(unsorted.probes.map(probe => [probe.mid, probe.value, probe.outcome]), [
  [2, 42, "drop-right"], [0, 25, "drop-right"],
], "Unsorted search drops the right side first, where 7 actually is");
assert.equal(unsorted.result, -1);
assert(UNSORTED.includes(7) && UNSORTED.indexOf(7) === 3, "7 exists in the dropped right side");
// 誤答の反証: 真ん中は個数から決まり（最初の mid=2）、範囲は半分ずつ絞れており（5 → 2 → 空）、
// 入れ替えのない手順そのものは整列済みリストでは正しく動く（主教材で結果 4）。
assert.equal(binarySearchTrace(MAIN, 25).result, 4, "The same no-swap procedure succeeds on a sorted list");
assert.deepEqual(plain(q4.scene.state.values), UNSORTED);
assert.equal(q4.scene.state.fixedFrom, UNSORTED.length);
assert.equal(q4.choices.length, 4);
assert.equal(q4.correctAnswer.choiceId, "drop-assumes-sorted");
assert.equal(q4.choices.find(choice => choice.id === "drop-assumes-sorted").text, "どちら側を捨てるかの判断が、数字が小さい順に並んでいることを前提にしているから");
validateArrayBarsCanvas(q4.scene);

// 復習はすべてフェーズ4の元フレームを参照のまま使う（新しいリストの答え合わせは作らない）。
for (const question of content.questions) {
  const review = selectReviewContent(mapping, question.reviewStepIds);
  review.steps.forEach((step, index) => assert.equal(step, mapping.steps.find(frame => frame.id === question.reviewStepIds[index])));
  assert(question.instruction.trim()); assert(question.correctFeedback.trim()); assert(question.incorrectFeedback.trim());
  assert(!/完璧|完全に理解|マスター/u.test(question.correctFeedback), "No overpraise in correct feedback");
}
assert.deepEqual(plain(q1.reviewStepIds), ["execution-range-full", "execution-probe-1-mid", "execution-range-after-drop-left", "execution-probe-2-mid"]);
assert.deepEqual(plain(q2.reviewStepIds), ["execution-probe-2-drop-right", "execution-range-single", "execution-probe-3-mid", "if-hit-3"]);
assert.equal(q3.reviewStepIds.length, mapping.steps.length, "Parsons review covers every phase-4 frame");
assert.equal(mapping.steps.length, 18, "Phase 4 has 18 frames");

// Q3: Parsons は参照コード12行から主要8行に絞る（初期化2行と、elif と対称な else 側2行を外す）。
// 残した8行はすべて順序が意味を持つため、順序自由な行は設けない。
const canonicalIds = plain(code.lines.map(line => line.id));
assert.deepEqual(canonicalIds, [
  "define-function", "init-lo", "init-hi", "while-range", "compute-mid", "if-hit",
  "return-mid", "elif-smaller", "drop-left", "else-larger", "drop-right", "return-missing",
]);
const selectedIds = ["define-function", "while-range", "compute-mid", "if-hit", "return-mid", "elif-smaller", "drop-left", "return-missing"];
assert.deepEqual([...q3.lineIds].sort(), [...selectedIds].sort());
assert.notDeepEqual(plain(q3.lineIds), selectedIds, "Presentation order is shuffled");
assert.deepEqual(plain(q3.correctAnswer.lineIds), selectedIds, "Answer follows the canonical order of the selected lines");
assert.equal(q3.interchangeableLineGroups, undefined, "No interchangeable line groups");
const { ParsonsBoard } = load(file("components/assessment/ParsonsBoard.tsx"));
const parsonsHtml = renderToStaticMarkup(React.createElement(ParsonsBoard, { question: q3, code, onAnswer: () => {} }));
// フェード型: 固定行は正解位置に固定表示され、可動行は初期並びの相対順序のまま残りの位置を埋める。
assert.deepEqual(plain(q3.fixedLineIds), ["define-function", "return-missing"], "Faded split as designed");
{
  const fixedSet = new Set(q3.fixedLineIds);
  const movableInitial = q3.lineIds.filter(id => !fixedSet.has(id));
  let cursor = 0;
  const expectedOrder = q3.correctAnswer.lineIds.map(id => fixedSet.has(id) ? id : movableInitial[cursor++]);
  assert.deepEqual([...parsonsHtml.matchAll(/data-parsons-line-id="([^"]+)"/g)].map(match => match[1]), [...expectedOrder], "Fixed lines render pinned at their solution positions");
  const fixedRendered = [...parsonsHtml.matchAll(/<div[^>]*data-parsons-fixed="true"[^>]*>/g)].map(tag => /data-parsons-line-id="([^"]+)"/.exec(tag[0])[1]);
  assert.deepEqual(fixedRendered, plain(q3.fixedLineIds), "Exactly the fixed lines render as non-operable");
  const { parsonsMovableSegments } = load(file("assessment/parsonsOrderFeedback.ts"));
  for (const segment of parsonsMovableSegments(q3.correctAnswer.lineIds, q3.fixedLineIds)) {
    assert.deepEqual([...q3.lineIds.filter(id => segment.includes(id))].sort(), [...segment].sort(), "Solution is reachable by reordering within each segment");
  }
  const parsonsBoardSource = fs.readFileSync(file("components/assessment/ParsonsBoard.tsx"), "utf8");
  assert.match(parsonsBoardSource, /data-parsons-fixed="true"/, "board renders fixed rows with the non-operable marker");
}
const parsonsText = parsonsHtml.replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
for (const line of code.lines.filter(line => selectedIds.includes(line.id))) assert(parsonsText.includes(line.text), "Preserve original indentation and every selected line");

// 実描画: Q1は候補マスごとに回答ボタン1つ、選択問題の場面は表示のみ。正解後は全ボタンが固定される。
const { BinarySearchConsolidationCanvas } = load(file("binary-search/consolidation/BinarySearchConsolidationCanvas.tsx"));
const sceneBeforeRender = JSON.stringify(q1.scene);
const q1Html = renderToStaticMarkup(React.createElement(BinarySearchConsolidationCanvas, { canvas: q1.scene, label: q1.prompt, questionId: q1.id, cellIds: q1.nodeIds, onAnswer() {} }));
assert.equal((q1Html.match(/<button\b/g) || []).length, q1.nodeIds.length, "One answer button per candidate cell");
for (const id of q1.nodeIds) {
  const index = Number(id);
  assert.equal(q1Html.split(`aria-label="左から${index + 1}番目のマス（値 ${q1.scene.state.values[index]}）を選ぶ"`).length - 1, 1, `One labelled button for cell ${id}`);
}
assert.equal(JSON.stringify(q1.scene), sceneBeforeRender, "Rendering must not mutate the scene");
const lockedHtml = renderToStaticMarkup(React.createElement(BinarySearchConsolidationCanvas, { canvas: q1.scene, label: q1.prompt, questionId: q1.id, cellIds: q1.nodeIds, disabled: true, onAnswer() {} }));
assert.equal((lockedHtml.match(/ disabled=""/g) || []).length, q1.nodeIds.length, "Correct responses lock every answer control");
for (const question of [q2, q4]) {
  const html = renderToStaticMarkup(React.createElement(BinarySearchConsolidationCanvas, { canvas: question.scene, label: question.prompt, onAnswer() {} }));
  assert.equal((html.match(/<button\b/g) || []).length, 0, "Choice scenes are display-only");
}

// 共通エンジンの進行: 回答では進まず、ボタンで進む。正解しなくても完了でき（ソフトゲート）、
// 診断は初回回答だけから導く。
const wrong = question => question.kind === "node" ? { kind: "node", nodeId: question.nodeIds.find(id => id !== question.correctAnswer.nodeId) }
  : question.kind === "choice" ? { kind: "choice", choiceId: question.choices.find(choice => choice.id !== question.correctAnswer.choiceId).id }
  : { kind: "order", lineIds: [...question.lineIds] };
function complete(mask, retry) {
  let state = createAssessmentState(content);
  assert.throws(() => diagnoseAssessment(content, state), /incomplete/);
  for (const [index, question] of content.questions.entries()) {
    assert.equal(activeQuestion(content, state), question);
    assert.equal(advanceAssessment(content, state, question.id), state, "Do not skip unanswered questions");
    assert.equal(answerQuestion(content, state, question.id, { kind: "choice", choiceId: "missing" }), state);
    const before = state;
    state = answerQuestion(content, state, question.id, mask[index] ? question.correctAnswer : wrong(question));
    assert.equal(before.records[index].attemptCount, 0, "Do not mutate prior state");
    assert.equal(activeQuestion(content, state), question, "Stay for optional retry and feedback");
    if (retry) state = answerQuestion(content, state, question.id, question.correctAnswer);
    assert.equal(state.records[index].firstCorrect, mask[index]);
    state = advanceAssessment(content, state, question.id);
    assert.equal(advanceAssessment(content, state, question.id), state, "Stale next events cannot skip another question");
    assert.equal(answerQuestion(content, state, question.id, question.correctAnswer), state);
  }
  assert(assessmentComplete(content, state)); assert.equal(activeQuestion(content, state), null);
  const result = diagnoseAssessment(content, state);
  assert.equal(result.correct, mask.filter(Boolean).length);
  assert.deepEqual(plain(result.tags.map(tag => tag.passed)), mask);
  return state;
}
const failed = complete([false, false, false, false], false);
assert(failed.records.every(record => !record.solved), "0/4 can finish without correct answers");
const retried = complete([false, false, false, false], true);
assert(retried.records.every(record => record.solved && record.firstCorrect === false && record.attemptCount === 2));
complete([true, false, true, false], true);
complete([true, true, true, true], false);

// Parsons の回答検証: 不完全・重複した並びは拒否し、提出した配列は複製して記録する。
// 順序自由な行はないため、隣接するどの2行の入れ替えも不正解にする。
let parsonsState = createAssessmentState(content);
for (const question of content.questions.slice(0, 2)) {
  parsonsState = advanceAssessment(content, answerQuestion(content, parsonsState, question.id, question.correctAnswer), question.id);
}
assert.equal(answerQuestion(content, parsonsState, q3.id, { kind: "order", lineIds: selectedIds.slice(1) }), parsonsState);
assert.equal(answerQuestion(content, parsonsState, q3.id, { kind: "order", lineIds: selectedIds.map(() => selectedIds[0]) }), parsonsState);
const mutable = [...selectedIds];
const answered = answerQuestion(content, parsonsState, q3.id, { kind: "order", lineIds: mutable });
mutable.reverse();
assert.deepEqual(plain(answered.records[2].attempts[0].answer.lineIds), selectedIds, "Clone submitted order arrays");
assert(sameAnswer(q3.correctAnswer, answered.records[2].attempts[0].answer));
assert(!sameAnswer(q3.correctAnswer, wrong(q3)));
for (let index = 0; index < selectedIds.length - 1; index++) {
  const swapped = [...selectedIds];
  [swapped[index], swapped[index + 1]] = [swapped[index + 1], swapped[index]];
  assert.equal(answerQuestion(content, parsonsState, q3.id, { kind: "order", lineIds: swapped }).records[2].firstCorrect,
    false, `Adjacent swap must be incorrect: ${selectedIds[index]}/${selectedIds[index + 1]}`);
}

// 検証の負系: 壊れたコンテンツは読み込み時の検証で落とす。
assert.doesNotThrow(() => validateBinarySearchConsolidation({ ...content, questions: plain(content.questions) }), "A structural clone still validates");
function rejects(change) { const broken = { ...content, questions: plain(content.questions) }; change(broken); assert.throws(() => validateBinarySearchConsolidation(broken)); }
rejects(broken => broken.questions[2].lineIds.pop());
rejects(broken => broken.questions[2].lineIds[1] = broken.questions[2].lineIds[0]);
rejects(broken => broken.questions[2].correctAnswer.lineIds.reverse());
rejects(broken => broken.questions[2].interchangeableLineGroups = [["define-function", "while-range"]]);
rejects(broken => broken.questions[1].choices[1].text = broken.questions[1].choices[0].text);
rejects(broken => broken.questions[0].correctAnswer.nodeId = "0");
rejects(broken => broken.questions[0].scene.state.values = [2, 5, 8, 12, 16, 23, 38, 56, 91, 72]);
rejects(broken => broken.questions[1].reviewStepIds = ["missing"]);
rejects(broken => broken.questions[3].tags = []);

// プレビューの契約: 主ボタンで進み、正解後は入力を固定し、復習はフェーズ4の内容で開く。
const previewSource = fs.readFileSync(file("binary-search/consolidation/BinarySearchConsolidationPreview.tsx"), "utf8");
assert.match(previewSource, /height: "min\(54dvh, 600px\)", flexShrink: 0/, "figure height is fixed by the question and viewport only (#298)");
assert.match(previewSource, /<AssessmentLayout/, "preview uses the shared scroll layout");
assert.match(fs.readFileSync(path.resolve(__dirname, "../src/features/learning/components/layouts/AssessmentLayout.tsx"), "utf8"), /flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column"/, "question body flows in the middle scroll region (#298)");
assert.doesNotMatch(previewSource, /marginTop: "auto",/, "safe centering via margin auto is retired (#298)");
assert.match(previewSource, /borderTop: `1px solid/, "advance actions live in the fixed bottom zone (#298)");
assert.match(previewSource, /variant="contained" onClick=\{\(\) => setSession\(current => advanceAssessment/);
assert.match(previewSource, /disabled=\{attempt\?\.correct === true\}/, "inputs lock after a correct answer");
assert.match(previewSource, /content=\{binarySearchCodeMappingContent\}/, "review opens the phase-4 content");
// Parsons の行に現れる lo / hi / mid は、この単元では記号の定義が画面に無いと読めない（Issue #331）。
const parsonsQuestion = content.questions.find(question => question.kind === "parsons");
assert(parsonsQuestion.definitions?.includes("lo = 探索範囲の左端の位置") && parsonsQuestion.definitions?.includes("hi = 探索範囲の右端の位置"),
  "Parsons question defines lo and hi on screen");
assert.match(previewSource, /question\.definitions/, "preview renders the definitions line");
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "binary-search-consolidation"'), "Standalone preview is registered");
assert.match(previewSource, /orderFeedback=\{\{ solutionLineIds: question\.correctAnswer\.lineIds, interchangeableLineGroups: question\.interchangeableLineGroups, active: \(record\?\.attemptCount \?\? 0\) > 0, submittedLineIds: attempt\?\.answer\.kind === "order" \? attempt\.answer\.lineIds : undefined \}\}/, "parsons order feedback is wired (#327, frozen at answer time #354)");
console.log("Binary-search consolidation verified: transfer tap from the independent [2,5,8,12,16,23,38,56,72,91] trace, absent-case refutations on the shared 19-31-25 probe path, 8-line Parsons with no interchangeable lines, unsorted-list premise refutations, soft-gate completion and first-attempt diagnosis.");
