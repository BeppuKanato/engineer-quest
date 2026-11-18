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
const cell = nodeId => ({ kind: "node", nodeId });
const choice = choiceId => ({ kind: "choice", choiceId });
const { bubbleSortCheckContent: content, getBubbleSortCheckScene } = load(file("bubble-sort/check/check.content.ts"));
const { bubbleSortExecutionContent: execution } = load(file("bubble-sort/execution/execution.content.ts"));
const sort = load(file("bubble-sort/bubbleSort.ts"));
const { getLearningStep: get, selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateArrayBarsCanvas } = load(file("player/arrayBars.types.ts"));
const { validateAssessment, createAssessmentState, answerQuestion, advanceAssessment, activeQuestion, assessmentComplete } = load(file("assessment/assessment.ts"));
const { newAnswerFeedback } = load(file("assessment/answerFeedbackState.ts"));
const [q1, q2, q3, q4, q5, q6, q7] = content.questions;
const nodeQuestions = content.questions.filter(question => !("kind" in question));
const choiceQuestions = content.questions.filter(question => "kind" in question);

// フェーズ3の構成（2026-11-17 の基準: フェーズ4が前提とする理解を一通り判断できるか）。
// 既存の連結2問に、交換なしの行き先・周の終わりの確定・次の周の再開・
// 範囲の縮小量（数値）・終了理由を足した7問。
assert.equal(content.id, "bubble-sort-check"); assert.equal(content.phase, 3); assert.equal(content.stageName, "動きの確認問題");
assert.equal(content.kind, "concept-check");
assert.equal(content.questions.length, 7);
assert.deepEqual(plain(content.questions.map(q => [q.id, q.prompt, q.stepId, q.tags[0]])), [
  ["next-pair", "次に比べるペアの左側のマスはどれか", "compare-1-1", "compare-order"],
  ["larger-destination", "比べた後、大きい方の 5 はどのマスへ行くか", "compare-1-1", "swap-destination"],
  ["larger-stays", "比べた後、大きい方の 4 はどのマスへ行くか", "compare-2-0", "stay-destination"],
  ["fixed-at-pass-end", "この周で、右端に決まったマスはどれか", "compare-1-3", "pass-end-fixed"],
  ["pass-two-first-pair", "2周目に、最初に比べるペアの左側のマスはどれか", "pass-end-1", "pass-restart"],
  ["pass-two-pair-count", "2周目に比べるペアは、全部で何組ですか", "pass-end-1", "range-shrink"],
  ["why-finished", "比べる作業がここで終わるのは、なぜですか", "compare-4-0", "termination"],
]);
assert.deepEqual(plain(nodeQuestions.map(q => q.correctAnswer.nodeId)), ["2", "3", "1", "4", "0"]);
assert.deepEqual(plain(choiceQuestions.map(q => q.correctAnswer.choiceId)), ["three", "range-exhausted"]);
// 状況キャプション（Issue #297）: 場面で起きた比較は完了形、前提の比較は未来形、
// 選択肢設問は場面の時点を示し、青ペアや盤面の時制を文章で固定する。
assert.equal(q1.situation, "4 と 5 を比べて、そのままにしました。");
assert.equal(q2.situation, "次に、5 と 1 を比べます。");
assert.equal(q3.situation, "2 と 4 を比べて、そのままにしました。");
assert.equal(q4.situation, "5 と 3 を比べて、入れ替えました。これで、1周目の比べる作業は終わりです。");
assert.equal(q5.situation, "一番大きい 5 が、右端に決まりました。");
assert.equal(q6.situation, "5 が右端に決まって、2周目が始まるところです。");
assert.equal(q7.situation, "1 と 2 を比べて、そのままにしました。これが最後の比較です。");
assert.equal(q1.requires, null);
assert.deepEqual(plain(q2.requires), { questionId: q1.id, answer: plain(q1.correctAnswer) });
assert.equal(q3.requires, null);
assert.equal(q4.requires, null);
assert.deepEqual(plain(q5.requires), { questionId: q4.id, answer: plain(q4.correctAnswer) });
assert.equal(q6.requires, null);
assert.equal(q7.requires, null);
assert.equal(content.completion.stepId, "complete");
assert(nodeQuestions.every(q => q.allowNone === false), "No none option: every tap question has an actual cell");

