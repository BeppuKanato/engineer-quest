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
      if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
    const base = name.startsWith("@/") ? path.resolve(__dirname, "../src", name.slice(2)) : path.resolve(path.dirname(filename), name);
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
const { binarySearchCheckContent: content, getBinarySearchCheckScene } = load(file("units/binary-search/check/check.content.ts"));
const { binarySearchExecutionContent: execution } = load(file("units/binary-search/execution/execution.content.ts"));
const search = load(file("units/binary-search/binarySearch.ts"));
const { getLearningStep: get, selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateBinarySearchExecutionCanvas } = load(file("units/binary-search/execution/execution.types.ts"));
const { validateAssessment, createAssessmentState, answerQuestion, advanceAssessment, activeQuestion, assessmentComplete } = load(file("assessment/assessment.ts"));
const { newAnswerFeedback } = load(file("assessment/answerFeedbackState.ts"));
const [q1, q2] = content.questions;

// 基準データ §3 フェーズ3の確定事項（場面 range-after-drop-left、連結2問、Q1 正解は位置5、Q2 正解は右側を捨てる選択肢）。
assert.equal(content.id, "binary-search-check"); assert.equal(content.kind, "concept-check");
assert.equal(content.phase, 3); assert.equal(content.stageName, "動きの確認問題");
assert.equal(content.questions.length, 2);
assert.deepEqual(plain([q1.id, q1.prompt, q1.stepId, q1.correctAnswer, q1.tags[0]]),
  ["next-center", "左側を捨てました。次に調べる真ん中のマスはどれか", "range-after-drop-left", { kind: "node", nodeId: "5" }, "next-center"]);
assert.equal(q1.requires, null); assert.equal(q1.allowNone, false);
assert.equal(q2.kind, "choice");
assert.deepEqual(plain([q2.id, q2.prompt, q2.stepId, q2.correctAnswer, q2.tags[0]]),
  ["range-after-compare", "31 と 25 を比べた後、次に残る範囲はどうなるか", "probe-2-mid", { kind: "choice", choiceId: "drop-right" }, "drop-side"]);
assert.deepEqual(plain(q2.choices), [
  { id: "drop-right", text: "右側を捨てて、範囲は 4 だけになる" },
  { id: "drop-left", text: "左側を捨てて、範囲は 6 だけになる" },
  { id: "unchanged", text: "範囲は変わらない" },
  { id: "finished", text: "探索が終わる" },
]);
assert.equal(q2.requires, null);
assert.equal(content.completion.stepId, "range-single");
// 誤答時の文は、Q1 では真ん中の決め方、Q2 ではどちら側を捨てるかに言及する（基準データ §3）。
assert.match(q1.incorrectFeedback, /真ん中/); assert.match(q2.incorrectFeedback, /右側/);

// 正解は実行記録（probes）と一致しなければならない（独立照合）。
const probes = plain(search.binarySearchProbes(search.binarySearchMainValues, search.binarySearchMainTarget));
assert.deepEqual(probes, [
  { lo: 0, hi: 6, mid: 3, value: 19, outcome: "drop-left" },
  { lo: 4, hi: 6, mid: 5, value: 31, outcome: "drop-right" },
  { lo: 4, hi: 4, mid: 4, value: 25, outcome: "hit" },
]);
assert.equal(q1.correctAnswer.nodeId, String(probes[1].mid), "Q1 answer is the mid of the remaining range");
assert.equal(search.runBinarySearch(search.binarySearchMainValues, search.binarySearchMainTarget), probes[2].mid);

// 場面: 2問ともフェーズ2のステップ canvas そのもの（参照で一致し、複製しない）。
const scene1 = getBinarySearchCheckScene(q1), scene2 = getBinarySearchCheckScene(q2);
assert.equal(scene1, get(execution, "range-after-drop-left").canvas, "Q1 scene is the phase-2 step canvas by reference");
assert.equal(scene2, get(execution, "probe-2-mid").canvas, "Q2 scene is the phase-2 step canvas by reference");
assert.deepEqual(plain(scene1.state.values), [3, 7, 12, 19, 25, 31, 42]);
assert.deepEqual(plain([scene1.state.lo, scene1.state.hi, scene1.state.mid]), [probes[1].lo, probes[1].hi, null],
  "Q1 scene is the settled range after dropping the left side");
assert.deepEqual(plain(scene1.state.cells),
  ["discarded", "discarded", "discarded", "discarded", "remaining", "remaining", "remaining"],
  "The checked 19 (index 3) is already discarded in the Q1 scene");
