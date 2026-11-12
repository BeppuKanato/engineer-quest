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
const { greedyCoinsCheckContent: content, getGreedyCoinsCheckScene } = load(file("units/greedy-coins/check/check.content.ts"));
const { greedyCoinsExecutionContent: execution } = load(file("units/greedy-coins/execution/execution.content.ts"));
const coinsModule = load(file("units/greedy-coins/greedyCoins.ts"));
const { getLearningStep: get, selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateGreedyCoinsExecutionCanvas } = load(file("units/greedy-coins/execution/execution.types.ts"));
const { validateAssessment, createAssessmentState, answerQuestion, advanceAssessment, activeQuestion, assessmentComplete } = load(file("assessment/assessment.ts"));
const { newAnswerFeedback } = load(file("assessment/answerFeedbackState.ts"));
const [q1, q2] = content.questions;

// 基準データ §3 フェーズ3の確定事項（場面 select-3、連結2問、Q1 正解は50、Q2 正解は「残額より大きくて使えない」）。
assert.equal(content.id, "greedy-coins-check"); assert.equal(content.kind, "concept-check");
assert.equal(content.phase, 3); assert.equal(content.stageName, "動きの確認問題");
assert.equal(content.questions.length, 2);
assert.deepEqual(plain([q1.id, q1.prompt, q1.stepId, q1.correctAnswer, q1.tags[0]]),
  ["next-coin", "残りは86円です。次に選ぶ硬貨はどれか", "select-3", { kind: "node", nodeId: "50" }, "next-coin"]);
assert.equal(q1.requires, null); assert.equal(q1.allowNone, false);
assert.equal(q2.kind, "choice");
assert.deepEqual(plain([q2.id, q2.prompt, q2.stepId, q2.correctAnswer, q2.tags[0]]),
  ["why-not-100", "なぜ100円ではなく50円を選ぶのか", "select-3", { kind: "choice", choiceId: "too-large" }, "why-largest-usable"]);
assert.deepEqual(plain(q2.choices), [
  { id: "too-large", text: "100円は残額の86円より大きくて使えないから" },
  { id: "smaller", text: "50円の方が小さい硬貨だから" },
  { id: "used-twice", text: "100円はもう2枚使ったから" },
  { id: "small-first", text: "小さい硬貨から順に使う決まりだから" },
]);
assert.equal(q2.requires, null);
assert.equal(content.completion.stepId, "select-4");
// 誤答時の文は、どちらの設問でも「残額以下で一番大きい硬貨を選ぶ」決め方に言及する（基準データ §3）。
assert.match(q1.incorrectFeedback, /残額以下で一番大きい硬貨を選ぶ/);
assert.match(q2.incorrectFeedback, /残額以下で一番大きい硬貨を選ぶ/);
assert.match(q2.incorrectFeedback, /何枚でも使えます/);

// 正解は実行記録（selections）と一致しなければならない（独立照合）。
const selections = plain(coinsModule.greedyCoinsSelections(786, [500, 100, 50, 10, 5, 1]));
assert.deepEqual(selections.map(s => s.coin), [500, 100, 100, 50, 10, 10, 10, 5, 1]);
assert.deepEqual(selections[3], { coin: 50, remainingBefore: 86, remainingAfter: 36 });
assert.equal(q1.correctAnswer.nodeId, String(selections[3].coin), "Q1 answer is the 4th selection of the verified trace");
assert.deepEqual(plain(coinsModule.runGreedyCoins(786, [500, 100, 50, 10, 5, 1])), [500, 100, 100, 50, 10, 10, 10, 5, 1]);

// 場面: 2問ともフェーズ2のステップ canvas そのもの（参照で一致し、複製しない）。
const scene1 = getGreedyCoinsCheckScene(q1), scene2 = getGreedyCoinsCheckScene(q2);
assert.equal(scene1, get(execution, "select-3").canvas, "Q1 scene is the phase-2 step canvas by reference");
assert.equal(scene2, scene1, "Q2 uses the same scene as Q1");
assert.deepEqual(plain([scene1.state.amount, scene1.state.remaining, scene1.state.tray]), [786, 86, [500, 100, 100]]);
assert.equal(scene1.state.selectedCoin, 100);
validateGreedyCoinsExecutionCanvas(scene1); validateGreedyCoinsExecutionCanvas(scene2);

// 回答対象: Q1は額面列の全額面（同じ額面は何枚でも使えるため、100・500も候補に残す）。
assert.deepEqual(plain(q1.nodeIds), ["500", "100", "50", "10", "5", "1"], "Q1 candidates are all denominations");