// 正解は実行記録と一致しなければならない（独立照合）。
const comparisons = plain(sort.bubbleSortComparisons(sort.bubbleSortMainValues));
assert.deepEqual(comparisons[2], { pass: 1, j: 2, pair: [5, 1], swapped: true, after: [2, 4, 1, 5, 3] });
assert.equal(q1.correctAnswer.nodeId, String(comparisons[2].j), "Q1 answer is the left of the next pair");
assert.equal(comparisons[2].after[Number(q2.correctAnswer.nodeId)], 5, "Q2 answer is where 5 lands after the comparison");
assert.equal(Number(q2.correctAnswer.nodeId), comparisons[2].j + 1, "The swap moves 5 one cell right");
const stay = comparisons.find(comparison => comparison.pass === 2 && comparison.j === 0);
assert.deepEqual(stay, { pass: 2, j: 0, pair: [2, 4], swapped: false, after: [2, 4, 1, 3, 5] });
assert.equal(stay.after[Number(q3.correctAnswer.nodeId)], 4, "Q3 answer is where 4 stays after a no-swap comparison");
assert.equal(Number(q3.correctAnswer.nodeId), stay.j + 1, "Without a swap the larger value keeps its cell");
const passEndOne = get(execution, "pass-end-1");
assert.equal(Number(q4.correctAnswer.nodeId), passEndOne.canvas.state.values.length - 1, "Q4 answer is the rightmost cell");
assert.equal(passEndOne.canvas.state.values[Number(q4.correctAnswer.nodeId)], Math.max(...passEndOne.canvas.state.values), "The fixed cell holds the largest value");
const passTwo = comparisons.filter(comparison => comparison.pass === 2);
assert.equal(q5.correctAnswer.nodeId, String(passTwo[0].j), "Q5 answer restarts at the left edge");
assert.equal(passTwo.length, 3, "Pass 2 compares three pairs");
assert.equal(q6.choices.find(option => option.id === q6.correctAnswer.choiceId).text, `${passTwo.length}組`, "Q6 answer counts the pass-2 pairs");
assert.equal(comparisons.at(-1).pass, 4, "The trace ends after pass 4");
assert.equal(get(execution, "compare-4-0").canvas.state.values.join(","), "1,2,3,4,5", "The last comparison already shows the sorted array");

// 場面: Q1はフェーズ2のステップ canvas そのもの、Q2は同じ配列で比べるペアだけが移る。
// 追加した設問の場面も、フェーズ2のステップ canvas を参照のまま使う。
const step = get(execution, "compare-1-1");
const scene1 = getBubbleSortCheckScene(q1), scene2 = getBubbleSortCheckScene(q2);
assert.equal(scene1, step.canvas, "Q1 scene is the phase-2 step canvas by reference");
assert.deepEqual(plain(step.canvas.state.values), [2, 4, 5, 1, 3], "Scene is the board after two comparisons");
assert.deepEqual(plain(scene2.state.values), plain(step.canvas.state.values), "Q2 scene keeps the same values");
assert.deepEqual(plain(scene2.state.comparing), [2, 3], "Q2 scene marks the premise pair as comparing");
assert.equal(scene2.state.fixedFrom, step.canvas.state.fixedFrom);
assert.deepEqual(plain(scene2.highlights), []);
for (const q of content.questions) {
  const scene = getBubbleSortCheckScene(q);
  validateArrayBarsCanvas(scene);
  if (q !== q2) assert.equal(scene, get(execution, q.stepId).canvas, `${q.id} scene is the phase-2 step canvas by reference`);
}
assert.deepEqual(plain(getBubbleSortCheckScene(q3).state.comparing), [0, 1], "Q3 scene compares the first pair of pass 2");
assert.deepEqual(plain(getBubbleSortCheckScene(q4).state.comparing), [3, 4], "Q4 scene compares the last pair of pass 1");
assert.equal(getBubbleSortCheckScene(q5).state.fixedFrom, 4, "Q5/Q6 scene has the largest value fixed");
assert.equal(getBubbleSortCheckScene(q6).state.fixedFrom, 4);

