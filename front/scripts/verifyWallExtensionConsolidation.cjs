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
const { wallExtensionConsolidationContent: content, validateWallExtensionConsolidation } = load(file("wall-extension/consolidation/consolidation.content.ts"));
const maze = load(file("wall-extension/wallExtensionMaze.ts"));
const { wallExtensionExecutionContent: execution } = load(file("wall-extension/execution/execution.content.ts"));
const { wallExtensionCodeMappingContent: mapping } = load(file("wall-extension/code-mapping/codeMapping.content.ts"));
const { wallExtensionCode: code } = load(file("wall-extension/code-mapping/wallExtensionCode.ts"));
const { getLearningStep, selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateMazeGridCanvas } = load(file("player/mazeGrid.types.ts"));
const { createAssessmentState, activeQuestion, answerQuestion, advanceAssessment, assessmentComplete, diagnoseAssessment, sameAnswer } = load(file("assessment/assessment.ts"));
const [q1, q2, q3, q4] = content.questions;

// 基準データ §3 フェーズ6の構成（転移タップ・性質の選択・理由の選択・Parsons の4問）。
validateWallExtensionConsolidation(content);
assert.equal(content.id, "wall-extension-consolidation"); assert.equal(content.phase, 6); assert.equal(content.stageName, "応用問題");
assert.equal(content.questions.length, 4);
assert.equal(content.code, code); assert.equal(code.id, "wall-extension-v1"); assert.equal(code.version, 1);
const stageBracket = name => `${String.fromCharCode(0x3010)}${name}${String.fromCharCode(0x3011)}`;
assert.equal(content.completion, `理解の状況が確認できました。それでは${stageBracket("自分で実装")}に進み、自分の手でコードを完成させましょう！`);
assert.deepEqual(plain(content.questions.map(q => [q.id, q.kind, q.tags[0]])), [
  ["transfer-wall-target", "node", "壁が伸びる先の追跡"],
  ["completed-maze-properties", "choice", "完成した迷路の性質"],
  ["no-upward-extension", "choice", "上に伸ばせない理由"],
  ["whole-code-order", "parsons", "コード全体の流れ"],
]);

// 教材モジュールを使わず、基準データ §1・§2 の規則から迷路生成を独立に再実装する。
function generateMaze(size, choices) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0));
  for (let i = 0; i < size; i++) { grid[0][i] = 1; grid[size - 1][i] = 1; grid[i][0] = 1; grid[i][size - 1] = 1; }
  const pillars = [];
  for (let y = 2; y < size - 1; y += 2) for (let x = 2; x < size - 1; x += 2) { grid[y][x] = 1; pillars.push([x, y]); }
  const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const extensions = pillars.map(([x, y], index) => {
    const allowed = y === 2 ? ["up", "down", "left", "right"] : ["down", "left", "right"];
    const name = allowed[choices[index]];
    const [dx, dy] = dirs[name];
    grid[y + dy][x + dx] = 1;
    return { pillar: `${x},${y}`, direction: name, target: `${x + dx},${y + dy}` };
  });
  return { grid, pillars, extensions };
}

// Q1: 7×7 の検証済みトレース（choices [1,2,2,0]）と、場面・候補・正解の一致。
const small = generateMaze(7, [1, 2, 2, 0]);
assert.deepEqual(small.extensions, [
  { pillar: "2,2", direction: "down", target: "2,3" },
  { pillar: "4,2", direction: "left", target: "3,2" },
  { pillar: "2,4", direction: "right", target: "3,4" },
  { pillar: "4,4", direction: "down", target: "4,5" },
], "Independent 7x7 trace");
assert.equal(q1.prompt, "壁になるマスはどれですか");
assert.equal(q1.scene.data.size, 7);
assert.equal(q1.scene.state.processing, small.extensions[2].pillar);
assert.equal(q1.direction, small.extensions[2].direction);
assert.equal(q1.correctAnswer.nodeId, small.extensions[2].target);
assert.equal(q1.allowNone, false);
const expectedSceneWalls = [];
for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
  const border = x === 0 || y === 0 || x === 6 || y === 6;
  const pillar = small.pillars.some(([px, py]) => px === x && py === y);
  const extended = small.extensions.slice(0, 2).some(entry => entry.target === `${x},${y}`);
  if (border || pillar || extended) expectedSceneWalls.push(`${x},${y}`);
}
assert.equal(expectedSceneWalls.length, 30, "Border 24 + pillars 4 + first two extensions");
assert.deepEqual(new Set(q1.scene.state.walls), new Set(expectedSceneWalls));
assert.deepEqual(new Set(q1.scene.state.walls), new Set(plain(maze.buildWallExtensionWalls(7, maze.wallExtensionSmallChoices, 2))), "Scene matches the shared builder");
// 回答対象は柱 (2,4) に隣接する未壁マスだけ（既に壁の (2,3) を含まない）。フェーズ3 Q2 と同じ考え方。
assert.deepEqual(new Set(q1.nodeIds), new Set(["2,5", "1,4", "3,4"]));
assert(!q1.nodeIds.includes("2,3"), "Already-walled neighbor is not a candidate");
validateMazeGridCanvas(q1.scene);