// 復習は元ステップを参照のまま使う。どちらの設問も次に50が選ばれるまでを見せる。
for (const q of content.questions) {
  const review = selectReviewContent(execution, q.reviewStepIds);
  review.steps.forEach((reviewStep, index) => assert.equal(reviewStep, get(execution, q.reviewStepIds[index]), "Review uses original steps by reference"));
  assert.deepEqual(plain(review.steps.map(step => step.id)), ["select-3", "select-4"]);
  assert.equal(review.steps.at(-1).canvas.state.selectedCoin, 50);
  assert.equal(review.steps.at(-1).canvas.state.remaining, 36);
}

// 共通エンジンの進行: 回答では進まず、ボタンで進む。正解しなくても完了できる（ソフトゲート）。
let state = createAssessmentState(content);
assert.equal(advanceAssessment(content, state, q1.id), state, "No advancing before an answer");
assert.equal(answerQuestion(content, state, q2.id, choice("too-large")), state, "No answering the future question");
assert.equal(answerQuestion(content, state, q1.id, { kind: "none" }), state, "None is not an allowed answer");
assert.equal(answerQuestion(content, state, q1.id, cell("999")), state, "A non-denomination is not answerable in Q1");
assert.equal(answerQuestion(content, state, q1.id, choice("too-large")), state, "Choice answers do not fit the tap question");
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
  assert.equal(answerQuestion(content, state, q1.id, cell("50")), state, "Stale first-question answers cannot spill over");
}
assert.equal(answerQuestion(content, state, q2.id, cell("50")), state, "Node answers do not fit the choice question");
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
assert.equal(state.records[0].attemptCount, 6, "Q1 records every denomination attempt");
assert.equal(state.records[1].attemptCount, 4, "Q2 records every choice attempt");
assert.equal(answerQuestion(content, state, q2.id, choice("too-large")), state, "Complete session does not accept more answers");
let firstTry = createAssessmentState(content);
firstTry = answerQuestion(content, firstTry, q1.id, q1.correctAnswer);
firstTry = advanceAssessment(content, firstTry, q1.id);
firstTry = answerQuestion(content, firstTry, q2.id, q2.correctAnswer);
firstTry = advanceAssessment(content, firstTry, q2.id);
assert(assessmentComplete(content, firstTry));
assert(firstTry.records.every(r => r.firstCorrect === true && r.attemptCount === 1));
let skipped = createAssessmentState(content);
skipped = answerQuestion(content, skipped, q1.id, cell("100"));
skipped = advanceAssessment(content, skipped, q1.id);
skipped = answerQuestion(content, skipped, q2.id, choice("used-twice"));
skipped = advanceAssessment(content, skipped, q2.id);
assert(assessmentComplete(content, skipped), "An all-wrong run completes through the common soft gate");
assert(skipped.records.every(r => r.firstCorrect === false && !r.solved));
const invalid = plain(content); invalid.questions[1].correctAnswer.choiceId = "missing";
assert.throws(() => validateAssessment(invalid));
const invalidKind = plain(content); invalidKind.kind = "node-tap-check";
assert.throws(() => validateAssessment(invalidKind), "Choice questions are not allowed in a pure node-tap content");
assert.throws(() => selectReviewContent(execution, ["missing"]));

