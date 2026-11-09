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
const { bubbleSortConsolidationContent: content, validateBubbleSortConsolidation } = load(file("bubble-sort/consolidation/consolidation.content.ts"));
const bubbleSort = load(file("bubble-sort/bubbleSort.ts"));
const { bubbleSortExecutionContent: execution } = load(file("bubble-sort/execution/execution.content.ts"));
const { bubbleSortCodeMappingContent: mapping } = load(file("bubble-sort/code-mapping/codeMapping.content.ts"));
const { bubbleSortCode: code } = load(file("bubble-sort/code-mapping/bubbleSortCode.ts"));
const { getLearningStep, selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateArrayBarsCanvas } = load(file("player/arrayBars.types.ts"));
const { createAssessmentState, activeQuestion, answerQuestion, advanceAssessment, assessmentComplete, diagnoseAssessment, sameAnswer } = load(file("assessment/assessment.ts"));
const [q1, q2, q3, q4] = content.questions;

// 基準データ §3 フェーズ6の構成（転移タップ・並び済み配列の選択・理由の選択・Parsons の4問）。
validateBubbleSortConsolidation(content);
assert.equal(content.id, "bubble-sort-consolidation"); assert.equal(content.phase, 6); assert.equal(content.stageName, "応用問題");
assert.equal(content.questions.length, 4);
assert.equal(content.code, code); assert.equal(code.id, "bubble-sort-v1"); assert.equal(code.version, 1);
const stageBracket = name => `${String.fromCharCode(0x3010)}${name}${String.fromCharCode(0x3011)}`;
assert.equal(content.completion, `理解の状況が確認できました。それでは${stageBracket("自分で実装")}に進み、自分の手でコードを完成させましょう！`);
assert.deepEqual(plain(content.questions.map(q => [q.id, q.kind, q.tags[0]])), [
  ["next-swap-pair", "node", "交換が起きるペアの追跡"],
  ["sorted-array-behavior", "choice", "並び済みの配列の扱い"],
  ["why-right-end-fixed", "choice", "右端が決まる理由"],
  ["whole-code-order", "parsons", "コード全体の流れ"],
]);

// 教材モジュールを使わず、基準データ §2 の参照コードの手順から実行記録を独立に再実装する。
function bubbleSortTrace(values) {
  const result = [...values];
  const n = result.length;
  const comparisons = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      const pair = [result[j], result[j + 1]];
      const swapped = result[j] > result[j + 1];
      if (swapped) { result[j] = pair[1]; result[j + 1] = pair[0]; }
      comparisons.push({ pass: i + 1, j, pair, swapped, after: [...result] });
    }
  }
  return comparisons;
}
// 共有の組み立て（bubbleSort.ts）が独立トレースと一致することを先に固定する。
for (const values of [[4, 2, 5, 1, 3], [3, 1, 4, 2], [1, 2, 3, 4]]) {
  assert.deepEqual(plain(bubbleSort.bubbleSortComparisons(values)), bubbleSortTrace(values), "Shared builder matches the independent trace");
}

// Q1: 転移用 [3, 1, 4, 2] の検証済みトレースと、場面・候補・正解の一致。
const transfer = bubbleSortTrace([3, 1, 4, 2]);
const transferPassOne = transfer.filter(comparison => comparison.pass === 1);
assert.deepEqual(transferPassOne.map(comparison => [comparison.j, comparison.pair, comparison.swapped]), [
  [0, [3, 1], true], [1, [3, 4], false], [2, [4, 2], true],
], "Independent transfer pass 1");
assert.deepEqual(transferPassOne.at(-1).after, [1, 3, 2, 4], "Scene values are the state after pass 1");
const transferFirstSwap = transfer.filter(comparison => comparison.pass === 2).find(comparison => comparison.swapped);
assert.deepEqual([transferFirstSwap.j, transferFirstSwap.pair], [1, [3, 2]], "First swap of pass 2");
assert.equal(q1.prompt, "この後、入れ替えが起きるペアの左側はどれか");
assert.deepEqual(plain(q1.scene.state.values), [1, 3, 2, 4]);
assert.equal(q1.scene.state.fixedFrom, 3, "The largest value 4 is fixed at the right end");
assert.equal(q1.scene.state.comparing, null);
assert.deepEqual(plain(q1.scene.highlights), []);
assert.equal(q1.correctAnswer.nodeId, String(transferFirstSwap.j));
assert.equal(q1.allowNone, false);
// 回答対象は未確定範囲のマスだけ（確定済みの右端の位置3を含まない）。フェーズ3 Q1 と同じ考え方。
assert.deepEqual(plain(q1.nodeIds), ["0", "1", "2"]);
assert(!q1.nodeIds.includes("3"), "The fixed right-end cell is not a candidate");
validateArrayBarsCanvas(q1.scene);

