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
const { mazeDiggingCheckContent: content, getMazeDiggingCheckScene } = load(file("maze-digging/check/check.content.ts"));
const { mazeDiggingExecutionContent: execution } = load(file("maze-digging/execution/execution.content.ts"));
const maze = load(file("maze-digging/mazeDiggingMaze.ts"));
const { getLearningStep: get, selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateMazeDiggingCanvas } = load(file("maze-digging/mazeDiggingCanvas.ts"));
const { validateAssessment, createAssessmentState, answerQuestion, advanceAssessment, activeQuestion, assessmentComplete } = load(file("assessment/assessment.ts"));
const { newAnswerFeedback } = load(file("assessment/answerFeedbackState.ts"));
const [first, q1, q2, count, deadEnd, total] = content.questions;
const isChoice = q => "kind" in q;
const correctOf = q => q.correctAnswer;
const wrongAnswers = q => isChoice(q)
  ? q.choices.filter(option => option.id !== q.correctAnswer.choiceId).map(option => choice(option.id))
  : q.nodeIds.filter(id => id !== q.correctAnswer.nodeId).map(cell);

// 基準データ §3 フェーズ3の構成（2026-11-17 の判断基準で監査し、連結2問から6問へ拡充）。
assert.equal(content.id, "maze-digging-check"); assert.equal(content.phase, 3); assert.equal(content.stageName, "動きの確認問題");
assert.equal(content.kind, "concept-check");
assert.equal(content.questions.length, 6);
assert.deepEqual(plain(content.questions.map(q => [q.id, q.prompt, q.stepId, q.tags[0]])), [
  ["first-dig-room", "(1, 1) から右へ掘ります。掘られる部屋はどれですか", "dig-start", "dig-target"],
  ["next-room", "(3, 5) から右へ掘ります。掘られる部屋はどれですか", "dig-3", "dig-target"],
  ["between-wall", "そのとき通路になる、間の壁マスはどれですか", "dig-3", "dig-between"],
  ["candidate-count", "(3, 5) から掘れる部屋は、いくつありますか", "dig-3", "dig-candidates"],
  ["dead-end-next", "行き止まりの (1, 5) では、この後どうなりますか", "dig-6", "backtrack-resume"],
  ["completion-count", "スタートの部屋 (1, 1) は最初に掘ってあります。それ以外の部屋を掘った回数は、全部で何回ですか", "complete", "dig-count"],
]);
assert.deepEqual(plain(content.questions.map(q => isChoice(q) ? q.correctAnswer.choiceId : q.correctAnswer.nodeId)),
  ["3,1", "7,3", "6,3", "three", "resume-digging", "fifteen"]);
assert.equal(first.requires, null); assert.equal(q1.requires, null);
assert.deepEqual(plain(q2.requires), { questionId: q1.id, answer: plain(q1.correctAnswer) });
assert(content.questions.filter(q => !isChoice(q)).every(q => q.allowNone === false), "No none option: every tap question has an actual cell");
assert.equal(content.completion.stepId, "dig-4");