// 実描画: Q1 の場面では額面ごとに回答ボタンが1つ、Q2 の場面と完了盤面ではボタンなし。
const { GreedyCoinsCheckCanvas } = load(file("units/greedy-coins/check/GreedyCoinsCheckCanvas.tsx"));
{
  const saved = JSON.stringify(scene1);
  const html = renderToStaticMarkup(React.createElement(GreedyCoinsCheckCanvas, { canvas: scene1, questionId: q1.id, cellIds: q1.nodeIds, onAnswer() {} }));
  assert.equal((html.match(/<button\b/g) || []).length, q1.nodeIds.length, "One answer button per denomination");
  assert.equal((html.match(/data-coin-chip=/g) || []).length, scene1.state.coins.length, "Rendered chips match the scene denominations");
  assert.match(html, /role="group" aria-label="回答の選択肢"/);
  for (const id of q1.nodeIds) assert.equal(html.split(`aria-label="${id}円の硬貨を選ぶ"`).length - 1, 1, `One labelled button for ${id}`);
  const locked = renderToStaticMarkup(React.createElement(GreedyCoinsCheckCanvas, { canvas: scene1, questionId: q1.id, cellIds: q1.nodeIds, disabled: true, onAnswer() {} }));
  assert.equal((locked.match(/ disabled=""/g) || []).length, q1.nodeIds.length, "Correct responses lock every answer control");
  assert.equal(JSON.stringify(scene1), saved, "Rendering must not mutate the scene");
}
for (const [canvas, label] of [[scene2, "Q2 scene"], [get(execution, content.completion.stepId).canvas, "Completion board"]]) {
  const html = renderToStaticMarkup(React.createElement(GreedyCoinsCheckCanvas, { canvas, onAnswer() {} }));
  assert.equal((html.match(/<button\b/g) || []).length, 0, `${label} has no answer buttons`);
  assert.equal((html.match(/data-coin-chip=/g) || []).length, canvas.state.coins.length, `${label} renders every denomination chip`);
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
const { GreedyCoinsCheckPreview } = ui(file("units/greedy-coins/check/GreedyCoinsCheckPreview.tsx"));
const Canvas = ui(file("units/greedy-coins/check/GreedyCoinsCheckCanvas.tsx")).GreedyCoinsCheckCanvas;
const ReviewButton = ui(file("review/AssessmentReviewButton.tsx")).AssessmentReviewButton;
const ReviewDialog = ui(file("review/LearningReviewDialog.tsx")).LearningReviewDialog;
const SharedLayout = ui(file("components/layouts/LearningContentLayout.tsx")).LearningContentLayout;
const elements = value => !value || typeof value !== "object" ? [] : Array.isArray(value) ? value.flatMap(elements)
  : value.type === SharedLayout ? elements(SharedLayout(value.props)) : [value, ...elements(value.props?.children)];
let tree;
const render = () => { cursor = 0; tree = elements(GreedyCoinsCheckPreview({})); };
const canvasProps = () => tree.find(element => element.type === Canvas).props;
const button = label => { const element = tree.find(element => element.props?.children === label); assert(element, `Missing button: ${label}`); return element.props; };
const choiceButton = choiceId => { const element = tree.find(element => element.props?.["data-choice-id"] === choiceId); assert(element, `Missing choice button: ${choiceId}`); return element.props; };
render();
const first = canvasProps();
assert.equal(first.questionId, q1.id); assert.equal(first.disabled, false);
assert.deepEqual(plain(first.canvas), plain(scene1), "Preview shows the phase-2 step canvas for Q1");
first.onAnswer(cell("100")); render();
assert.equal(canvasProps().questionId, q1.id); assert.equal(canvasProps().disabled, false);
tree.find(element => element.type === ReviewButton).props.onClick(); render();
const dialog = tree.find(element => element.type === ReviewDialog);
assert(dialog); assert.equal(dialog.props.stepIds.join(), q1.reviewStepIds.join());
const recordBeforeReviewClose = slots[0]; dialog.props.onClose(); render();
assert.equal(slots[0], recordBeforeReviewClose, "Review does not change the session");
canvasProps().onAnswer(cell("50")); render();
assert.equal(canvasProps().disabled, true, "Correct answer locks the board");
const solved = slots[0]; first.onAnswer(cell("50")); render();
assert.equal(slots[0], solved, "Even a queued duplicate cannot add another attempt after success");
button("次の問題へ").onClick(); render();
assert.equal(canvasProps().questionId, undefined, "Q2 has no tap targets on the board");
assert.deepEqual(plain(canvasProps().canvas), plain(scene2), "Preview shows the select-3 canvas for Q2");
first.onAnswer(cell("50")); render();
assert.equal(slots[0].records[1].attemptCount, 0, "Stale first-question callbacks cannot answer question 2");
choiceButton("used-twice").onClick(); render();
assert.equal(slots[0].records[1].attemptCount, 1);
assert.equal(choiceButton("too-large").disabled, false, "A wrong choice does not lock the choices");
choiceButton("too-large").onClick(); render();
assert.equal(choiceButton("too-large").disabled, true, "Correct choice locks the choices");
button("結果を見る").onClick(); render();
assert(tree.some(element => element.props?.children === content.completion.caption), "Completion shows the completion caption");
assert.equal(canvasProps().questionId, undefined);

const previewSource = fs.readFileSync(file("units/greedy-coins/check/GreedyCoinsCheckPreview.tsx"), "utf8");
// レイアウト契約（#298）: 3段組。図は固定高の枠の中で表示し、進行操作は下部の固定ゾーンに置く。
assert.match(previewSource, /height: "min\(54dvh, 600px\)", flexShrink: 0/, "check canvas sits in a fixed-height frame (#298)");
assert.match(previewSource, /<AssessmentLayout/, "preview uses the shared scroll layout");
assert.match(fs.readFileSync(path.resolve(__dirname, "../src/features/learning/components/layouts/AssessmentLayout.tsx"), "utf8"), /flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column"/, "check body flows in the middle scroll region (#298)");
assert.match(previewSource, /borderTop: `1px solid/, "advance actions live in the fixed bottom zone (#298)");
assert.match(previewSource, /advanceAssessment\(greedyCoinsCheckContent, current, question\.id\)/);
assert.match(previewSource, /"結果を見る" : "次の問題へ"/);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "greedy-coins-check"'), "Standalone preview is registered");
console.log("Greedy-coins check verified: linked tap/choice questions on the select-3 board (remaining 86, tray [500,100,100]), verified trace answer 50, all-denomination candidates, per-question feedback citing the largest-usable rule, soft gate and retries, first-attempt records, callback locking, coin and choice answer controls and standalone preview.");