// Q2: 場面は [1, 2, 3, 4] の開始状態。独立実行（比較6回・交換0回・最後まで到達）から、
// 正解（交換なしでも比べ続け範囲が尽きて終わる）を裏づけ、誤答3件を反証する。
assert.deepEqual(plain(q2.scene.state.values), [1, 2, 3, 4]);
assert.equal(q2.scene.state.fixedFrom, 4, "Nothing is fixed at the start");
const sortedRun = bubbleSortTrace([1, 2, 3, 4]);
assert.equal(sortedRun.length, 6, "Comparisons continue to the end of the range: not finished after the first comparison");
assert.equal(sortedRun.filter(comparison => comparison.swapped).length, 0, "No swap happens, so swaps do not occur on every comparison");
assert.deepEqual(sortedRun.at(-1).after, [1, 2, 3, 4], "The process terminates with the sorted array: it does not loop forever");
assert.equal(q2.choices.length, 4);
assert.equal(q2.correctAnswer.choiceId, "no-swap-full-comparisons");
assert.equal(q2.choices.find(choice => choice.id === "no-swap-full-comparisons").text, "交換は一度も起きないが、比べることは範囲が尽きるまで行われる");
validateArrayBarsCanvas(q2.scene);

// Q3: 場面はフェーズ2の1周目の確定ステップそのもの。主教材の独立トレースから、
// 正解（大きい方が右へ移り、1周で最大値が右端に届く）を裏づけ、誤答3件を反証する。
assert.equal(q3.scene, getLearningStep(execution, "pass-end-1").canvas, "Q3 scene is the phase-2 pass-end board by reference");
const main = bubbleSortTrace([4, 2, 5, 1, 3]);
const mainPassOne = main.filter(comparison => comparison.pass === 1);
assert.deepEqual(mainPassOne.map(comparison => comparison.j), [0, 1, 2, 3], "Comparisons proceed from the left end: not from the right");
for (const comparison of main) {
  if (!comparison.swapped) continue;
  assert(comparison.pair[0] > comparison.pair[1]);
  assert.equal(comparison.after[comparison.j], comparison.pair[1]);
  assert.equal(comparison.after[comparison.j + 1], comparison.pair[0], "A swap moves the larger value one cell right, never the smaller");
}
assert.equal(mainPassOne.at(-1).after.at(-1), 5, "After one pass the largest value reaches the right end");
assert.notDeepEqual(mainPassOne[0].after, mainPassOne.at(-1).after, "The array changes during the pass: not sorted all at once at the end");
assert.equal(q3.choices.length, 4);
assert.equal(q3.correctAnswer.choiceId, "largest-moves-right");
assert.equal(q3.choices.find(choice => choice.id === "largest-moves-right").text, "比べるたびに大きい方が右へ移るので、1周すると一番大きい値が右端に届くため");
validateArrayBarsCanvas(q3.scene);

// 復習はすべてフェーズ4の元フレームを参照のまま使う（新しい配列の答え合わせは作らない）。
for (const question of content.questions) {
  const review = selectReviewContent(mapping, question.reviewStepIds);
  review.steps.forEach((step, index) => assert.equal(step, mapping.steps.find(frame => frame.id === question.reviewStepIds[index])));
  assert(question.instruction.trim()); assert(question.correctFeedback.trim()); assert(question.incorrectFeedback.trim());
  assert(!/完璧|完全に理解|マスター/u.test(question.correctFeedback), "No overpraise in correct feedback");
}
assert.deepEqual(plain(q1.reviewStepIds), ["for-compare-2-0", "execution-compare-2-0", "for-compare-2-1", "execution-compare-2-1"]);
assert.equal(getLearningStep(mapping, q1.stepId).canvas.highlights[0].id, "swap-values", "Q1 anchor points at the swap line");
assert.deepEqual(plain(q3.reviewStepIds), ["execution-compare-1-2", "execution-compare-1-3", "execution-pass-end-1"]);
assert.equal(q4.reviewStepIds.length, mapping.steps.length, "Parsons review covers every phase-4 frame");