// 契約 maze-digging-v1 を独立に再実装し、正解・場面・回答対象を突き合わせる（基準データ §1）。
function referenceRun(size, choices) {
  const grid = Array.from({ length: size }, () => Array(size).fill(1));
  grid[1][1] = 0;
  const stack = [[1, 1]];
  const digs = [];
  const pops = [];
  let step = 0;
  const wallsOf = () => {
    const walls = new Set();
    grid.forEach((row, y) => row.forEach((value, x) => { if (value === 1) walls.add(`${x},${y}`); }));
    return walls;
  };
  const candidatesOf = ([x, y]) => {
    const candidates = [];
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + 2 * dx, ny = y + 2 * dy;
      if (nx >= 1 && nx < size - 1 && ny >= 1 && ny < size - 1 && grid[ny][nx] === 1) candidates.push([nx, ny]);
    }
    return candidates;
  };
  while (stack.length) {
    const top = stack[stack.length - 1];
    const candidates = candidatesOf(top);
    if (candidates.length) {
      const [nx, ny] = candidates[choices[step]]; step += 1;
      grid[(top[1] + ny) / 2][(top[0] + nx) / 2] = 0; grid[ny][nx] = 0;
      stack.push([nx, ny]);
      digs.push({ from: `${top[0]},${top[1]}`, room: `${nx},${ny}`, between: `${(top[0] + nx) / 2},${(top[1] + ny) / 2}`, walls: wallsOf(), candidates: candidates.map(([cx, cy]) => `${cx},${cy}`) });
    } else {
      pops.push(`${top[0]},${top[1]}`);
      stack.pop();
    }
  }
  assert.equal(step, choices.length, "Reference consumes every choice");
  return { digs, pops };
}
const reference = referenceRun(9, [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0]);
const referenceDigs = reference.digs;
assert.equal(referenceDigs.length, 15, "15 digs for 16 rooms");
assert.deepEqual([referenceDigs[0].from, referenceDigs[0].room, referenceDigs[0].between], ["1,1", "3,1", "2,1"]);
assert.deepEqual([referenceDigs[3].from, referenceDigs[3].room, referenceDigs[3].between], ["5,3", "7,3", "6,3"]);
assert.deepEqual(referenceDigs[3].candidates, ["5,1", "7,3", "5,5"], "Three candidates at the dig-3 scene");
assert.deepEqual(reference.pops.slice(0, 2), ["5,1", "7,1"], "The first backtrack pops the dead end (5,1) first");
assert.equal(referenceDigs[6].from, "7,3", "Digging resumes at (7,3) after the first backtrack");
const moduleRun = maze.runMazeDigging(maze.mazeDiggingMainSize, maze.mazeDiggingMainChoices);
assert.deepEqual(plain(moduleRun.digs.map(d => [d.from, d.room, d.between])), referenceDigs.map(d => [d.from, d.room, d.between]),
  "Shared builder matches the independent reference");
const moduleBacktracks = maze.mazeDiggingBacktracks(moduleRun.digs);
assert.equal(moduleBacktracks[0].afterDigIndex, 5);
assert.deepEqual(plain(moduleBacktracks[0].poppedRooms), ["5,1", "7,1"]);
assert.equal(moduleBacktracks[0].resumeRoom, "7,3");

// 場面: 各設問ともフェーズ2のステップ canvas そのもの（参照で一致し、壁を複製しない）。
const scenes = Object.fromEntries(content.questions.map(q => [q.id, getMazeDiggingCheckScene(q)]));
for (const q of content.questions) assert.equal(scenes[q.id], get(execution, q.stepId).canvas, `Scene for ${q.id} is the phase-2 step canvas by reference`);
assert.equal(scenes[first.id].state.walls.length, 80, "dig-start board has 81 - 1 (start) walls");
assert.equal(scenes[first.id].state.processing, "1,1");
assert.equal(scenes[q1.id].state.walls.length, 74, "dig-3 board has 81 - 1 (start) - 3 digs x 2 walls");
assert.deepEqual(new Set(scenes[q1.id].state.walls), referenceDigs[2].walls, "dig-3 walls match the reference after 3 digs");
assert.equal(scenes[q1.id].state.processing, "5,3", "dig-3 marks the current room");
assert.equal(scenes[deadEnd.id].state.processing, "5,1", "dig-6 marks the dead-end room");
assert.deepEqual(new Set(scenes[deadEnd.id].state.walls), referenceDigs[5].walls, "dig-6 walls match the reference after 6 digs");
assert.equal(scenes[total.id].state.walls.length, 50, "Completed board has 81 - 31 open cells");
for (const q of content.questions) validateMazeDiggingCanvas(scenes[q.id]);

// 回答対象: タップ設問はアルゴリズムが実際に集める候補そのもの（提示順）。
assert.deepEqual(plain(first.nodeIds), ["3,1", "1,3"]);
assert.deepEqual(plain(q1.nodeIds), ["5,1", "7,3", "5,5"]);
assert(!q1.nodeIds.includes("3,3"), "Already-dug room is not a candidate");
assert.deepEqual(plain(q2.nodeIds), ["5,2", "6,3", "5,4"]);
assert(q2.nodeIds.every(id => referenceDigs[2].walls.has(id)), "Every between candidate is still a wall in the scene");
assert.equal(count.choices.find(option => option.id === count.correctAnswer.choiceId).text, "3つ");
assert.equal(deadEnd.choices.find(option => option.id === deadEnd.correctAnswer.choiceId).text, "掘れる部屋がある (3, 7) まで戻って、そこから掘り直す");
assert.equal(total.choices.find(option => option.id === total.correctAnswer.choiceId).text, "15回");