// Q2: 場面はフェーズ2の完成盤面そのもの。独立実行した 9×9 が完全迷路であることから、
// 正解（全通路がつながり輪がない）を裏づけ、誤答（孤立・輪・壁の数の超過）を反証する。
assert.equal(q2.scene, getLearningStep(execution, "complete").canvas, "Q2 scene is the phase-2 completed board by reference");
const main = generateMaze(9, [3, 1, 2, 0, 2, 0, 2, 2, 0]);
const completedWalls = new Set(q2.scene.state.walls);
assert.equal(completedWalls.size, 50);
for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
  assert.equal(completedWalls.has(`${x},${y}`), main.grid[y][x] === 1, `Cell ${x},${y} matches the independent maze`);
}
const openCells = [];
for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if (main.grid[y][x] === 0) openCells.push(`${x},${y}`);
const seen = new Set([openCells[0]]);
const queue = [openCells[0]];
while (queue.length) {
  const [x, y] = queue.shift().split(",").map(Number);
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const key = `${x + dx},${y + dy}`;
    if (openCells.includes(key) && !seen.has(key)) { seen.add(key); queue.push(key); }
  }
}
assert.equal(seen.size, openCells.length, "Every open cell is reachable: no isolated passages");
let adjacency = 0;
for (const key of openCells) {
  const [x, y] = key.split(",").map(Number);
  if (openCells.includes(`${x + 1},${y}`)) adjacency++;
  if (openCells.includes(`${x},${y + 1}`)) adjacency++;
}
assert.equal(adjacency, openCells.length - 1, "Open cells form a tree: no loops");
assert.equal(main.extensions.length, main.pillars.length, "One extension per pillar: extended walls never exceed pillars");
assert.equal(q2.choices.length, 4);
assert.equal(q2.correctAnswer.choiceId, "connected-no-loops");
assert.equal(q2.choices.find(choice => choice.id === "connected-no-loops").text, "すべての通路がつながっていて、輪（ぐるりと回れる道）がない");
validateMazeGridCanvas(q2.scene);

// Q3: 場面はフェーズ2で最初の下段の柱 (2,4) を処理した盤面。上のマス (2,3) は壁でないため
// 「いつも壁」は誤りで、盤面内にあるため「盤面の外」も誤り。復習先はフェーズ4の y == 2 条件。
assert.equal(q3.scene, getLearningStep(execution, "extend-2-4").canvas, "Q3 scene is the phase-2 board by reference");
assert.equal(q3.scene.state.processing, "2,4");
assert(!new Set(q3.scene.state.walls).has("2,3"), "The cell above the pillar is open in the scene");
assert.equal(q3.choices.length, 3);
assert.equal(q3.correctAnswer.choiceId, "prevents-loops");
assert.deepEqual(plain(q3.reviewStepIds), ["if-first-row-2-4", "else-branch-2-4", "allowed-three-2-4"]);
assert.equal(getLearningStep(mapping, q3.stepId).canvas.highlights[0].id, "if-first-row", "Step points at the y == 2 condition line");
assert.match(getLearningStep(mapping, "else-branch-2-4").caption, /輪ができることがある/, "Phase 4 teaches the loop reason in the else frame");
validateMazeGridCanvas(q3.scene);

// 復習はすべてフェーズ4の元フレームを参照のまま使う（新しい盤面の答え合わせは作らない）。
for (const question of content.questions) {
  const review = selectReviewContent(mapping, question.reviewStepIds);
  review.steps.forEach((step, index) => assert.equal(step, mapping.steps.find(frame => frame.id === question.reviewStepIds[index])));
  assert(question.instruction.trim()); assert(question.correctFeedback.trim()); assert(question.incorrectFeedback.trim());
  assert(!/完璧|完全に理解|マスター/u.test(question.correctFeedback), "No overpraise in correct feedback");
}
assert.deepEqual(plain(q1.reviewStepIds), ["for-extension-4-4", "lookup-delta-4-4", "execution-extend-4-4"]);
assert.equal(q4.reviewStepIds.length, mapping.steps.length, "Parsons review covers every phase-4 frame");

