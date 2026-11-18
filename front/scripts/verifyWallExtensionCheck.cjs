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
const { wallExtensionCheckContent: content, getWallExtensionCheckScene } = load(file("wall-extension/check/check.content.ts"));
const { wallExtensionExecutionContent: execution } = load(file("wall-extension/execution/execution.content.ts"));
const maze = load(file("wall-extension/wallExtensionMaze.ts"));
const { getLearningStep: get, selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateMazeGridCanvas } = load(file("player/mazeGrid.types.ts"));
const { validateAssessment, createAssessmentState, answerQuestion, advanceAssessment, activeQuestion, assessmentComplete } = load(file("assessment/assessment.ts"));
const { newAnswerFeedback } = load(file("assessment/answerFeedbackState.ts"));
const [place, q1, q2, lower, top, late1, late2, completion] = content.questions;
const isChoice = question => "kind" in question;
const correctOf = question => question.correctAnswer;
const wrongAnswers = question => isChoice(question)
  ? question.choices.filter(option => option.id !== question.correctAnswer.choiceId).map(option => choice(option.id))
  : question.nodeIds.filter(id => id !== question.correctAnswer.nodeId).map(cell);
const optionCount = question => isChoice(question) ? question.choices.length : question.nodeIds.length;

// 基準データ §3 フェーズ3の構成（2026-11-17 の判断基準で拡充した8問）。
// 柱立て→処理順・伸長先（前半）→方向の規則（選択肢2問）→処理順・伸長先（後半）→完成。
assert.equal(content.id, "wall-extension-check"); assert.equal(content.phase, 3); assert.equal(content.stageName, "動きの確認問題");
assert.equal(content.kind, "concept-check");
assert.equal(content.questions.length, 8);
assert.deepEqual(plain(content.questions.map(q => [q.id, q.prompt, q.stepId, isChoice(q) ? q.correctAnswer.choiceId : q.correctAnswer.nodeId, q.tags[0], isChoice(q) ? "choice" : q.direction])), [
  ["next-pillar-place", "次に立てる柱はどれですか", "pillar-6-2", "2,4", "pillar-placement", null],
  ["next-pillar", "次に処理する柱はどれですか", "extend-2-4", "4,4", "pillar-order", null],
  ["wall-target", "壁になるマスはどれですか", "extend-2-4", "5,4", "extension-target", "right"],
  ["allowed-directions-lower", "一番上の段以外の柱が壁を伸ばせる方向はどれですか", "extend-2-4", "three-without-up", "allowed-directions", "choice"],
  ["allowed-directions-top", "一番上の段の柱が壁を伸ばせる方向はどれですか", "directions-rule", "four-directions", "allowed-directions", "choice"],
  ["next-pillar-late", "次に処理する柱はどれですか", "extend-2-6", "4,6", "pillar-order", null],
  ["wall-target-late", "壁になるマスはどれですか", "extend-2-6", "5,6", "extension-target", "right"],
  ["maze-completion", "すべての柱から壁を伸ばし終わりました。この後はどうなりますか", "extend-6-6", "completed", "completion", "choice"],
]);
// 状況キャプション（Issue #297）: 直前の出来事を完了形で、前提の次の処理を未来形で示す。
assert.equal(place.situation, "一番上の段の右の柱を立てました。");
assert.equal(q1.situation, "真ん中の段の左の柱から、下へ壁を伸ばしました。");
assert.equal(q2.situation, "次は、真ん中の段の真ん中の柱から壁を伸ばします。");
assert.equal(lower.situation, q1.situation);
assert.equal(top.situation, "柱をすべて立て終わりました。");
assert.equal(late1.situation, "一番下の段の左の柱から、右へ壁を伸ばしました。");
assert.equal(late2.situation, "次は、一番下の段の真ん中の柱から壁を伸ばします。");
assert.equal(completion.situation, "一番下の段の右の柱から、下へ壁を伸ばしました。");
assert.equal(place.requires, null); assert.equal(q1.requires, null);
assert.deepEqual(plain(q2.requires), { questionId: q1.id, answer: plain(q1.correctAnswer) });
assert.deepEqual(plain(late2.requires), { questionId: late1.id, answer: plain(late1.correctAnswer) });
assert(content.questions.filter(q => !isChoice(q)).every(q => q.allowNone === false), "No none option: every tap question has an actual cell");
assert.equal(content.completion.stepId, "extend-4-4");