// 復習は元ステップを参照のまま使う。
for (const q of content.questions) {
  const review = selectReviewContent(execution, q.reviewStepIds);
  review.steps.forEach((reviewStep, index) => assert.equal(reviewStep, get(execution, q.reviewStepIds[index]), "Review uses original steps by reference"));
}
assert.equal(selectReviewContent(execution, q1.reviewStepIds).steps.at(-1).canvas.state.processing, "7,3");
assert.equal(selectReviewContent(execution, deadEnd.reviewStepIds).steps.at(-1).id, "dig-7", "Dead-end review ends at the resumed dig");

// 共通エンジンの進行: 回答では進まず、ボタンで進む。正解しなくても完了できる（ソフトゲート）。
let state = createAssessmentState(content);
assert.equal(advanceAssessment(content, state, first.id), state, "No advancing before an answer");
assert.equal(answerQuestion(content, state, q1.id, cell("7,3")), state, "No answering a future question");
assert.equal(answerQuestion(content, state, first.id, { kind: "none" }), state, "None is not an allowed answer");
assert.equal(answerQuestion(content, state, first.id, cell("1,1")), state, "Non-candidate cells are not answerable");
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
  state = answerQuestion(content, state, q.id, correctOf(q));
  assert.equal(newAnswerFeedback(content, previous, state).message, "正解！");
  assert.equal(newAnswerFeedback(content, state, state), null, "Rerenders are silent");
  assert.equal(state.records.find(r => r.questionId === q.id).firstCorrect, false, "Retry success preserves the first failure");
  assert.equal(state.records.find(r => r.questionId === q.id).attemptCount, wrongs.length + 1);
  assert.equal(activeQuestion(content, state).id, q.id, "Success waits for the explicit next button");
  state = advanceAssessment(content, state, q.id);
}
assert(assessmentComplete(content, state));
assert.equal(activeQuestion(content, state), null);
assert.equal(answerQuestion(content, state, total.id, correctOf(total)), state, "Complete session does not accept more answers");
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
const { MazeDiggingCheckCanvas } = load(file("maze-digging/check/MazeDiggingCheckCanvas.tsx"));
const ariaLabel = key => { const [x, y] = key.split(",").map(Number); return `${x + 1}列目、${y + 1}行目のマスを選ぶ`; };
for (const q of content.questions) {
  const scene = scenes[q.id], saved = JSON.stringify(scene);
  if (isChoice(q)) {
    const html = renderToStaticMarkup(React.createElement(MazeDiggingCheckCanvas, { canvas: scene, onAnswer() {} }));
    assert.equal((html.match(/<button\b/g) || []).length, 0, "Choice scenes are display-only");
    assert.equal((html.match(/data-maze-wall="true"/g) || []).length, scene.state.walls.length, "Rendered walls match the scene board");
  } else {
    const html = renderToStaticMarkup(React.createElement(MazeDiggingCheckCanvas, { canvas: scene, questionId: q.id, cellIds: q.nodeIds, onAnswer() {} }));
    assert.equal((html.match(/<button\b/g) || []).length, q.nodeIds.length, "One answer button per candidate cell");
    assert.equal((html.match(/data-maze-wall="true"/g) || []).length, scene.state.walls.length, "Rendered walls match the scene board");
    assert.match(html, /role="group" aria-label="回答の選択肢"/);
    for (const id of q.nodeIds) assert.equal(html.split(`aria-label="${ariaLabel(id)}"`).length - 1, 1, `One labelled button for ${id}`);
    const locked = renderToStaticMarkup(React.createElement(MazeDiggingCheckCanvas, { canvas: scene, questionId: q.id, cellIds: q.nodeIds, disabled: true, onAnswer() {} }));
    assert.equal((locked.match(/ disabled=""/g) || []).length, q.nodeIds.length, "Correct responses lock every answer control");
  }
  assert.equal(JSON.stringify(scene), saved, "Rendering must not mutate the scene");
}
const completionHtml = renderToStaticMarkup(React.createElement(MazeDiggingCheckCanvas, { canvas: get(execution, content.completion.stepId).canvas, onAnswer() {} }));
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
const { MazeDiggingCheckPreview } = ui(file("maze-digging/check/MazeDiggingCheckPreview.tsx"));
const Canvas = ui(file("maze-digging/check/MazeDiggingCheckCanvas.tsx")).MazeDiggingCheckCanvas;
const ReviewButton = ui(file("review/AssessmentReviewButton.tsx")).AssessmentReviewButton;
const ReviewDialog = ui(file("review/LearningReviewDialog.tsx")).LearningReviewDialog;
const elements = value => !value || typeof value !== "object" ? [] : Array.isArray(value) ? value.flatMap(elements) : [value, ...elements(value.props?.children)];
let tree;
const render = () => { cursor = 0; tree = elements(MazeDiggingCheckPreview({})); };
const canvasProps = () => tree.find(element => element.type === Canvas).props;
const button = label => { const element = tree.find(element => element.props?.children === label); assert(element, `Missing button: ${label}`); return element.props; };
render();
const firstProps = canvasProps();
assert.equal(firstProps.questionId, first.id); assert.equal(firstProps.disabled, false);
assert.deepEqual(plain(firstProps.canvas), plain(scenes[first.id]), "Preview shows the phase-2 step canvas for the first question");
assert(tree.some(element => element.props?.children === first.prompt), "First prompt presents the direction in its text");
firstProps.onAnswer(cell("1,1")); render();
assert.equal(slots[0].records[0].attemptCount, 0, "A non-candidate tap records no attempt");
canvasProps().onAnswer(cell("1,3")); render();
tree.find(element => element.type === ReviewButton).props.onClick(); render();
const dialog = tree.find(element => element.type === ReviewDialog);
assert(dialog); assert.equal(dialog.props.stepIds.join(), first.reviewStepIds.join());
const recordBeforeReviewClose = slots[0]; dialog.props.onClose(); render();
assert.equal(slots[0], recordBeforeReviewClose, "Review does not change the session");
canvasProps().onAnswer(cell("3,1")); render();
assert.equal(canvasProps().disabled, true, "Correct answer locks the board");
const solved = slots[0]; firstProps.onAnswer(cell("3,1")); render();
assert.equal(slots[0], solved, "Even a queued duplicate cannot add another attempt after success");
button("次の問題へ").onClick(); render();
assert.equal(canvasProps().questionId, q1.id);
firstProps.onAnswer(cell("7,3")); render();
assert.equal(slots[0].records[1].attemptCount, 0, "Stale first-question callbacks cannot answer question 2");
canvasProps().onAnswer(cell("5,1")); render();
canvasProps().onAnswer(cell("7,3")); render();
button("次の問題へ").onClick(); render();
assert.equal(canvasProps().questionId, q2.id);
assert.equal(canvasProps().canvas.state.processing, "5,3", "Between question keeps the same current room");
canvasProps().onAnswer(cell("5,2")); render();
canvasProps().onAnswer(cell("6,3")); render();
button("次の問題へ").onClick(); render();
// 選択肢設問は盤面に回答ボタンを持たず、選択肢ボタンで答える。
for (const q of [count, deadEnd, total]) {
  assert.equal(canvasProps().questionId, undefined, "Choice questions give the canvas no answer cells");
  const wrongText = q.choices.find(option => option.id !== q.correctAnswer.choiceId).text;
  button(wrongText).onClick(); render();
  const correctText = q.choices.find(option => option.id === q.correctAnswer.choiceId).text;
  button(correctText).onClick(); render();
  button(q === total ? "結果を見る" : "次の問題へ").onClick(); render();
}
assert(tree.some(element => element.props?.children === content.completion.caption), "Completion shows the completion caption");
assert.equal(canvasProps().questionId, undefined);

const previewSource = fs.readFileSync(file("maze-digging/check/MazeDiggingCheckPreview.tsx"), "utf8");
// レイアウト契約（#298）: 3段組。図は固定高の枠の中で表示し、進行操作は下部の固定ゾーンに置く。
assert.match(previewSource, /height: "min\(54dvh, 600px\)", flexShrink: 0/, "check canvas sits in a fixed-height frame (#298)");
assert.match(previewSource, /flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column"/, "check body flows in the middle scroll region (#298)");
assert.match(previewSource, /borderTop: `1px solid/, "advance actions live in the fixed bottom zone (#298)");
assert.match(previewSource, /aria-label="解答の選択肢"/, "choice questions render a labelled choice group");
assert.match(previewSource, /advanceAssessment\(mazeDiggingCheckContent, current, question\.id\)/);
assert.match(previewSource, /"結果を見る" : "次の問題へ"/);
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "maze-digging-check"'), "Standalone preview is registered");
console.log("Maze-digging check verified: 6 questions (3 tap / 3 choice) across the trace, verified answers from the independent reference, candidate derivation, backtrack and completion understanding, soft gate and retries, first-attempt records, callback locking, cell/choice answer controls and standalone preview.");
