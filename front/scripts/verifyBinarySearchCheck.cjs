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
const { binarySearchCheckContent: content, getBinarySearchCheckScene } = load(file("binary-search/check/check.content.ts"));
const { binarySearchExecutionContent: execution } = load(file("binary-search/execution/execution.content.ts"));
const search = load(file("binary-search/binarySearch.ts"));
const { getLearningStep: get, selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateBinarySearchExecutionCanvas } = load(file("binary-search/execution/execution.types.ts"));
const { validateAssessment, createAssessmentState, answerQuestion, advanceAssessment, activeQuestion, assessmentComplete } = load(file("assessment/assessment.ts"));
const { newAnswerFeedback } = load(file("assessment/answerFeedbackState.ts"));
const [q1, q2, q3, q4, q5] = content.questions;

// 基準データ §3 フェーズ3（5問）。フェーズ4が前提とする理解（範囲は全体から始まる／
// 次は残った範囲の真ん中／小さい側・大きい側のどちらを捨て、真ん中自身も外れる／
// 一致したらその位置を答えとして終わる）を、主教材のトレースを最初から最後まで
// たどる並びで問う（2026-11-17 の基準で当初の連結2問から拡充）。
assert.equal(content.id, "binary-search-check"); assert.equal(content.kind, "concept-check");
assert.equal(content.phase, 3); assert.equal(content.stageName, "動きの確認問題");
assert.equal(content.questions.length, 5);
assert.deepEqual(plain(content.questions.map(q => q.id)),
  ["first-center", "range-after-first-compare", "next-center", "range-after-compare", "final-hit"]);
assert.deepEqual(plain([q1.id, q1.prompt, q1.stepId, q1.correctAnswer, q1.tags[0]]),
  ["first-center", "最初に調べる真ん中のマスはどれか", "range-full", { kind: "node", nodeId: "3" }, "first-center"]);
assert.equal(q1.requires, null); assert.equal(q1.allowNone, false);
assert.equal(q2.kind, "choice");
assert.deepEqual(plain([q2.id, q2.prompt, q2.stepId, q2.correctAnswer, q2.tags[0]]),
  ["range-after-first-compare", "19 と 25 を比べた後、次に残る範囲はどうなるか", "probe-1-mid", { kind: "choice", choiceId: "drop-left" }, "range-after-drop-left"]);
assert.deepEqual(plain(q2.choices), [
  { id: "drop-left", text: "左側を捨てて、範囲は 4 から 6 になる" },
  { id: "drop-left-with-mid", text: "左側を捨てて、範囲は 3 から 6 になる" },
  { id: "drop-right", text: "右側を捨てて、範囲は 0 から 2 になる" },
  { id: "unchanged", text: "範囲は変わらない" },
]);
assert.equal(q2.requires, null);
assert.deepEqual(plain([q3.id, q3.prompt, q3.stepId, q3.correctAnswer, q3.tags[0]]),
  ["next-center", "左側を捨てました。次に調べる真ん中のマスはどれか", "range-after-drop-left", { kind: "node", nodeId: "5" }, "next-center"]);
assert.equal(q3.requires, null); assert.equal(q3.allowNone, false);
assert.equal(q4.kind, "choice");
assert.deepEqual(plain([q4.id, q4.prompt, q4.stepId, q4.correctAnswer, q4.tags[0]]),
  ["range-after-compare", "31 と 25 を比べた後、次に残る範囲はどうなるか", "probe-2-mid", { kind: "choice", choiceId: "drop-right" }, "drop-side"]);
assert.deepEqual(plain(q4.choices), [
  { id: "drop-right", text: "右側を捨てて、範囲は 4 だけになる" },
  { id: "drop-left", text: "左側を捨てて、範囲は 6 だけになる" },
  { id: "unchanged", text: "範囲は変わらない" },
  { id: "finished", text: "探索が終わる" },
]);
assert.equal(q4.requires, null);
assert.equal(q5.kind, "choice");
assert.deepEqual(plain([q5.id, q5.prompt, q5.stepId, q5.correctAnswer, q5.tags[0]]),
  ["final-hit", "残った 1 個の 25 を見ました。どうなりますか", "probe-3-mid", { kind: "choice", choiceId: "found" }, "found"]);
