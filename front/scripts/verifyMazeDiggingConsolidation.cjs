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
const { mazeDiggingConsolidationContent: content, validateMazeDiggingConsolidation } = load(file("maze-digging/consolidation/consolidation.content.ts"));
const maze = load(file("maze-digging/mazeDiggingMaze.ts"));
const { mazeDiggingExecutionContent: execution } = load(file("maze-digging/execution/execution.content.ts"));
const { mazeDiggingCodeMappingContent: mapping } = load(file("maze-digging/code-mapping/codeMapping.content.ts"));
const { mazeDiggingCode: code } = load(file("maze-digging/code-mapping/mazeDiggingCode.ts"));
const { getLearningStep, selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateMazeDiggingCanvas } = load(file("maze-digging/mazeDiggingCanvas.ts"));
const { createAssessmentState, activeQuestion, answerQuestion, advanceAssessment, assessmentComplete, diagnoseAssessment, sameAnswer } = load(file("assessment/assessment.ts"));
const [q1, q2, q3, q4] = content.questions;

// 基準データ §3 フェーズ6の構成（転移タップ・性質の選択・理由の選択・Parsons の4問）。
validateMazeDiggingConsolidation(content);
assert.equal(content.id, "maze-digging-consolidation"); assert.equal(content.phase, 6); assert.equal(content.stageName, "応用問題");
assert.equal(content.questions.length, 4);
assert.equal(content.code, code); assert.equal(code.id, "maze-digging-v1"); assert.equal(code.version, 1);
const stageBracket = name => `${String.fromCharCode(0x3010)}${name}${String.fromCharCode(0x3011)}`;
assert.equal(content.completion, `理解の状況が確認できました。それでは${stageBracket("自分で実装")}に進み、自分の手でコードを完成させましょう！`);
assert.deepEqual(plain(content.questions.map(q => [q.id, q.kind, q.tags[0]])), [
  ["transfer-dig-target", "node", "掘り進める先の追跡"],
  ["completed-maze-properties", "choice", "完成した迷路の性質"],
  ["backtrack-reason", "choice", "バックトラックが必要な理由"],
  ["whole-code-order", "parsons", "コード全体の流れ"],
]);

// 契約 maze-digging-v1 を独立に再実装し、教材データを使わずに突き合わせる（基準データ §1・§2）。
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
      digs.push({ from: `${top[0]},${top[1]}`, room: `${nx},${ny}`, between: `${(top[0] + nx) / 2},${(top[1] + ny) / 2}`, walls: wallsOf() });
    } else {
      pops.push(`${top[0]},${top[1]}`);
      stack.pop();
    }
  }
  assert.equal(step, choices.length, "Reference consumes every choice");
  return { grid, digs, pops };
}

// Q1: 7×7 の検証済みトレース（choices [0,0,0,1,0,1,0,0]）と、場面・候補・正解の一致。
const small = referenceRun(7, [0, 0, 0, 1, 0, 1, 0, 0]);
assert.equal(small.digs.length, 8);
assert.deepEqual([small.digs[4].from, small.digs[4].room], ["3,3", "3,5"], "5th dig reaches the scene room");
assert.deepEqual([small.digs[5].from, small.digs[5].room, small.digs[5].between], ["3,5", "1,5", "2,5"], "6th dig goes left");
assert.equal(q1.prompt, "(5, 3) から左へ掘ります。掘られる部屋はどれですか");
assert.equal(q1.scene.data.size, 7);
assert.equal(q1.scene.state.processing, "3,5");
assert.equal(q1.correctAnswer.nodeId, "1,5");
assert.equal(q1.allowNone, false);
assert.equal(small.digs[4].walls.size, 38, "49 cells - start - 5 digs x 2");
assert.deepEqual(new Set(q1.scene.state.walls), small.digs[4].walls, "Scene walls match the reference after 5 digs");
assert.deepEqual(new Set(q1.scene.state.walls), new Set(plain(maze.runMazeDigging(7, maze.mazeDiggingSmallChoices).digs[4].wallsAfter)), "Scene matches the shared builder");
// 回答対象はアルゴリズムが集める候補そのもの（2マス先が盤内でまだ壁の部屋、提示順）。
const expectedCandidates = [];
for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
  const key = `${3 + 2 * dx},${5 + 2 * dy}`;
  const [nx, ny] = key.split(",").map(Number);
  if (nx >= 1 && nx < 6 && ny >= 1 && ny < 6 && small.digs[4].walls.has(key)) expectedCandidates.push(key);
}
assert.deepEqual(expectedCandidates, ["5,5", "1,5"]);
assert.deepEqual(plain(q1.nodeIds), expectedCandidates);
assert(!q1.nodeIds.includes("3,3"), "Already-dug room above is not a candidate");
validateMazeDiggingCanvas(q1.scene);