assert.deepEqual(plain([scene2.state.lo, scene2.state.hi, scene2.state.mid]), [probes[1].lo, probes[1].hi, probes[1].mid]);
assert.equal(scene2.state.cells[probes[1].mid], "center", "Q2 scene looks at the new center 31");
validateBinarySearchExecutionCanvas(scene1); validateBinarySearchExecutionCanvas(scene2);

// 回答対象: Q1は残った範囲のマスだけ（捨てた 19 はタップできない）。
assert.deepEqual(plain(q1.nodeIds), ["4", "5", "6"], "Q1 candidates are the remaining range cells");

// 復習は元ステップを参照のまま使う。Q1 は次の真ん中、Q2 は右を捨てて範囲が 1 個になるまでを見せる。
for (const q of content.questions) {
  const review = selectReviewContent(execution, q.reviewStepIds);
  review.steps.forEach((reviewStep, index) => assert.equal(reviewStep, get(execution, q.reviewStepIds[index]), "Review uses original steps by reference"));
}
assert.equal(selectReviewContent(execution, q1.reviewStepIds).steps.at(-1).id, "probe-2-mid");
const q2Review = selectReviewContent(execution, q2.reviewStepIds);
assert.deepEqual(plain(q2Review.steps.map(step => step.id)), ["probe-2-mid", "probe-2-drop-right", "range-single"]);
assert.deepEqual(plain([q2Review.steps.at(-1).canvas.state.lo, q2Review.steps.at(-1).canvas.state.hi]), [probes[2].lo, probes[2].hi],
  "Q2 review ends with the single remaining cell");

// 共通エンジンの進行: 回答では進まず、ボタンで進む。正解しなくても完了できる（ソフトゲート）。
let state = createAssessmentState(content);
assert.equal(advanceAssessment(content, state, q1.id), state, "No advancing before an answer");
assert.equal(answerQuestion(content, state, q2.id, choice("drop-right")), state, "No answering the future question");
assert.equal(answerQuestion(content, state, q1.id, { kind: "none" }), state, "None is not an allowed answer");
assert.equal(answerQuestion(content, state, q1.id, cell("3")), state, "The discarded 19 cell is not answerable in Q1");
assert.equal(answerQuestion(content, state, q1.id, choice("drop-right")), state, "Choice answers do not fit the tap question");
for (const id of q1.nodeIds.filter(id => id !== q1.correctAnswer.nodeId)) {
  const previous = state;
  state = answerQuestion(content, state, q1.id, cell(id));
  assert.equal(activeQuestion(content, state).id, q1.id, "A wrong answer does not advance");
  assert.equal(newAnswerFeedback(content, previous, state).message, q1.incorrectFeedback);
  const saved = JSON.stringify(state);
  selectReviewContent(execution, q1.reviewStepIds);
  assert.equal(JSON.stringify(state), saved, "Opening a review does not change attempts");
}
{
  const previous = state;
  state = answerQuestion(content, state, q1.id, q1.correctAnswer);
  assert.equal(newAnswerFeedback(content, previous, state).message, q1.correctFeedback);
  assert.equal(newAnswerFeedback(content, state, state), null, "Rerenders are silent");
  assert.equal(state.records.find(r => r.questionId === q1.id).firstCorrect, false, "Retry success preserves the first failure");
  assert.equal(activeQuestion(content, state).id, q1.id, "Success waits for the explicit next button");
  state = advanceAssessment(content, state, q1.id);
  assert.equal(answerQuestion(content, state, q1.id, cell("5")), state, "Stale first-question answers cannot spill over");
}
assert.equal(answerQuestion(content, state, q2.id, cell("5")), state, "Node answers do not fit the choice question");
for (const picked of q2.choices.filter(entry => entry.id !== q2.correctAnswer.choiceId)) {
  const previous = state;
  state = answerQuestion(content, state, q2.id, choice(picked.id));
  assert.equal(activeQuestion(content, state).id, q2.id, "A wrong choice does not advance");
  assert.equal(newAnswerFeedback(content, previous, state).message, q2.incorrectFeedback);
}
{
  const previous = state;
  state = answerQuestion(content, state, q2.id, q2.correctAnswer);
  assert.equal(newAnswerFeedback(content, previous, state).message, q2.correctFeedback);
  assert.equal(state.records.find(r => r.questionId === q2.id).firstCorrect, false, "Retry success preserves the first failure");
  state = advanceAssessment(content, state, q2.id);
}
assert(assessmentComplete(content, state));
assert.equal(activeQuestion(content, state), null);
assert.equal(state.records[0].attemptCount, 3, "Q1 records every candidate attempt");
assert.equal(state.records[1].attemptCount, 4, "Q2 records every choice attempt");
assert.equal(answerQuestion(content, state, q2.id, choice("drop-right")), state, "Complete session does not accept more answers");
let firstTry = createAssessmentState(content);
firstTry = answerQuestion(content, firstTry, q1.id, q1.correctAnswer);
firstTry = advanceAssessment(content, firstTry, q1.id);
firstTry = answerQuestion(content, firstTry, q2.id, q2.correctAnswer);
firstTry = advanceAssessment(content, firstTry, q2.id);
assert(assessmentComplete(content, firstTry));
assert(firstTry.records.every(r => r.firstCorrect === true && r.attemptCount === 1));
let skipped = createAssessmentState(content);
skipped = answerQuestion(content, skipped, q1.id, cell("4"));
skipped = advanceAssessment(content, skipped, q1.id);
skipped = answerQuestion(content, skipped, q2.id, choice("unchanged"));
skipped = advanceAssessment(content, skipped, q2.id);
assert(assessmentComplete(content, skipped), "An all-wrong run completes through the common soft gate");
assert(skipped.records.every(r => r.firstCorrect === false && !r.solved));
const invalid = plain(content); invalid.questions[1].correctAnswer.choiceId = "missing";
assert.throws(() => validateAssessment(invalid));
const invalidKind = plain(content); invalidKind.kind = "node-tap-check";
assert.throws(() => validateAssessment(invalidKind), "Choice questions are not allowed in a pure node-tap content");
assert.throws(() => selectReviewContent(execution, ["missing"]));