// 正解は組み立て済みトレースと一致しなければならない（独立照合）。
const extensions = plain(maze.wallExtensionExtensions(9, maze.wallExtensionMainChoices));
assert.deepEqual(extensions[4], { pillar: "4,4", direction: "right", target: "5,4" });
assert.equal(q1.correctAnswer.nodeId, extensions[4].pillar, "Second question answer is the 5th pillar");
assert.equal(q2.correctAnswer.nodeId, extensions[4].target, "Third question answer is the 5th extension target");
assert.equal(q2.direction, extensions[4].direction);
assert.deepEqual(extensions[7], { pillar: "4,6", direction: "right", target: "5,6" });
assert.equal(late1.correctAnswer.nodeId, extensions[7].pillar, "Late order answer is the 8th pillar");
assert.equal(late2.correctAnswer.nodeId, extensions[7].target, "Late target answer is the 8th extension target");
assert.deepEqual(extensions[8], { pillar: "6,6", direction: "down", target: "6,7" });
const pillars = plain(maze.wallExtensionPillars(9));
assert.equal(place.correctAnswer.nodeId, pillars[3], "Placement answer is the 4th pillar in row-major order");

// 場面: 前提のない設問はフェーズ2のステップ canvas そのもの、前提のある設問は
// 同じ盤面で処理中の柱だけが移る。選択肢設問もステップ canvas をそのまま使う。
const scenes = Object.fromEntries(content.questions.map(q => [q.id, getWallExtensionCheckScene(q)]));
assert.equal(scenes[place.id], get(execution, "pillar-6-2").canvas, "Placement scene is the phase-2 step canvas by reference");
assert.equal(scenes[q1.id], get(execution, "extend-2-4").canvas, "Order scene is the phase-2 step canvas by reference");
assert.equal(get(execution, "extend-2-4").canvas.state.walls.length, 45, "Scene board has border + pillars + 4 extensions");
assert.deepEqual(new Set(scenes[q2.id].state.walls), new Set(get(execution, "extend-2-4").canvas.state.walls), "Target scene keeps the same board");
assert.equal(scenes[q2.id].state.processing, "4,4", "Target scene marks the premise pillar as processing");
assert.equal(scenes[q2.id].state.target, null); assert.deepEqual(plain(scenes[q2.id].highlights), []);
assert.equal(scenes[lower.id], get(execution, "extend-2-4").canvas);
assert.equal(scenes[top.id], get(execution, "directions-rule").canvas);
assert.equal(scenes[late1.id], get(execution, "extend-2-6").canvas);
assert.equal(scenes[late2.id].state.processing, "4,6", "Late target scene marks the premise pillar as processing");
assert.deepEqual(new Set(scenes[late2.id].state.walls), new Set(get(execution, "extend-2-6").canvas.state.walls));
assert.equal(scenes[completion.id], get(execution, "extend-6-6").canvas);
for (const q of content.questions) validateMazeGridCanvas(scenes[q.id]);

// 回答対象: 柱を問う設問は柱9マス、伸長先を問う設問は処理する柱に隣接する未壁マスだけ。
assert.deepEqual(plain(place.nodeIds), pillars);
assert.deepEqual(plain(q1.nodeIds), pillars);
assert.deepEqual(plain(late1.nodeIds), pillars);
const wallSet = new Set(get(execution, "extend-2-4").canvas.state.walls);
const expectedCandidates = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => `${4 + dx},${4 + dy}`).filter(key => !wallSet.has(key));
assert.deepEqual(new Set(q2.nodeIds), new Set(expectedCandidates), "Target candidates are the open neighbors of the pillar");
assert.equal(q2.nodeIds.length, 3); assert(!q2.nodeIds.includes("4,3"), "Already-walled neighbor is not a candidate");
const lateWallSet = new Set(get(execution, "extend-2-6").canvas.state.walls);
const expectedLateCandidates = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => `${4 + dx},${6 + dy}`).filter(key => !lateWallSet.has(key));
assert.deepEqual(new Set(late2.nodeIds), new Set(expectedLateCandidates), "Late target candidates are the open neighbors of the pillar");
assert.equal(late2.nodeIds.length, 3); assert(!late2.nodeIds.includes("3,6"), "The 7th extension target is already a wall");

// 復習は元ステップを参照のまま使う。
for (const q of content.questions) {
  const review = selectReviewContent(execution, q.reviewStepIds);
  review.steps.forEach((reviewStep, index) => assert.equal(reviewStep, get(execution, q.reviewStepIds[index]), "Review uses original steps by reference"));
}
const pairReview = selectReviewContent(execution, q2.reviewStepIds);
assert.equal(pairReview.steps.at(-1).id, "extend-4-4");
assert(pairReview.steps.at(-1).canvas.state.walls.includes("5,4"), "Review shows the answered extension");