// 回答対象: タップ設問は場面に応じたマスだけに限る。
assert.deepEqual(plain(q1.nodeIds), ["0", "1", "2", "3", "4"], "Q1 candidates are the unfixed cells");
assert.deepEqual(plain(q2.nodeIds), ["2", "3"], "Q2 candidates are the compared pair");
assert.deepEqual(plain(q3.nodeIds), ["0", "1"], "Q3 candidates are the compared pair");
assert.deepEqual(plain(q4.nodeIds), ["0", "1", "2", "3", "4"], "Q4 candidates are all cells");
assert.deepEqual(plain(q5.nodeIds), ["0", "1", "2", "3"], "Q5 candidates exclude the fixed cell");

// 復習は元ステップを参照のまま使う。
for (const q of content.questions) {
  const review = selectReviewContent(execution, q.reviewStepIds);
  review.steps.forEach((reviewStep, index) => assert.equal(reviewStep, get(execution, q.reviewStepIds[index]), "Review uses original steps by reference"));
}
const q1Review = selectReviewContent(execution, q1.reviewStepIds);
assert.equal(q1Review.steps.at(-1).id, "compare-1-2");
assert.deepEqual(plain(q1Review.steps.at(-1).canvas.state.values), [2, 4, 1, 5, 3], "Review shows the answered comparison");
assert.deepEqual(plain(q1Review.steps.at(-1).canvas.highlights), [{ kind: "cell", id: 2 }, { kind: "cell", id: 3 }]);

// 共通エンジンの進行: 回答では進まず、ボタンで進む。正解しなくても完了できる（ソフトゲート）。
const wrongAnswers = question => "kind" in question
  ? question.choices.filter(option => option.id !== question.correctAnswer.choiceId).map(option => choice(option.id))
  : question.nodeIds.filter(id => id !== question.correctAnswer.nodeId).map(cell);
let state = createAssessmentState(content);
assert.equal(advanceAssessment(content, state, q1.id), state, "No advancing before an answer");
assert.equal(answerQuestion(content, state, q2.id, cell("3")), state, "No answering the future question");
assert.equal(answerQuestion(content, state, q1.id, { kind: "none" }), state, "None is not an allowed answer");
assert.equal(answerQuestion(content, state, q1.id, cell("9")), state, "Cells outside the candidates are not answerable in Q1");
assert.equal(answerQuestion(content, state, q1.id, choice("three")), state, "Choice answers cannot answer a tap question");
for (const q of content.questions) {
  const wrongs = wrongAnswers(q);
  for (const wrong of wrongs) {
    const previous = state;
    state = answerQuestion(content, state, q.id, wrong);
    assert.equal(activeQuestion(content, state).id, q.id, "A wrong answer does not advance");
    assert.equal(newAnswerFeedback(content, previous, state).message, "不正解。もう一度考えてみよう。");
    const saved = JSON.stringify(state);
    selectReviewContent(execution, q.reviewStepIds);
    assert.equal(JSON.stringify(state), saved, "Opening a review does not change attempts");
  }
  const previous = state;
  state = answerQuestion(content, state, q.id, q.correctAnswer);
  assert.equal(newAnswerFeedback(content, previous, state).message, "正解！");
  assert.equal(newAnswerFeedback(content, state, state), null, "Rerenders are silent");
  assert.equal(state.records.find(r => r.questionId === q.id).firstCorrect, false, "Retry success preserves the first failure");
  assert.equal(state.records.find(r => r.questionId === q.id).attemptCount, wrongs.length + 1);
  assert.equal(activeQuestion(content, state).id, q.id, "Success waits for the explicit next button");
  state = advanceAssessment(content, state, q.id);
  if (q === q1) assert.equal(answerQuestion(content, state, q1.id, cell("2")), state, "Stale first-question answers cannot spill over");
}
assert(assessmentComplete(content, state));
assert.equal(activeQuestion(content, state), null);
assert.equal(answerQuestion(content, state, q2.id, cell("3")), state, "Complete session does not accept more answers");
let firstTry = createAssessmentState(content);
for (const q of content.questions) {
  firstTry = answerQuestion(content, firstTry, q.id, q.correctAnswer);
  firstTry = advanceAssessment(content, firstTry, q.id);
}
assert(assessmentComplete(content, firstTry));
assert(firstTry.records.every(r => r.firstCorrect === true && r.attemptCount === 1));
let skipped = createAssessmentState(content);
for (const q of content.questions) {
  skipped = answerQuestion(content, skipped, q.id, wrongAnswers(q)[0]);
  skipped = advanceAssessment(content, skipped, q.id);
}
assert(assessmentComplete(content, skipped), "An all-wrong run completes through the common soft gate");
assert(skipped.records.every(r => r.firstCorrect === false && !r.solved));
const invalid = plain(content); invalid.questions[1].requires.answer.nodeId = "4";
assert.throws(() => validateAssessment(invalid));
assert.throws(() => selectReviewContent(execution, ["missing"]));