assert.deepEqual(plain(q5.choices), [
  { id: "found", text: "探す値と一致したので、探索は終わり、答えは位置 4 になる" },
  { id: "keep-going", text: "範囲がまだ残っているので、探索が続く" },
  { id: "not-found", text: "1 個だけでは見つけたことにならないので、無いものとして終わる" },
  { id: "check-right", text: "一致しても、念のため右側も調べる" },
]);
assert.equal(q5.requires, null);
assert.equal(content.completion.stepId, "range-single");
// 誤答時の文は、真ん中の決め方（タップ設問）・どちら側を捨てるかと真ん中自身も
// 外れること（範囲の設問）・一致での終了（最後の設問）に言及する（基準データ §3）。
assert.match(q1.incorrectFeedback, /真ん中/); assert.match(q3.incorrectFeedback, /真ん中/);
assert.match(q2.incorrectFeedback, /左側/); assert.match(q2.incorrectFeedback, /自身も/);
assert.match(q4.incorrectFeedback, /右側/); assert.match(q5.incorrectFeedback, /一致したら/);

// 正解は実行記録（probes）と一致しなければならない（独立照合）。
const probes = plain(search.binarySearchProbes(search.binarySearchMainValues, search.binarySearchMainTarget));
assert.deepEqual(probes, [
  { lo: 0, hi: 6, mid: 3, value: 19, outcome: "drop-left" },
  { lo: 4, hi: 6, mid: 5, value: 31, outcome: "drop-right" },
  { lo: 4, hi: 4, mid: 4, value: 25, outcome: "hit" },
]);
assert.equal(q1.correctAnswer.nodeId, String(probes[0].mid), "First answer is the mid of the full range");
assert.equal(q3.correctAnswer.nodeId, String(probes[1].mid), "Next-center answer is the mid of the remaining range");
assert.equal(search.runBinarySearch(search.binarySearchMainValues, search.binarySearchMainTarget), probes[2].mid);

// 場面: 全問ともフェーズ2のステップ canvas そのもの（参照で一致し、複製しない）。
for (const q of content.questions) {
  const scene = getBinarySearchCheckScene(q);
  assert.equal(scene, get(execution, q.stepId).canvas, `${q.id} scene is the phase-2 step canvas by reference`);
  validateBinarySearchExecutionCanvas(scene);
}
const scene1 = getBinarySearchCheckScene(q1), scene3 = getBinarySearchCheckScene(q3);
const scene4 = getBinarySearchCheckScene(q4), scene5 = getBinarySearchCheckScene(q5);
assert.deepEqual(plain(scene1.state.values), [3, 7, 12, 19, 25, 31, 42]);
assert.deepEqual(plain([scene1.state.lo, scene1.state.hi, scene1.state.mid]), [probes[0].lo, probes[0].hi, null],
  "First scene is the full range before any comparison");
assert.deepEqual(plain([scene3.state.lo, scene3.state.hi, scene3.state.mid]), [probes[1].lo, probes[1].hi, null],
  "Next-center scene is the settled range after dropping the left side");
assert.deepEqual(plain(scene3.state.cells),
  ["discarded", "discarded", "discarded", "discarded", "remaining", "remaining", "remaining"],
  "The checked 19 (index 3) is already discarded in the next-center scene");
assert.deepEqual(plain([scene4.state.lo, scene4.state.hi, scene4.state.mid]), [probes[1].lo, probes[1].hi, probes[1].mid]);
assert.equal(scene4.state.cells[probes[1].mid], "center", "Compare scene looks at the new center 31");
assert.deepEqual(plain([scene5.state.lo, scene5.state.hi, scene5.state.mid]), [probes[2].lo, probes[2].hi, probes[2].mid]);
assert.equal(scene5.state.cells[probes[2].mid], "center", "Hit scene looks at the last remaining 25");