// 実描画: Q1 の場面では候補マスごとに回答ボタンが1つ、Q2 の場面と完了盤面ではボタンなし。
const { BinarySearchCheckCanvas } = load(file("units/binary-search/check/BinarySearchCheckCanvas.tsx"));
{
  const saved = JSON.stringify(scene1);
  const html = renderToStaticMarkup(React.createElement(BinarySearchCheckCanvas, { canvas: scene1, questionId: q1.id, cellIds: q1.nodeIds, onAnswer() {} }));
  assert.equal((html.match(/<button\b/g) || []).length, q1.nodeIds.length, "One answer button per candidate cell");
  assert.equal((html.match(/data-array-bar="\d+"/g) || []).length, scene1.state.values.length, "Rendered bars match the scene values");
  assert.match(html, /role="group" aria-label="回答の選択肢"/);
  const ariaLabel = id => `左から${Number(id) + 1}番目のマス（値 ${scene1.state.values[Number(id)]}）を選ぶ`;
  for (const id of q1.nodeIds) assert.equal(html.split(`aria-label="${ariaLabel(id)}"`).length - 1, 1, `One labelled button for ${id}`);
  const locked = renderToStaticMarkup(React.createElement(BinarySearchCheckCanvas, { canvas: scene1, questionId: q1.id, cellIds: q1.nodeIds, disabled: true, onAnswer() {} }));
  assert.equal((locked.match(/ disabled=""/g) || []).length, q1.nodeIds.length, "Correct responses lock every answer control");
  assert.equal(JSON.stringify(scene1), saved, "Rendering must not mutate the scene");
}
for (const [canvas, label] of [[scene2, "Q2 scene"], [get(execution, content.completion.stepId).canvas, "Completion board"]]) {
  const html = renderToStaticMarkup(React.createElement(BinarySearchCheckCanvas, { canvas, onAnswer() {} }));
  assert.equal((html.match(/<button\b/g) || []).length, 0, `${label} has no answer buttons`);
  assert.equal((html.match(/data-array-bar="\d+"/g) || []).length, canvas.state.values.length, `${label} renders every bar`);
}