// 実描画: タップ設問は候補ごとに回答ボタンが1つ、選択肢設問の盤面には回答ボタンがない。
const { BubbleSortCheckCanvas } = load(file("bubble-sort/check/BubbleSortCheckCanvas.tsx"));
const ariaLabel = (scene, id) => `左から${Number(id) + 1}番目のマス（値 ${scene.state.values[Number(id)]}）を選ぶ`;
for (const q of content.questions) {
  const scene = getBubbleSortCheckScene(q), saved = JSON.stringify(scene);
  const cellIds = "kind" in q ? undefined : q.nodeIds;
  const html = renderToStaticMarkup(React.createElement(BubbleSortCheckCanvas, { canvas: scene, questionId: "kind" in q ? undefined : q.id, cellIds, onAnswer() {} }));
  assert.equal((html.match(/<button\b/g) || []).length, cellIds?.length ?? 0, "One answer button per candidate cell, none for choice questions");
  assert.equal((html.match(/data-array-bar="\d+"/g) || []).length, scene.state.values.length, "Rendered bars match the scene values");
  if (cellIds) {
    assert.match(html, /role="group" aria-label="回答の選択肢"/);
    for (const id of cellIds) assert.equal(html.split(`aria-label="${ariaLabel(scene, id)}"`).length - 1, 1, `One labelled button for ${id}`);
    const locked = renderToStaticMarkup(React.createElement(BubbleSortCheckCanvas, { canvas: scene, questionId: q.id, cellIds, disabled: true, onAnswer() {} }));
    assert.equal((locked.match(/ disabled=""/g) || []).length, cellIds.length, "Correct responses lock every answer control");
  }
  assert.equal(JSON.stringify(scene), saved, "Rendering must not mutate the scene");
}
const completionHtml = renderToStaticMarkup(React.createElement(BubbleSortCheckCanvas, { canvas: get(execution, content.completion.stepId).canvas, onAnswer() {} }));
assert.equal((completionHtml.match(/<button\b/g) || []).length, 0, "Completion board has no answer buttons");