// 回答対象: 最初の真ん中は全体、2回目の真ん中は残った範囲のマスだけ（捨てた 19 はタップできない）。
assert.deepEqual(plain(q1.nodeIds), ["0", "1", "2", "3", "4", "5", "6"], "First-center candidates are all cells");
assert.deepEqual(plain(q3.nodeIds), ["4", "5", "6"], "Next-center candidates are the remaining range cells");

// 復習は元ステップを参照のまま使う。
for (const q of content.questions) {
  const review = selectReviewContent(execution, q.reviewStepIds);
  review.steps.forEach((reviewStep, index) => assert.equal(reviewStep, get(execution, q.reviewStepIds[index]), "Review uses original steps by reference"));
}
assert.equal(selectReviewContent(execution, q1.reviewStepIds).steps.at(-1).id, "probe-1-mid");
assert.equal(selectReviewContent(execution, q3.reviewStepIds).steps.at(-1).id, "probe-2-mid");
const q4Review = selectReviewContent(execution, q4.reviewStepIds);
assert.deepEqual(plain(q4Review.steps.map(step => step.id)), ["probe-2-mid", "probe-2-drop-right", "range-single"]);
assert.deepEqual(plain([q4Review.steps.at(-1).canvas.state.lo, q4Review.steps.at(-1).canvas.state.hi]), [probes[2].lo, probes[2].hi],
  "Range-after-compare review ends with the single remaining cell");
assert.equal(selectReviewContent(execution, q5.reviewStepIds).steps.at(-1).id, "found",
  "Final-hit review ends with the found step");

// 共通エンジンの進行: 回答では進まず、ボタンで進む。正解しなくても完了できる（ソフトゲート）。
const wrongAnswers = question => "kind" in question
  ? question.choices.filter(option => option.id !== question.correctAnswer.choiceId).map(option => choice(option.id))
  : question.nodeIds.filter(id => id !== question.correctAnswer.nodeId).map(cell);
let state = createAssessmentState(content);
assert.equal(advanceAssessment(content, state, q1.id), state, "No advancing before an answer");
assert.equal(answerQuestion(content, state, q3.id, cell("5")), state, "No answering a future question");
assert.equal(answerQuestion(content, state, q1.id, { kind: "none" }), state, "None is not an allowed answer");
assert.equal(answerQuestion(content, state, q1.id, choice("drop-left")), state, "Choice answers do not fit the tap question");
assert.equal(answerQuestion(content, state, q3.id, cell("3")), state, "Future tap questions are not answerable early");
for (const q of content.questions) {
  const wrongs = wrongAnswers(q);
  for (const wrong of wrongs) {
    const previous = state;
    state = answerQuestion(content, state, q.id, wrong);
    assert.equal(activeQuestion(content, state).id, q.id, "A wrong answer does not advance");
    assert.equal(newAnswerFeedback(content, previous, state).message, q.incorrectFeedback);
    const saved = JSON.stringify(state);
    selectReviewContent(execution, q.reviewStepIds);
    assert.equal(JSON.stringify(state), saved, "Opening a review does not change attempts");
  }
  const previous = state;
  state = answerQuestion(content, state, q.id, q.correctAnswer);
  assert.equal(newAnswerFeedback(content, previous, state).message, q.correctFeedback);
  assert.equal(newAnswerFeedback(content, state, state), null, "Rerenders are silent");
  assert.equal(state.records.find(r => r.questionId === q.id).firstCorrect, false, "Retry success preserves the first failure");
  assert.equal(state.records.find(r => r.questionId === q.id).attemptCount, wrongs.length + 1);
  assert.equal(activeQuestion(content, state).id, q.id, "Success waits for the explicit next button");
  state = advanceAssessment(content, state, q.id);
  if (q === q1) assert.equal(answerQuestion(content, state, q1.id, cell("3")), state, "Stale first-question answers cannot spill over");
}
assert(assessmentComplete(content, state));
assert.equal(activeQuestion(content, state), null);
assert.equal(answerQuestion(content, state, q5.id, choice("found")), state, "Complete session does not accept more answers");
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
const invalid = plain(content); invalid.questions[1].correctAnswer.choiceId = "missing";
assert.throws(() => validateAssessment(invalid));
const invalidKind = plain(content); invalidKind.kind = "node-tap-check";
assert.throws(() => validateAssessment(invalidKind), "Choice questions are not allowed in a pure node-tap content");
assert.throws(() => selectReviewContent(execution, ["missing"]));