// プレビューの実コールバックを小さなフックハーネスで実行する（ブラウザ・バックエンドなし）。
const slots = []; let cursor = 0;
const hooks = { ...React,
  useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], update => { slots[index] = typeof update === "function" ? update(slots[index]) : update; }]; },
  useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
  useEffect() {},
};
const ui = createLoader({ react: hooks, "../../../assessment/AnswerFeedback": { AnswerFeedbackNotice: () => null, useAssessmentFeedback() {} } });
const { BinarySearchCheckPreview } = ui(file("units/binary-search/check/BinarySearchCheckPreview.tsx"));
const Canvas = ui(file("units/binary-search/check/BinarySearchCheckCanvas.tsx")).BinarySearchCheckCanvas;
const ReviewButton = ui(file("review/AssessmentReviewButton.tsx")).AssessmentReviewButton;
const ReviewDialog = ui(file("review/LearningReviewDialog.tsx")).LearningReviewDialog;
const SharedLayout = ui(file("components/layouts/LearningContentLayout.tsx")).LearningContentLayout;
const elements = value => !value || typeof value !== "object" ? [] : Array.isArray(value) ? value.flatMap(elements)
  : value.type === SharedLayout ? elements(SharedLayout(value.props)) : [value, ...elements(value.props?.children)];
let tree;
const render = () => { cursor = 0; tree = elements(BinarySearchCheckPreview({})); };
const canvasProps = () => tree.find(element => element.type === Canvas).props;
const button = label => { const element = tree.find(element => element.props?.children === label); assert(element, `Missing button: ${label}`); return element.props; };
const choiceButton = choiceId => { const element = tree.find(element => element.props?.["data-choice-id"] === choiceId); assert(element, `Missing choice button: ${choiceId}`); return element.props; };
render();
const first = canvasProps();
assert.equal(first.questionId, q1.id); assert.equal(first.disabled, false);
assert.deepEqual(plain(first.canvas), plain(scene1), "Preview shows the phase-2 step canvas for Q1");
first.onAnswer(cell("4")); render();
assert.equal(canvasProps().questionId, q1.id); assert.equal(canvasProps().disabled, false);
tree.find(element => element.type === ReviewButton).props.onClick(); render();
const dialog = tree.find(element => element.type === ReviewDialog);
assert(dialog); assert.equal(dialog.props.stepIds.join(), q1.reviewStepIds.join());
const recordBeforeReviewClose = slots[0]; dialog.props.onClose(); render();
assert.equal(slots[0], recordBeforeReviewClose, "Review does not change the session");
canvasProps().onAnswer(cell("5")); render();
assert.equal(canvasProps().disabled, true, "Correct answer locks the board");
const solved = slots[0]; first.onAnswer(cell("5")); render();
assert.equal(slots[0], solved, "Even a queued duplicate cannot add another attempt after success");
button("次の問題へ").onClick(); render();
assert.equal(canvasProps().questionId, undefined, "Q2 has no tap targets on the board");
assert.deepEqual(plain(canvasProps().canvas), plain(scene2), "Preview shows the probe-2-mid canvas for Q2");
first.onAnswer(cell("5")); render();
assert.equal(slots[0].records[1].attemptCount, 0, "Stale first-question callbacks cannot answer question 2");
choiceButton("drop-left").onClick(); render();
assert.equal(slots[0].records[1].attemptCount, 1);
assert.equal(choiceButton("drop-right").disabled, false, "A wrong choice does not lock the choices");
choiceButton("drop-right").onClick(); render();
assert.equal(choiceButton("drop-right").disabled, true, "Correct choice locks the choices");
button("結果を見る").onClick(); render();
assert(tree.some(element => element.props?.children === content.completion.caption), "Completion shows the completion caption");
assert.equal(canvasProps().questionId, undefined);

const previewSource = fs.readFileSync(file("units/binary-search/check/BinarySearchCheckPreview.tsx"), "utf8");
// レイアウト契約（#298）: 3段組。図は固定高の枠の中で表示し、進行操作は下部の固定ゾーンに置く。
assert.match(previewSource, /height: "min\(54dvh, 600px\)", flexShrink: 0/, "check canvas sits in a fixed-height frame (#298)");
assert.match(previewSource, /<AssessmentLayout/, "preview uses the shared scroll layout");
assert.match(fs.readFileSync(path.resolve(__dirname, "../src/features/learning/components/layouts/AssessmentLayout.tsx"), "utf8"), /flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column"/, "check body flows in the middle scroll region (#298)");
assert.match(previewSource, /borderTop: `1px solid/, "advance actions live in the fixed bottom zone (#298)");

assert.match(previewSource, /advanceAssessment\(binarySearchCheckContent, current, question\.id\)/);
assert.match(previewSource, /"結果を見る" : "次の問題へ"/);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "binary-search-check"'), "Standalone preview is registered");
console.log("Binary-search check verified: linked tap/choice questions on the range-after-drop-left board, verified trace answers, discarded-cell exclusion, per-question feedback, soft gate and retries, first-attempt records, callback locking, cell and choice answer controls and standalone preview.");