// 共通エンジンの進行: 回答では進まず、ボタンで進む。正解しなくても完了できる（ソフトゲート）。
let state = createAssessmentState(content);
assert.equal(advanceAssessment(content, state, place.id), state, "No advancing before an answer");
assert.equal(answerQuestion(content, state, q1.id, cell("4,4")), state, "No answering a future question");
assert.equal(answerQuestion(content, state, place.id, { kind: "none" }), state, "None is not an allowed answer");
assert.equal(answerQuestion(content, state, place.id, cell("1,1")), state, "Non-pillar cells are not answerable in the placement question");
assert.equal(answerQuestion(content, state, place.id, choice("completed")), state, "Choice answers cannot affect tap questions");
for (const q of content.questions) {
  for (const wrong of wrongAnswers(q)) {
    const previous = state;
    state = answerQuestion(content, state, q.id, wrong);
    assert.equal(activeQuestion(content, state).id, q.id, "A wrong answer does not advance");
    assert.equal(newAnswerFeedback(content, previous, state).message, "不正解。もう一度考えてみよう。");
    const saved = JSON.stringify(state);
    selectReviewContent(execution, q.reviewStepIds);
    assert.equal(JSON.stringify(state), saved, "Opening a review does not change attempts");
  }
  const previous = state;
  state = answerQuestion(content, state, q.id, correctOf(q));
  assert.equal(newAnswerFeedback(content, previous, state).message, "正解！");
  assert.equal(newAnswerFeedback(content, state, state), null, "Rerenders are silent");
  assert.equal(state.records.find(r => r.questionId === q.id).firstCorrect, false, "Retry success preserves the first failure");
  assert.equal(state.records.find(r => r.questionId === q.id).attemptCount, optionCount(q), "Every option was tried exactly once");
  assert.equal(activeQuestion(content, state).id, q.id, "Success waits for the explicit next button");
  state = advanceAssessment(content, state, q.id);
}
assert(assessmentComplete(content, state));
assert.equal(activeQuestion(content, state), null);
assert.equal(answerQuestion(content, state, q2.id, cell("5,4")), state, "Complete session does not accept more answers");
let firstTry = createAssessmentState(content);
for (const q of content.questions) {
  firstTry = answerQuestion(content, firstTry, q.id, correctOf(q));
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
const invalid = plain(content); invalid.questions[2].requires.answer.nodeId = "2,2";
assert.throws(() => validateAssessment(invalid));
assert.throws(() => selectReviewContent(execution, ["missing"]));

// 実描画: タップ設問は候補ごとに回答ボタン1つ、選択肢設問の盤面は表示のみ。
const { WallExtensionCheckCanvas } = load(file("wall-extension/check/WallExtensionCheckCanvas.tsx"));
const ariaLabel = key => { const [x, y] = key.split(",").map(Number); return `${x + 1}列目、${y + 1}行目のマスを選ぶ`; };
for (const q of content.questions) {
  const scene = scenes[q.id], saved = JSON.stringify(scene);
  if (isChoice(q)) {
    const html = renderToStaticMarkup(React.createElement(WallExtensionCheckCanvas, { canvas: scene, onAnswer() {} }));
    assert.equal((html.match(/<button\b/g) || []).length, 0, "Choice scenes are display-only");
    assert.equal((html.match(/data-maze-wall="true"/g) || []).length, scene.state.walls.length, "Rendered walls match the scene board");
  } else {
    const html = renderToStaticMarkup(React.createElement(WallExtensionCheckCanvas, { canvas: scene, questionId: q.id, cellIds: q.nodeIds, onAnswer() {} }));
    assert.equal((html.match(/<button\b/g) || []).length, q.nodeIds.length, "One answer button per candidate cell");
    assert.equal((html.match(/data-maze-wall="true"/g) || []).length, scene.state.walls.length, "Rendered walls match the scene board");
    assert.match(html, /role="group" aria-label="回答の選択肢"/);
    for (const id of q.nodeIds) assert.equal(html.split(`aria-label="${ariaLabel(id)}"`).length - 1, 1, `One labelled button for ${id}`);
    const locked = renderToStaticMarkup(React.createElement(WallExtensionCheckCanvas, { canvas: scene, questionId: q.id, cellIds: q.nodeIds, disabled: true, onAnswer() {} }));
    assert.equal((locked.match(/ disabled=""/g) || []).length, q.nodeIds.length, "Correct responses lock every answer control");
  }
  assert.equal(JSON.stringify(scene), saved, "Rendering must not mutate the scene");
}
const completionHtml = renderToStaticMarkup(React.createElement(WallExtensionCheckCanvas, { canvas: get(execution, content.completion.stepId).canvas, onAnswer() {} }));
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
const { WallExtensionCheckPreview } = ui(file("wall-extension/check/WallExtensionCheckPreview.tsx"));
const Canvas = ui(file("wall-extension/check/WallExtensionCheckCanvas.tsx")).WallExtensionCheckCanvas;
const ReviewButton = ui(file("review/AssessmentReviewButton.tsx")).AssessmentReviewButton;
const ReviewDialog = ui(file("review/LearningReviewDialog.tsx")).LearningReviewDialog;
const elements = value => !value || typeof value !== "object" ? [] : Array.isArray(value) ? value.flatMap(elements) : [value, ...elements(value.props?.children)];
let tree;
const render = () => { cursor = 0; tree = elements(WallExtensionCheckPreview({})); };
const canvasProps = () => tree.find(element => element.type === Canvas).props;
const button = label => { const element = tree.find(element => element.props?.children === label); assert(element, `Missing button: ${label}`); return element.props; };
render();
assert(tree.some(element => element.props?.children === place.situation), "First question shows the situation caption");
const first = canvasProps();
assert.equal(first.questionId, place.id); assert.equal(first.disabled, false);
assert.deepEqual(plain(first.canvas), plain(scenes[place.id]), "Preview shows the phase-2 step canvas for the placement question");
first.onAnswer(cell("2,2")); render();
assert.equal(canvasProps().questionId, place.id); assert.equal(canvasProps().disabled, false);
tree.find(element => element.type === ReviewButton).props.onClick(); render();
const dialog = tree.find(element => element.type === ReviewDialog);
assert(dialog); assert.equal(dialog.props.stepIds.join(), place.reviewStepIds.join());
const recordBeforeReviewClose = slots[0]; dialog.props.onClose(); render();
assert.equal(slots[0], recordBeforeReviewClose, "Review does not change the session");
canvasProps().onAnswer(cell("2,4")); render();
assert.equal(canvasProps().disabled, true, "Correct answer locks the board");
const solved = slots[0]; first.onAnswer(cell("2,4")); render();
assert.equal(slots[0], solved, "Even a queued duplicate cannot add another attempt after success");
button("次の問題へ").onClick(); render();
assert.equal(canvasProps().questionId, q1.id);
canvasProps().onAnswer(cell("4,4")); render();
button("次の問題へ").onClick(); render();
assert(tree.some(element => element.props?.children === q2.situation), "Target question shows the situation caption");
assert.equal(canvasProps().questionId, q2.id);
assert.equal(canvasProps().canvas.state.processing, "4,4");
assert(tree.some(element => Array.isArray(element.props?.children) && element.props.children.join("") === "方向の指示：右"), "Target question shows the direction indication");
first.onAnswer(cell("4,4")); render();
assert.equal(slots[0].records[2].attemptCount, 0, "Stale first-question callbacks cannot answer question 3");
canvasProps().onAnswer(cell("3,4")); render();
canvasProps().onAnswer(cell("5,4")); render();
button("次の問題へ").onClick(); render();
// 選択肢設問は盤面に回答ボタンを持たず、選択肢ボタンで答える。
for (const q of [lower, top]) {
  assert.equal(canvasProps().questionId, undefined, "Choice questions give the canvas no answer cells");
  const correctText = q.choices.find(option => option.id === q.correctAnswer.choiceId).text;
  button(correctText).onClick(); render();
  button("次の問題へ").onClick(); render();
}
assert.equal(canvasProps().questionId, late1.id);
canvasProps().onAnswer(cell("4,6")); render();
button("次の問題へ").onClick(); render();
assert.equal(canvasProps().questionId, late2.id);
assert.equal(canvasProps().canvas.state.processing, "4,6");
canvasProps().onAnswer(cell("5,6")); render();
button("次の問題へ").onClick(); render();
const completionCorrectText = completion.choices.find(option => option.id === completion.correctAnswer.choiceId).text;
button(completionCorrectText).onClick(); render();
button("結果を見る").onClick(); render();
assert(tree.some(element => element.props?.children === content.completion.caption), "Completion shows the completion caption");
assert.equal(canvasProps().questionId, undefined);

const previewSource = fs.readFileSync(file("wall-extension/check/WallExtensionCheckPreview.tsx"), "utf8");
// レイアウト契約（#298）: 3段組。図は固定高の枠の中で表示し、進行操作は下部の固定ゾーンに置く。
assert.match(previewSource, /height: "min\(54dvh, 600px\)", flexShrink: 0/, "check canvas sits in a fixed-height frame (#298)");
assert.match(previewSource, /flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column"/, "check body flows in the middle scroll region (#298)");
assert.match(previewSource, /borderTop: `1px solid/, "advance actions live in the fixed bottom zone (#298)");

assert.match(previewSource, /advanceAssessment\(wallExtensionCheckContent, current, question\.id\)/);
assert.match(previewSource, /"結果を見る" : "次の問題へ"/);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "wall-extension-check"'), "Standalone preview is registered");
console.log("Wall-extension check verified: 8 questions (pillar placement, pillar order and extension targets at two scenes, allowed-direction rules as choices, completion) on phase-2 boards, verified trace answers, scene derivation, soft gate and retries, first-attempt records, callback locking, cell/choice answer controls and standalone preview.");