// 実描画: タップ設問の場面では候補マスごとに回答ボタンが1つ、選択肢設問の場面と完了盤面ではボタンなし。
const { BinarySearchCheckCanvas } = load(file("binary-search/check/BinarySearchCheckCanvas.tsx"));
for (const q of content.questions) {
  const scene = getBinarySearchCheckScene(q), saved = JSON.stringify(scene);
  const cellIds = "kind" in q ? undefined : q.nodeIds;
  const html = renderToStaticMarkup(React.createElement(BinarySearchCheckCanvas, { canvas: scene, questionId: "kind" in q ? undefined : q.id, cellIds, onAnswer() {} }));
  assert.equal((html.match(/<button\b/g) || []).length, cellIds?.length ?? 0, "One answer button per candidate cell, none for choice questions");
  assert.equal((html.match(/data-array-bar="\d+"/g) || []).length, scene.state.values.length, "Rendered bars match the scene values");
  if (cellIds) {
    assert.match(html, /role="group" aria-label="回答の選択肢"/);
    const ariaLabel = id => `左から${Number(id) + 1}番目のマス（値 ${scene.state.values[Number(id)]}）を選ぶ`;
    for (const id of cellIds) assert.equal(html.split(`aria-label="${ariaLabel(id)}"`).length - 1, 1, `One labelled button for ${id}`);
    const locked = renderToStaticMarkup(React.createElement(BinarySearchCheckCanvas, { canvas: scene, questionId: q.id, cellIds, disabled: true, onAnswer() {} }));
    assert.equal((locked.match(/ disabled=""/g) || []).length, cellIds.length, "Correct responses lock every answer control");
  }
  assert.equal(JSON.stringify(scene), saved, "Rendering must not mutate the scene");
}
{
  const completionCanvas = get(execution, content.completion.stepId).canvas;
  const html = renderToStaticMarkup(React.createElement(BinarySearchCheckCanvas, { canvas: completionCanvas, onAnswer() {} }));
  assert.equal((html.match(/<button\b/g) || []).length, 0, "Completion board has no answer buttons");
  assert.equal((html.match(/data-array-bar="\d+"/g) || []).length, completionCanvas.state.values.length, "Completion board renders every bar");
}