// Q4: Parsons は参照コード21行すべて（妨害行なし、インデントは原文のまま）。
// 外周の4つの書き込みだけは互いに独立なので順序自由、それ以外は正解順に固定する。
const canonicalIds = plain(code.lines.map(line => line.id));
assert.equal(canonicalIds.length, 21);
assert.deepEqual([...q4.lineIds].sort(), [...canonicalIds].sort());
assert.notDeepEqual(plain(q4.lineIds), canonicalIds, "Presentation order is shuffled");
assert.deepEqual(plain(q4.correctAnswer.lineIds), canonicalIds);
assert.deepEqual(plain(q4.interchangeableLineGroups), [["border-top", "border-bottom", "border-left", "border-right"]]);
const { ParsonsBoard } = load(file("components/assessment/ParsonsBoard.tsx"));
const parsonsHtml = renderToStaticMarkup(React.createElement(ParsonsBoard, { question: q4, code, onAnswer: () => {} }));
// フェード型: 固定行は正解位置に固定表示され、可動行は初期並びの相対順序のまま残りの位置を埋める。
// 入れ替え可能グループ（外周の書き込み）は固定せず、可動のままにする。
assert.deepEqual(plain(q4.fixedLineIds), ["define-function", "initialize-grid", "for-border", "initialize-pillars", "for-pillar-row", "for-pillar-column", "define-directions", "return-grid"], "Faded split as designed");
{
  const fixedSet = new Set(q4.fixedLineIds);
  const movableInitial = q4.lineIds.filter(id => !fixedSet.has(id));
  let cursor = 0;
  const expectedOrder = q4.correctAnswer.lineIds.map(id => fixedSet.has(id) ? id : movableInitial[cursor++]);
  assert.deepEqual([...parsonsHtml.matchAll(/data-parsons-line-id="([^"]+)"/g)].map(match => match[1]), [...expectedOrder], "Fixed lines render pinned at their solution positions");
  const fixedRendered = [...parsonsHtml.matchAll(/<div[^>]*data-parsons-fixed="true"[^>]*>/g)].map(tag => /data-parsons-line-id="([^"]+)"/.exec(tag[0])[1]);
  assert.deepEqual(fixedRendered, plain(q4.fixedLineIds), "Exactly the fixed lines render as non-operable");
  const { parsonsMovableSegments } = load(file("assessment/parsonsOrderFeedback.ts"));
  for (const segment of parsonsMovableSegments(q4.correctAnswer.lineIds, q4.fixedLineIds)) {
    assert.deepEqual([...q4.lineIds.filter(id => segment.includes(id))].sort(), [...segment].sort(), "Solution is reachable by reordering within each segment");
  }
  const parsonsBoardSource = fs.readFileSync(file("components/assessment/ParsonsBoard.tsx"), "utf8");
  assert.match(parsonsBoardSource, /data-parsons-fixed="true"/, "board renders fixed rows with the non-operable marker");
}
const parsonsText = parsonsHtml.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
for (const line of code.lines) assert(parsonsText.includes(line.text), "Preserve original indentation and every line");

// 実描画: Q1は候補マスごとに回答ボタン1つ、選択問題の場面は表示のみ。正解後は全ボタンが固定される。
const { WallExtensionCheckCanvas } = load(file("wall-extension/check/WallExtensionCheckCanvas.tsx"));
const ariaLabel = key => { const [x, y] = key.split(",").map(Number); return `${x + 1}列目、${y + 1}行目のマスを選ぶ`; };
const sceneBeforeRender = JSON.stringify(q1.scene);
const q1Html = renderToStaticMarkup(React.createElement(WallExtensionCheckCanvas, { canvas: q1.scene, questionId: q1.id, cellIds: q1.nodeIds, onAnswer() {} }));
assert.equal((q1Html.match(/<button\b/g) || []).length, q1.nodeIds.length, "One answer button per candidate cell");
assert.equal((q1Html.match(/data-maze-wall="true"/g) || []).length, q1.scene.state.walls.length, "Rendered walls match the scene board");
assert.match(q1Html, /7×7の迷路の盤面/, "Canvas label follows the board size");
for (const id of q1.nodeIds) assert.equal(q1Html.split(`aria-label="${ariaLabel(id)}"`).length - 1, 1, `One labelled button for ${id}`);
assert.equal(JSON.stringify(q1.scene), sceneBeforeRender, "Rendering must not mutate the scene");
const lockedHtml = renderToStaticMarkup(React.createElement(WallExtensionCheckCanvas, { canvas: q1.scene, questionId: q1.id, cellIds: q1.nodeIds, disabled: true, onAnswer() {} }));
assert.equal((lockedHtml.match(/ disabled=""/g) || []).length, q1.nodeIds.length, "Correct responses lock every answer control");
for (const question of [q2, q3]) {
  const html = renderToStaticMarkup(React.createElement(WallExtensionCheckCanvas, { canvas: question.scene, onAnswer() {} }));
  assert.equal((html.match(/<button\b/g) || []).length, 0, "Choice scenes are display-only");
  assert.equal((html.match(/data-maze-wall="true"/g) || []).length, question.scene.state.walls.length);
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
// 外周ブロック内の並べ替えだけを許し、他の隣接交換はすべて不正解にする。
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
const swap = (ids, first, second) => {
  const result = [...ids], a = result.indexOf(first), b = result.indexOf(second);
  [result[a], result[b]] = [result[b], result[a]];
  return result;
};
const borderPositions = ["border-top", "border-bottom", "border-left", "border-right"].map(id => canonicalIds.indexOf(id));
const borderReordered = [...canonicalIds];
["border-right", "border-left", "border-bottom", "border-top"].forEach((id, k) => { borderReordered[borderPositions[k]] = id; });
assert.equal(answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: borderReordered }).records[3].firstCorrect,
  true, "Independent border writes may be reordered among themselves");