// Q2: 場面はフェーズ2の完成盤面そのもの。独立実行した 9×9 が完全迷路であることから、
// 正解（全部屋がつながり輪がない）を裏づけ、誤答（孤立・輪・掘削回数=部屋数）を反証する。
assert.equal(q2.scene, getLearningStep(execution, "complete").canvas, "Q2 scene is the phase-2 completed board by reference");
const main = referenceRun(9, [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0]);
const completedWalls = new Set(q2.scene.state.walls);
assert.equal(completedWalls.size, 50);
for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
  assert.equal(completedWalls.has(`${x},${y}`), main.grid[y][x] === 1, `Cell ${x},${y} matches the independent maze`);
}
const openCells = [];
for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if (main.grid[y][x] === 0) openCells.push(`${x},${y}`);
assert.equal(openCells.length, 31);
const seen = new Set([openCells[0]]);
const queue = [openCells[0]];
while (queue.length) {
  const [x, y] = queue.shift().split(",").map(Number);
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const key = `${x + dx},${y + dy}`;
    if (openCells.includes(key) && !seen.has(key)) { seen.add(key); queue.push(key); }
  }
}
assert.equal(seen.size, openCells.length, "Every room is reachable: no isolated rooms");
let adjacency = 0;
for (const key of openCells) {
  const [x, y] = key.split(",").map(Number);
  if (openCells.includes(`${x + 1},${y}`)) adjacency++;
  if (openCells.includes(`${x},${y + 1}`)) adjacency++;
}
assert.equal(adjacency, openCells.length - 1, "Open cells form a tree: no loops");
const roomCount = 16;
assert.equal(main.digs.length, roomCount - 1, "Digs are rooms - 1, never equal to the room count");
assert.equal(q2.choices.length, 4);
assert.equal(q2.correctAnswer.choiceId, "connected-no-loops");
assert.equal(q2.choices.find(choice => choice.id === "connected-no-loops").text, "すべての部屋が通路でつながっていて、輪（ぐるりと回れる道）がない");
validateMazeDiggingCanvas(q2.scene);

// Q3: 場面はフェーズ2で行き止まり (5,1) を掘った直後の盤面。独立実行では (5,1) が
// 最初に戻される部屋であり、候補が空だからこそ pop が起きる。復習先はフェーズ4の pop 行。
assert.equal(q3.scene, getLearningStep(execution, "dig-6").canvas, "Q3 scene is the phase-2 dead-end board by reference");
assert.equal(q3.scene.state.processing, "5,1");
assert.deepEqual(main.pops.slice(0, 2), ["5,1", "7,1"], "The dead-end room is popped first in the independent run");
assert.equal(q3.choices.length, 3);
assert.equal(q3.correctAnswer.choiceId, "no-diggable-left");
assert.deepEqual(plain(q3.reviewStepIds), ["if-candidates-7", "else-branch-7", "pop-stack-7", "execution-backtrack-1"]);
assert.equal(getLearningStep(mapping, q3.stepId).canvas.highlights[0].id, "pop-stack", "Step points at the stack.pop() line");
assert.match(getLearningStep(mapping, "execution-backtrack-1").caption, /戻ります/, "Phase 4 ties the checkpoint to the phase-2 backtrack");
validateMazeDiggingCanvas(q3.scene);

// 復習はすべてフェーズ4の元フレームを参照のまま使う（新しい盤面の答え合わせは作らない）。
for (const question of content.questions) {
  const review = selectReviewContent(mapping, question.reviewStepIds);
  review.steps.forEach((step, index) => assert.equal(step, mapping.steps.find(frame => frame.id === question.reviewStepIds[index])));
  assert(question.instruction.trim()); assert(question.correctFeedback.trim()); assert(question.incorrectFeedback.trim());
  assert(!/完璧|完全に理解|マスター/u.test(question.correctFeedback), "No overpraise in correct feedback");
}
assert.deepEqual(plain(q1.reviewStepIds), ["choose-candidate-6", "dig-between-6", "dig-room-6", "execution-dig-6"]);
assert.equal(q4.reviewStepIds.length, mapping.steps.length, "Parsons review covers every phase-4 frame");