// プレビューの実コールバックを小さなフックハーネスで実行する（ブラウザ・バックエンドなし）。
const slots = []; let cursor = 0;
const hooks = { ...React,
  useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], update => { slots[index] = typeof update === "function" ? update(slots[index]) : update; }]; },
  useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
  useEffect() {},
};
const ui = createLoader({ react: hooks, "../../assessment/AnswerFeedback": { AnswerFeedbackNotice: () => null, useAssessmentFeedback() {} } });
const { BinarySearchCheckPreview } = ui(file("binary-search/check/BinarySearchCheckPreview.tsx"));
const Canvas = ui(file("binary-search/check/BinarySearchCheckCanvas.tsx")).BinarySearchCheckCanvas;
const ReviewButton = ui(file("review/AssessmentReviewButton.tsx")).AssessmentReviewButton;
const ReviewDialog = ui(file("review/LearningReviewDialog.tsx")).LearningReviewDialog;
const elements = value => !value || typeof value !== "object" ? [] : Array.isArray(value) ? value.flatMap(elements) : [value, ...elements(value.props?.children)];
let tree;
const render = () => { cursor = 0; tree = elements(BinarySearchCheckPreview({})); };
const canvasProps = () => tree.find(element => element.type === Canvas).props;
const button = label => { const element = tree.find(element => element.props?.children === label); assert(element, `Missing button: ${label}`); return element.props; };
const choiceButton = choiceId => { const element = tree.find(element => element.props?.["data-choice-id"] === choiceId); assert(element, `Missing choice button: ${choiceId}`); return element.props; };
render();
const first = canvasProps();
assert.equal(first.questionId, q1.id); assert.equal(first.disabled, false);
assert.deepEqual(plain(first.canvas), plain(scene1), "Preview shows the phase-2 step canvas for the first question");
first.onAnswer(cell("0")); render();
assert.equal(canvasProps().questionId, q1.id); assert.equal(canvasProps().disabled, false);
tree.find(element => element.type === ReviewButton).props.onClick(); render();
const dialog = tree.find(element => element.type === ReviewDialog);
assert(dialog); assert.equal(dialog.props.stepIds.join(), q1.reviewStepIds.join());
const recordBeforeReviewClose = slots[0]; dialog.props.onClose(); render();
assert.equal(slots[0], recordBeforeReviewClose, "Review does not change the session");
canvasProps().onAnswer(cell("3")); render();
assert.equal(canvasProps().disabled, true, "Correct answer locks the board");
const solved = slots[0]; first.onAnswer(cell("3")); render();
assert.equal(slots[0], solved, "Even a queued duplicate cannot add another attempt after success");
button("次の問題へ").onClick(); render();
assert.equal(canvasProps().questionId, undefined, "Choice questions have no tap targets on the board");
assert.deepEqual(plain(canvasProps().canvas), plain(getBinarySearchCheckScene(q2)), "Preview shows the probe-1-mid canvas for the second question");
first.onAnswer(cell("3")); render();
assert.equal(slots[0].records[1].attemptCount, 0, "Stale first-question callbacks cannot answer question 2");
choiceButton("drop-right").onClick(); render();
assert.equal(slots[0].records[1].attemptCount, 1);
assert.equal(choiceButton("drop-left").disabled, false, "A wrong choice does not lock the choices");
choiceButton("drop-left").onClick(); render();
assert.equal(choiceButton("drop-left").disabled, true, "Correct choice locks the choices");
button("次の問題へ").onClick(); render();
assert.equal(canvasProps().questionId, q3.id);
canvasProps().onAnswer(q3.correctAnswer); render();
button("次の問題へ").onClick(); render();
assert.equal(canvasProps().questionId, undefined);
choiceButton(q4.correctAnswer.choiceId).onClick(); render();
button("次の問題へ").onClick(); render();
choiceButton(q5.correctAnswer.choiceId).onClick(); render();
button("結果を見る").onClick(); render();
assert(tree.some(element => element.props?.children === content.completion.caption), "Completion shows the completion caption");
assert.equal(canvasProps().questionId, undefined);

const previewSource = fs.readFileSync(file("binary-search/check/BinarySearchCheckPreview.tsx"), "utf8");
// レイアウト契約（#298）: 3段組。図は固定高の枠の中で表示し、進行操作は下部の固定ゾーンに置く。
assert.match(previewSource, /height: "min\(54dvh, 600px\)", flexShrink: 0/, "check canvas sits in a fixed-height frame (#298)");
assert.match(previewSource, /flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column"/, "check body flows in the middle scroll region (#298)");
assert.match(previewSource, /borderTop: `1px solid/, "advance actions live in the fixed bottom zone (#298)");

assert.match(previewSource, /advanceAssessment\(binarySearchCheckContent, current, question\.id\)/);
assert.match(previewSource, /"結果を見る" : "次の問題へ"/);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "binary-search-check"'), "Standalone preview is registered");
console.log("Binary-search check verified: five questions (two tap, three choice) tracing the full main example from the first center to the hit, verified trace answers, discarded-cell exclusion, per-question feedback, soft gate and retries, first-attempt records, callback locking, cell and choice answer controls and standalone preview.");