// プレビューの実コールバックを小さなフックハーネスで実行する（ブラウザ・バックエンドなし）。
const slots = []; let cursor = 0;
const hooks = { ...React,
  useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], update => { slots[index] = typeof update === "function" ? update(slots[index]) : update; }]; },
  useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
  useEffect() {},
};
const ui = createLoader({ react: hooks, "../../assessment/AnswerFeedback": { AnswerFeedbackNotice: () => null, useAssessmentFeedback() {} } });
const { BubbleSortCheckPreview } = ui(file("bubble-sort/check/BubbleSortCheckPreview.tsx"));
const Canvas = ui(file("bubble-sort/check/BubbleSortCheckCanvas.tsx")).BubbleSortCheckCanvas;
const ReviewButton = ui(file("review/AssessmentReviewButton.tsx")).AssessmentReviewButton;
const ReviewDialog = ui(file("review/LearningReviewDialog.tsx")).LearningReviewDialog;
const elements = value => !value || typeof value !== "object" ? [] : Array.isArray(value) ? value.flatMap(elements) : [value, ...elements(value.props?.children)];
let tree;
const render = () => { cursor = 0; tree = elements(BubbleSortCheckPreview({})); };
const canvasProps = () => tree.find(element => element.type === Canvas).props;
const button = label => { const element = tree.find(element => element.props?.children === label); assert(element, `Missing button: ${label}`); return element.props; };
const choiceButton = choiceId => { const element = tree.find(element => element.props?.["data-choice-id"] === choiceId); assert(element, `Missing choice button: ${choiceId}`); return element.props; };
render();
assert(tree.some(element => element.props?.children === q1.situation), "Q1 shows the situation caption");
const first = canvasProps();
assert.equal(first.questionId, q1.id); assert.equal(first.disabled, false);
assert.deepEqual(plain(first.canvas), plain(scene1), "Preview shows the phase-2 step canvas for Q1");
first.onAnswer(cell("0")); render();
assert.equal(canvasProps().questionId, q1.id); assert.equal(canvasProps().disabled, false);
tree.find(element => element.type === ReviewButton).props.onClick(); render();
const dialog = tree.find(element => element.type === ReviewDialog);
assert(dialog); assert.equal(dialog.props.stepIds.join(), q1.reviewStepIds.join());
const recordBeforeReviewClose = slots[0]; dialog.props.onClose(); render();
assert.equal(slots[0], recordBeforeReviewClose, "Review does not change the session");
canvasProps().onAnswer(cell("2")); render();
assert.equal(canvasProps().disabled, true, "Correct answer locks the board");
const solved = slots[0]; first.onAnswer(cell("2")); render();
assert.equal(slots[0], solved, "Even a queued duplicate cannot add another attempt after success");
button("次の問題へ").onClick(); render();
assert(tree.some(element => element.props?.children === q2.situation), "Q2 shows the situation caption");
assert.equal(canvasProps().questionId, q2.id);
assert.deepEqual(plain(canvasProps().canvas.state.comparing), [2, 3], "Q2 preview scene compares the premise pair");
first.onAnswer(cell("2")); render();
assert.equal(slots[0].records[1].attemptCount, 0, "Stale first-question callbacks cannot answer question 2");
canvasProps().onAnswer(cell("2")); render();
canvasProps().onAnswer(cell("3")); render();
button("次の問題へ").onClick(); render();
// 残りの設問（タップ3問・選択肢2問）を正解で進み、完了キャプションまで到達する。
for (const q of [q3, q4, q5]) {
  assert(tree.some(element => element.props?.children === q.situation), `${q.id} shows the situation caption`);
  assert.equal(canvasProps().questionId, q.id);
  canvasProps().onAnswer(q.correctAnswer); render();
  button("次の問題へ").onClick(); render();
}
for (const q of [q6, q7]) {
  assert(tree.some(element => element.props?.children === q.situation), `${q.id} shows the situation caption`);
  assert.equal(canvasProps().questionId, undefined, "Choice questions have no cell answer buttons");
  choiceButton(q.correctAnswer.choiceId).onClick(); render();
  assert.equal(slots[0].records.find(record => record.questionId === q.id).solved, true);
  button(q === q7 ? "結果を見る" : "次の問題へ").onClick(); render();
}
assert(tree.some(element => element.props?.children === content.completion.caption), "Completion shows the completion caption");
assert.equal(canvasProps().questionId, undefined);

const previewSource = fs.readFileSync(file("bubble-sort/check/BubbleSortCheckPreview.tsx"), "utf8");
// レイアウト契約（#298）: 3段組。図は固定高の枠の中で表示し、進行操作は下部の固定ゾーンに置く。
assert.match(previewSource, /height: "min\(54dvh, 600px\)", flexShrink: 0/, "check canvas sits in a fixed-height frame (#298)");
assert.match(previewSource, /flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column"/, "check body flows in the middle scroll region (#298)");
assert.match(previewSource, /borderTop: `1px solid/, "advance actions live in the fixed bottom zone (#298)");
assert.match(previewSource, /data-choice-id/, "choice questions render choice buttons");

assert.match(previewSource, /advanceAssessment\(bubbleSortCheckContent, current, question\.id\)/);
assert.match(previewSource, /"結果を見る" : "次の問題へ"/);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "bubble-sort-check"'), "Standalone preview is registered");
console.log("Bubble-sort check verified: seven questions (five tap, two choice) covering pair order, swap/stay destinations, pass-end fixing, pass restart, range shrink and termination, with verified trace answers, scene derivation, soft gate and retries, first-attempt records, callback locking, cell/choice answer buttons and standalone preview.");