// Q4: Parsons は参照コード22行すべて（妨害行なし、インデントは原文のまま）。
// 基準データ §3 のとおり順序自由な行は設けないので、隣接交換はすべて不正解になる。
const canonicalIds = plain(code.lines.map(line => line.id));
assert.equal(canonicalIds.length, 22);
assert.deepEqual([...q4.lineIds].sort(), [...canonicalIds].sort());
assert.notDeepEqual(plain(q4.lineIds), canonicalIds, "Presentation order is shuffled");
assert.deepEqual(plain(q4.correctAnswer.lineIds), canonicalIds);
assert.equal(q4.interchangeableLineGroups, undefined, "No interchangeable lines");
const { ParsonsBoard } = load(file("bfs/consolidation/ParsonsBoard.tsx"));
const parsonsHtml = renderToStaticMarkup(React.createElement(ParsonsBoard, { question: q4, code, onAnswer: () => {} }));
// フェード型: 固定行は正解位置に固定表示され、可動行は初期並びの相対順序のまま残りの位置を埋める。
assert.deepEqual(plain(q4.fixedLineIds), ["define-function", "initialize-grid", "define-directions", "dig-start", "initialize-stack", "initialize-step", "while-stack", "return-grid"], "Faded split as designed");
{
  const fixedSet = new Set(q4.fixedLineIds);
  const movableInitial = q4.lineIds.filter(id => !fixedSet.has(id));
  let cursor = 0;
  const expectedOrder = q4.correctAnswer.lineIds.map(id => fixedSet.has(id) ? id : movableInitial[cursor++]);
  assert.deepEqual([...parsonsHtml.matchAll(/data-parsons-line-id="([^"]+)"/g)].map(match => match[1]), [...expectedOrder], "Fixed lines render pinned at their solution positions");
  const fixedRendered = [...parsonsHtml.matchAll(/<div[^>]*data-parsons-fixed="true"[^>]*>/g)].map(tag => /data-parsons-line-id="([^"]+)"/.exec(tag[0])[1]);
  assert.deepEqual(fixedRendered, plain(q4.fixedLineIds), "Exactly the fixed lines render as non-operable");
  const { parsonsMovableSegments } = load(file("bfs/consolidation/parsonsOrderFeedback.ts"));
  for (const segment of parsonsMovableSegments(q4.correctAnswer.lineIds, q4.fixedLineIds)) {
    assert.deepEqual([...q4.lineIds.filter(id => segment.includes(id))].sort(), [...segment].sort(), "Solution is reachable by reordering within each segment");
  }
  const parsonsBoardSourceFaded = fs.readFileSync(file("bfs/consolidation/ParsonsBoard.tsx"), "utf8");
  assert.match(parsonsBoardSourceFaded, /data-parsons-fixed="true"/, "board renders fixed rows with the non-operable marker");
}
const parsonsText = parsonsHtml.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
for (const line of code.lines) assert(parsonsText.includes(line.text), "Preserve original indentation and every line");

// 実描画: Q1は候補マスごとに回答ボタン1つ、選択問題の場面は表示のみ。正解後は全ボタンが固定される。
const { MazeDiggingCheckCanvas } = load(file("maze-digging/check/MazeDiggingCheckCanvas.tsx"));
const ariaLabel = key => { const [x, y] = key.split(",").map(Number); return `${x + 1}列目、${y + 1}行目のマスを選ぶ`; };
const sceneBeforeRender = JSON.stringify(q1.scene);
const q1Html = renderToStaticMarkup(React.createElement(MazeDiggingCheckCanvas, { canvas: q1.scene, questionId: q1.id, cellIds: q1.nodeIds, onAnswer() {} }));
assert.equal((q1Html.match(/<button\b/g) || []).length, q1.nodeIds.length, "One answer button per candidate cell");
assert.equal((q1Html.match(/data-maze-wall="true"/g) || []).length, q1.scene.state.walls.length, "Rendered walls match the scene board");
assert.match(q1Html, /7×7の迷路の盤面/, "Canvas label follows the board size");
for (const id of q1.nodeIds) assert.equal(q1Html.split(`aria-label="${ariaLabel(id)}"`).length - 1, 1, `One labelled button for ${id}`);
assert.equal(JSON.stringify(q1.scene), sceneBeforeRender, "Rendering must not mutate the scene");
const lockedHtml = renderToStaticMarkup(React.createElement(MazeDiggingCheckCanvas, { canvas: q1.scene, questionId: q1.id, cellIds: q1.nodeIds, disabled: true, onAnswer() {} }));
assert.equal((lockedHtml.match(/ disabled=""/g) || []).length, q1.nodeIds.length, "Correct responses lock every answer control");
for (const question of [q2, q3]) {
  const html = renderToStaticMarkup(React.createElement(MazeDiggingCheckCanvas, { canvas: question.scene, onAnswer() {} }));
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
// 順序自由な行がないため、正解順の隣接交換はすべて不正解にする。
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
for (let index = 0; index + 1 < canonicalIds.length; index++) {
  const swapped = [...canonicalIds];
  [swapped[index], swapped[index + 1]] = [swapped[index + 1], swapped[index]];
  assert.equal(answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: swapped }).records[3].firstCorrect,
    false, `Every adjacent order matters: ${canonicalIds[index]}/${canonicalIds[index + 1]}`);
}