// Q4: Parsons は参照コード8行すべて（妨害行なし、インデントは原文のまま）。
// バブルソートの行はすべて順序が意味を持つため、順序自由な行は設けない。
const canonicalIds = plain(code.lines.map(line => line.id));
assert.deepEqual(canonicalIds, ["define-function", "copy-values", "count-values", "for-pass", "for-compare", "if-larger", "swap-values", "return-result"]);
assert.deepEqual([...q4.lineIds].sort(), [...canonicalIds].sort());
assert.notDeepEqual(plain(q4.lineIds), canonicalIds, "Presentation order is shuffled");
assert.deepEqual(plain(q4.correctAnswer.lineIds), canonicalIds);
assert.equal(q4.interchangeableLineGroups, undefined, "No interchangeable line groups");
const { ParsonsBoard } = load(file("bfs/consolidation/ParsonsBoard.tsx"));
const parsonsHtml = renderToStaticMarkup(React.createElement(ParsonsBoard, { question: q4, code, onAnswer: () => {} }));
assert.deepEqual([...parsonsHtml.matchAll(/data-parsons-line-id="([^"]+)"/g)].map(match => match[1]), plain(q4.lineIds));
const parsonsText = parsonsHtml.replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
for (const line of code.lines) assert(parsonsText.includes(line.text), "Preserve original indentation and every line");

// 実描画: Q1は候補マスごとに回答ボタン1つ、選択問題の場面は表示のみ。正解後は全ボタンが固定される。
const { BubbleSortCheckCanvas } = load(file("bubble-sort/check/BubbleSortCheckCanvas.tsx"));
const sceneBeforeRender = JSON.stringify(q1.scene);
const q1Html = renderToStaticMarkup(React.createElement(BubbleSortCheckCanvas, { canvas: q1.scene, questionId: q1.id, cellIds: q1.nodeIds, onAnswer() {} }));
assert.equal((q1Html.match(/<button\b/g) || []).length, q1.nodeIds.length, "One answer button per candidate cell");
for (const id of q1.nodeIds) {
  const index = Number(id);
  assert.equal(q1Html.split(`aria-label="左から${index + 1}番目のマス（値 ${q1.scene.state.values[index]}）を選ぶ"`).length - 1, 1, `One labelled button for cell ${id}`);
}
assert.equal(JSON.stringify(q1.scene), sceneBeforeRender, "Rendering must not mutate the scene");
const lockedHtml = renderToStaticMarkup(React.createElement(BubbleSortCheckCanvas, { canvas: q1.scene, questionId: q1.id, cellIds: q1.nodeIds, disabled: true, onAnswer() {} }));
assert.equal((lockedHtml.match(/ disabled=""/g) || []).length, q1.nodeIds.length, "Correct responses lock every answer control");
for (const question of [q2, q3]) {
  const html = renderToStaticMarkup(React.createElement(BubbleSortCheckCanvas, { canvas: question.scene, onAnswer() {} }));
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
for (const question of content.questions.slice(0, 3)) {
  parsonsState = advanceAssessment(content, answerQuestion(content, parsonsState, question.id, question.correctAnswer), question.id);
}
assert.equal(answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: canonicalIds.slice(1) }), parsonsState);
assert.equal(answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: canonicalIds.map(() => canonicalIds[0]) }), parsonsState);
const mutable = [...canonicalIds];
const answered = answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: mutable });
mutable.reverse();
assert.deepEqual(plain(answered.records[3].attempts[0].answer.lineIds), canonicalIds, "Clone submitted order arrays");
assert(sameAnswer(q4.correctAnswer, answered.records[3].attempts[0].answer));
assert(!sameAnswer(q4.correctAnswer, wrong(q4)));
for (let index = 0; index < canonicalIds.length - 1; index++) {
  const swapped = [...canonicalIds];
  [swapped[index], swapped[index + 1]] = [swapped[index + 1], swapped[index]];
  assert.equal(answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: swapped }).records[3].firstCorrect,
    false, `Adjacent swap must be incorrect: ${canonicalIds[index]}/${canonicalIds[index + 1]}`);
}

// 検証の負系: 壊れたコンテンツは読み込み時の検証で落とす。
assert.doesNotThrow(() => validateBubbleSortConsolidation({ ...content, questions: plain(content.questions) }), "A structural clone still validates");
function rejects(change) { const broken = { ...content, questions: plain(content.questions) }; change(broken); assert.throws(() => validateBubbleSortConsolidation(broken)); }
rejects(broken => broken.questions[3].lineIds.pop());
rejects(broken => broken.questions[3].lineIds[1] = broken.questions[3].lineIds[0]);
rejects(broken => broken.questions[3].correctAnswer.lineIds.reverse());
rejects(broken => broken.questions[3].interchangeableLineGroups = [["copy-values", "count-values"]]);
rejects(broken => broken.questions[1].choices[1].text = broken.questions[1].choices[0].text);
rejects(broken => broken.questions[0].correctAnswer.nodeId = "0");
rejects(broken => broken.questions[0].scene.state.values = [1, 3, 4, 2]);
rejects(broken => broken.questions[0].scene.state.fixedFrom = 4);
rejects(broken => broken.questions[0].reviewStepIds = ["missing"]);
rejects(broken => broken.questions[2].tags = []);

// プレビューの契約: 主ボタンで進み、正解後は入力を固定し、復習はフェーズ4の内容で開く。
const previewSource = fs.readFileSync(file("bubble-sort/consolidation/BubbleSortConsolidationPreview.tsx"), "utf8");
assert.match(previewSource, /flex: "1 1 auto", minHeight: 0, maxHeight: "min\(54dvh, 600px\)"/);
assert.match(previewSource, /variant="contained" onClick=\{\(\) => setSession\(current => advanceAssessment/);
assert.match(previewSource, /disabled=\{attempt\?\.correct === true\}/, "inputs lock after a correct answer");
assert.match(previewSource, /content=\{bubbleSortCodeMappingContent\}/, "review opens the phase-4 content");
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "bubble-sort-consolidation"'), "Standalone preview is registered");
console.log("Bubble-sort consolidation verified: transfer tap from the independent [3,1,4,2] trace, sorted-array edge case refutations, right-end mechanism, 8-line Parsons with no interchangeable lines, soft-gate completion and first-attempt diagnosis.");