assert.deepEqual(plain(answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: borderReordered }).records[3].attempts[0].answer.lineIds),
  borderReordered, "Keep the actual submitted order in the attempt");
for (const [first, second] of [["lookup-delta", "write-wall"], ["allowed-four", "else-branch"], ["initialize-grid", "for-border"], ["define-function", "initialize-grid"]]) {
  assert.equal(answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: swap(canonicalIds, first, second) }).records[3].firstCorrect,
    false, `Only the border block may be reordered: ${first}/${second}`);
}
assert.equal(answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: swap(canonicalIds, "border-left", "initialize-pillars") }).records[3].firstCorrect,
  false, "Moving a line into the border block is not allowed");

// 検証の負系: 壊れたコンテンツは読み込み時の検証で落とす。
assert.doesNotThrow(() => validateWallExtensionConsolidation({ ...content, questions: plain(content.questions) }), "A structural clone still validates");
function rejects(change) { const broken = { ...content, questions: plain(content.questions) }; change(broken); assert.throws(() => validateWallExtensionConsolidation(broken)); }
rejects(broken => broken.questions[3].lineIds.pop());
rejects(broken => broken.questions[3].lineIds[1] = broken.questions[3].lineIds[0]);
rejects(broken => broken.questions[3].correctAnswer.lineIds.reverse());
rejects(broken => broken.questions[1].choices[1].text = broken.questions[1].choices[0].text);
rejects(broken => broken.questions[0].correctAnswer.nodeId = "1,4");
rejects(broken => broken.questions[0].scene.state.processing = "2,2");
rejects(broken => broken.questions[0].reviewStepIds = ["missing"]);
rejects(broken => broken.questions[2].tags = []);
rejects(broken => broken.questions[3].interchangeableLineGroups = [["border-top", "missing"]]);
rejects(broken => broken.questions[3].interchangeableLineGroups = [["border-top", "initialize-pillars"]]);

// プレビューの契約: 主ボタンで進み、正解後は入力を固定し、復習はフェーズ4の内容で開く。
const previewSource = fs.readFileSync(file("wall-extension/consolidation/WallExtensionConsolidationPreview.tsx"), "utf8");
assert.match(previewSource, /height: "min\(54dvh, 600px\)", flexShrink: 0/, "figure height is fixed by the question and viewport only (#298)");
assert.match(previewSource, /flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column"/, "question body flows in the middle scroll region (#298)");
assert.doesNotMatch(previewSource, /marginTop: "auto",/, "safe centering via margin auto is retired (#298)");
assert.match(previewSource, /borderTop: `1px solid/, "advance actions live in the fixed bottom zone (#298)");
assert.match(previewSource, /variant="contained" onClick=\{\(\) => setSession\(current => advanceAssessment/);
assert.match(previewSource, /disabled=\{attempt\?\.correct === true\}/, "inputs lock after a correct answer");
assert.match(previewSource, /content=\{wallExtensionCodeMappingContent\}/, "review opens the phase-4 content");
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "wall-extension-consolidation"'), "Standalone preview is registered");
assert.match(previewSource, /orderFeedback=\{\{ solutionLineIds: question\.correctAnswer\.lineIds, interchangeableLineGroups: question\.interchangeableLineGroups, active: \(record\?\.attemptCount \?\? 0\) > 0, submittedLineIds: attempt\?\.answer\.kind === "order" \? attempt\.answer\.lineIds : undefined \}\}/, "parsons order feedback is wired (#327, frozen at answer time #354)");
console.log("Wall-extension consolidation verified: 7x7 transfer tap from the independent trace, perfect-maze properties of the completed 9x9, y == 2 review route, 21-line Parsons with border-block-only reordering, soft-gate completion and first-attempt diagnosis.");