// 検証の負系: 壊れたコンテンツは読み込み時の検証で落とす。
assert.doesNotThrow(() => validateMazeDiggingConsolidation({ ...content, questions: plain(content.questions) }), "A structural clone still validates");
function rejects(change) { const broken = { ...content, questions: plain(content.questions) }; change(broken); assert.throws(() => validateMazeDiggingConsolidation(broken)); }
rejects(broken => broken.questions[3].lineIds.pop());
rejects(broken => broken.questions[3].lineIds[1] = broken.questions[3].lineIds[0]);
rejects(broken => broken.questions[3].correctAnswer.lineIds.reverse());
rejects(broken => broken.questions[1].choices[1].text = broken.questions[1].choices[0].text);
rejects(broken => broken.questions[0].correctAnswer.nodeId = "5,5");
rejects(broken => broken.questions[0].scene.state.processing = "1,1");
rejects(broken => broken.questions[0].reviewStepIds = ["missing"]);
rejects(broken => broken.questions[2].tags = []);
rejects(broken => broken.questions[3].interchangeableLineGroups = [["dig-between", "dig-room"]]);

// プレビューの契約: 主ボタンで進み、正解後は入力を固定し、復習はフェーズ4の内容で開く。
const previewSource = fs.readFileSync(file("maze-digging/consolidation/MazeDiggingConsolidationPreview.tsx"), "utf8");
assert.match(previewSource, /height: "min\(54dvh, 600px\)", flexShrink: 0/, "figure height is fixed by the question and viewport only (#298)");
assert.match(previewSource, /flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column"/, "question body flows in the middle scroll region (#298)");
assert.doesNotMatch(previewSource, /marginTop: "auto",/, "safe centering via margin auto is retired (#298)");
assert.match(previewSource, /borderTop: `1px solid/, "advance actions live in the fixed bottom zone (#298)");
assert.match(previewSource, /variant="contained" onClick=\{\(\) => setSession\(current => advanceAssessment/);
assert.match(previewSource, /disabled=\{attempt\?\.correct === true\}/, "inputs lock after a correct answer");
assert.match(previewSource, /content=\{mazeDiggingCodeMappingContent\}/, "review opens the phase-4 content");
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "maze-digging-consolidation"'), "Standalone preview is registered");
// 3段組は維持し、Parsons は盤面と中央のどちらか一方だけをスクロールさせる（#352）。
assert(!previewSource.includes('flexDirection: "column", justifyContent: "center"'), "consolidation does not center with justifyContent (overflow would spill upward)");
assert.match(previewSource, /minHeight: "3em"/, "prompt keeps its reserved height so the figure position is stable");
const parsonsBoardSource = fs.readFileSync(file("bfs/consolidation/ParsonsBoard.tsx"), "utf8");
assert.match(previewSource, /question\?\.kind === "parsons" \? parsonsQuestionBodySx/, "parsons uses the shared scroll layout");
assert.match(parsonsBoardSource, /height: 368/, "parsons scroll viewport has a fixed height (#298)");
assert.match(parsonsBoardSource, /minHeight: 276/, "parsons scroll viewport keeps a usable minimum height");
assert.match(parsonsBoardSource, /\[compactViewport\]: \{ height: "auto", maxHeight: "none", flexShrink: 0, overflowY: "hidden" \}/, "the board flows in the shared scroll region on compact screens");
assert.match(parsonsBoardSource, /parsonsDragCursor/, "parsons drag cursor is the shared dark SVG cursor");
assert.match(previewSource, /orderFeedback=\{\{ solutionLineIds: question\.correctAnswer\.lineIds, interchangeableLineGroups: question\.interchangeableLineGroups, active: \(record\?\.attemptCount \?\? 0\) > 0, submittedLineIds: attempt\?\.answer\.kind === "order" \? attempt\.answer\.lineIds : undefined \}\}/, "parsons order feedback is wired (#327, frozen at answer time #354)");
console.log("Maze-digging consolidation verified: 7x7 transfer tap from the independent trace, perfect-maze properties of the completed 9x9, backtrack reason with the phase-4 pop route, 22-line Parsons with no interchangeable lines, soft-gate completion and first-attempt diagnosis.");
