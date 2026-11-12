const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { spawnSync } = require("node:child_process");
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { exports, require: name => {
    if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
    const base = name.startsWith("@/") ? path.resolve(__dirname, "../src", name.slice(2)) : path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const file = relative => `${root}/${relative}`;
const { greedyCoinsConsolidationContent: content, validateGreedyCoinsConsolidation } = load(file("greedy-coins/consolidation/consolidation.content.ts"));
const { greedyCoinsCode, greedyCoinsCodeSource } = load(file("greedy-coins/code-mapping/greedyCoinsCode.ts"));
const { greedyCoinsCodeMappingContent: mapping } = load(file("greedy-coins/code-mapping/codeMapping.content.ts"));
const greedy = load(file("greedy-coins/greedyCoins.ts"));
const { createAssessmentState, activeQuestion, answerQuestion, advanceAssessment, assessmentComplete, diagnoseAssessment, sameAnswer } = load(file("assessment/assessment.ts"));
const { selectReviewContent } = load(file("review/reviewContent.ts"));
const { validateGreedyCoinsExecutionCanvas } = load(file("greedy-coins/execution/execution.types.ts"));
const { ParsonsBoard } = load(file("components/assessment/ParsonsBoard.tsx"));
const { GreedyCoinsCheckCanvas } = load(file("greedy-coins/check/GreedyCoinsCheckCanvas.tsx"));
const { renderToStaticMarkup } = require("react-dom/server");
const { createElement } = require("react");
const plain = value => JSON.parse(JSON.stringify(value));
const [q1, q2, q3, q4] = content.questions;

// 基準データ §3 フェーズ6の構成（転移タップ・反例トレース・反例の理解・Parsons の4問）。
validateGreedyCoinsConsolidation(content);
assert.equal(content.id, "greedy-coins-consolidation");
assert.equal(content.phase, 6);
assert.equal(content.stageName, "応用問題");
assert.equal(content.questions.length, 4);
assert.equal(content.code, greedyCoinsCode);
assert.equal(greedyCoinsCode.id, "greedy-coins-v1");
assert.equal(greedyCoinsCode.version, 1);
const stageBracket = name => `${String.fromCharCode(0x3010)}${name}${String.fromCharCode(0x3011)}`;
assert.equal(content.completion, `理解の状況が確認できました。それでは${stageBracket("自分で実装")}に進み、自分の手でコードを完成させましょう！`);
assert.deepEqual(plain(content.questions.map(q => [q.id, "kind" in q ? q.kind : "node", q.tags[0]])), [
  ["next-coin-transfer", "node", "新しい金額での次に選ぶ硬貨"],
  ["counterexample-greedy-result", "choice", "別の額面での貪欲な払い方"],
  ["counterexample-why-greedy-loses", "choice", "貪欲が最適にならない理由"],
  ["whole-code-order", "parsons", "コード全体の流れ"],
]);

// 教材モジュールを使わず、基準データ §2 の参照コードの手順を独立に再実装し、DP で最適も求める。
function greedyTrace(amount, coins) {
  const result = [];
  let remaining = amount;
  for (const coin of coins) {
    while (remaining >= coin) { result.push(coin); remaining -= coin; }
  }
  return result;
}
function optimal(amount, coins) {
  // 枚数最小の組み合わせを全探索で求める（小さい金額専用）。
  let best = null;
  const search = (index, left, chosen) => {
    if (left === 0) { if (!best || chosen.length < best.length) best = [...chosen]; return; }
    if (index >= coins.length || (best && chosen.length >= best.length)) return;
    for (let count = 0; count * coins[index] <= left; count++) {
      search(index + 1, left - count * coins[index], [...chosen, ...Array(count).fill(coins[index])]);
    }
  };
  search(0, amount, []);
  return best;
}
const MAIN_COINS = [500, 100, 50, 10, 5, 1];
assert.deepEqual(greedyTrace(342, MAIN_COINS), [100, 100, 100, 10, 10, 10, 10, 1, 1], "Independent transfer trace");
assert.deepEqual(plain(greedy.runGreedyCoins(342, MAIN_COINS)), greedyTrace(342, MAIN_COINS), "Shared runner matches the independent trace");
assert.deepEqual(greedyTrace(6, [4, 3, 1]), [4, 1, 1], "Independent counterexample greedy result");
assert.deepEqual(optimal(6, [4, 3, 1]), [3, 3], "Independent counterexample optimum is [3, 3] in 2 coins");
assert.equal(optimal(6, [4, 3, 1]).length, 2);
for (let amount = 1; amount < 6; amount++) {
  assert.equal(greedyTrace(amount, [4, 3, 1]).length, optimal(amount, [4, 3, 1]).length, `Below 6 the greedy count matches the optimum (${amount})`);
}
// 参照コード原文（Python）でも同じ結果になること。
const run = spawnSync(process.env.PYTHON || "python3", ["-c", [
  "import json,sys",
  "source=json.load(sys.stdin)",
  "ns={}",
  "exec(source, ns)",
  "f=ns['greedy_coins']",
  "assert f(342, [500,100,50,10,5,1]) == [100,100,100,10,10,10,10,1,1]",
  "assert f(6, [4,3,1]) == [4,1,1]",
  "print('cases-ok')",
].join("\n")], { input: JSON.stringify(greedyCoinsCodeSource), encoding: "utf8" });
assert.equal(run.status, 0, run.stderr);
assert.equal(run.stdout.trim(), "cases-ok");

// Q1: 転移の場面・候補・正解。
assert.deepEqual(plain(q1.scene.state.coins), MAIN_COINS);
assert.deepEqual(plain(q1.scene.state.coinStatuses), ["passed", "current", "upcoming", "upcoming", "upcoming", "upcoming"]);
assert.equal(q1.scene.state.amount, 342);
assert.equal(q1.scene.state.remaining, 42);
assert.deepEqual(plain(q1.scene.state.tray), [100, 100, 100]);
assert.equal(q1.scene.state.selectedCoin, 100);
validateGreedyCoinsExecutionCanvas(q1.scene);
assert.deepEqual(plain(q1.nodeIds), MAIN_COINS.map(String));
assert.equal(q1.correctAnswer.nodeId, "10");
assert.equal(q1.allowNone, false);

// Q2: 反例トレースの選択。場面は開始状態、正解は貪欲の [4, 1, 1]。
assert.equal(q2.choices.length, 4);
assert.equal(q2.correctAnswer.choiceId, "greedy-4-1-1");
assert.equal(q2.choices.find(choice => choice.id === "greedy-4-1-1").text, "[4, 1, 1] の3枚になる");
assert.deepEqual(plain(q2.scene.state.coins), [4, 3, 1]);
assert.equal(q2.scene.state.amount, 6);
assert.equal(q2.scene.state.remaining, 6);
assert.deepEqual(plain(q2.scene.state.tray), []);
validateGreedyCoinsExecutionCanvas(q2.scene);

// Q3: 反例の理解。場面は貪欲で払い終えた状態、正解は最適 [3, 3] と敗因。
assert.equal(q3.choices.length, 4);
assert.equal(q3.correctAnswer.choiceId, "optimal-and-reason");
assert.equal(q3.choices.find(choice => choice.id === "optimal-and-reason").text,
  "一番少ないのは [3, 3] の2枚。最初に一番大きい4を選ぶと、残り2を1の硬貨で埋めるしかなくなるから");
assert.deepEqual(plain(q3.scene.state.tray), [4, 1, 1]);
assert.equal(q3.scene.state.remaining, 0);
validateGreedyCoinsExecutionCanvas(q3.scene);

// 復習はすべてフェーズ4の元フレームを参照のまま使う。
for (const question of content.questions) {
  const review = selectReviewContent(mapping, question.reviewStepIds);
  review.steps.forEach((step, index) => assert.equal(step, mapping.steps.find(frame => frame.id === question.reviewStepIds[index])));
  assert(question.instruction.trim()); assert(question.correctFeedback.trim()); assert(question.incorrectFeedback.trim());
  assert(!/完璧|完全に理解|マスター/u.test(question.correctFeedback), "No overpraise in correct feedback");
}
assert.equal(q4.reviewStepIds.length, mapping.steps.length, "Parsons review covers every phase-4 frame");
assert.equal(mapping.steps.length, 44, "Phase 4 has 44 frames");

// Q4: フェード型 Parsons。固定2行・可動6行・1セグメント、互換グループは append / subtract。
const canonicalIds = plain(greedyCoinsCode.lines.map(line => line.id));
assert.deepEqual(canonicalIds, [
  "define-function", "init-result", "init-remaining", "for-coin",
  "while-remaining", "append-coin", "subtract-coin", "return-result",
]);
assert.deepEqual([...q4.lineIds].sort(), [...canonicalIds].sort());
assert.notDeepEqual(plain(q4.lineIds), canonicalIds, "Presentation order is shuffled");
assert.deepEqual(plain(q4.correctAnswer.lineIds), canonicalIds, "Answer follows the canonical order");
assert.deepEqual(plain(q4.fixedLineIds), ["define-function", "return-result"], "Faded split as designed");
assert.deepEqual(plain(q4.interchangeableLineGroups), [["append-coin", "subtract-coin"]], "Append and subtract are interchangeable");
{
  const { parsonsMovableSegments } = load(file("assessment/parsonsOrderFeedback.ts"));
  const segments = parsonsMovableSegments(q4.correctAnswer.lineIds, q4.fixedLineIds);
  assert.equal(segments.length, 1, "Movable lines form a single segment between the fixed lines");
  assert.deepEqual(plain(segments[0]), canonicalIds.slice(1, 7));
  for (const segment of segments) {
    assert.deepEqual([...q4.lineIds.filter(id => segment.includes(id))].sort(), [...segment].sort(), "Solution is reachable within the segment");
  }
}
const parsonsHtml = renderToStaticMarkup(createElement(ParsonsBoard, { question: q4, code: greedyCoinsCode, onAnswer: () => {} }));
{
  const fixedSet = new Set(q4.fixedLineIds);
  const movableInitial = q4.lineIds.filter(id => !fixedSet.has(id));
  let cursor = 0;
  const expectedOrder = q4.correctAnswer.lineIds.map(id => fixedSet.has(id) ? id : movableInitial[cursor++]);
  assert.deepEqual([...parsonsHtml.matchAll(/data-parsons-line-id="([^"]+)"/g)].map(match => match[1]), [...expectedOrder],
    "Fixed lines render pinned at their solution positions");
  const fixedRendered = [...parsonsHtml.matchAll(/<div[^>]*data-parsons-fixed="true"[^>]*>/g)].map(tag => /data-parsons-line-id="([^"]+)"/.exec(tag[0])[1]);
  assert.deepEqual(fixedRendered, plain(q4.fixedLineIds), "Exactly the fixed lines render as non-operable");
}
const parsonsText = parsonsHtml.replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
for (const line of greedyCoinsCode.lines) assert(parsonsText.includes(line.text), "Preserve original indentation and every line");

// 実描画: Q1は候補ごとに回答ボタン1つ、選択問題の場面は表示のみ。正解後は全ボタンが固定される。
const q1Html = renderToStaticMarkup(createElement(GreedyCoinsCheckCanvas, { canvas: q1.scene, questionId: q1.id, cellIds: q1.nodeIds, onAnswer() {} }));
assert.equal((q1Html.match(/<button\b/g) || []).length, q1.nodeIds.length, "One answer button per candidate coin");
for (const id of q1.nodeIds) {
  assert.equal(q1Html.split(`aria-label="${id}円の硬貨を選ぶ"`).length - 1, 1, `One labelled button for coin ${id}`);
}
const lockedHtml = renderToStaticMarkup(createElement(GreedyCoinsCheckCanvas, { canvas: q1.scene, questionId: q1.id, cellIds: q1.nodeIds, disabled: true, onAnswer() {} }));
assert.equal((lockedHtml.match(/ disabled=""/g) || []).length, q1.nodeIds.length, "Correct responses lock every answer control");
for (const question of [q2, q3]) {
  const html = renderToStaticMarkup(createElement(GreedyCoinsCheckCanvas, { canvas: question.scene, onAnswer() {} }));
  assert.equal((html.match(/<button\b/g) || []).length, 0, "Choice scenes are display-only");
}

// 共通エンジンの進行: 回答では進まず、ボタンで進む。ソフトゲートで、診断は初回回答だけから導く。
const wrong = question => !("kind" in question) ? { kind: "node", nodeId: question.nodeIds.find(id => id !== question.correctAnswer.nodeId) }
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

// Parsons の回答検証: 互換グループの2行の入れ替えは正解、それ以外の隣接入れ替えは不正解。
let parsonsState = createAssessmentState(content);
for (const question of content.questions.slice(0, 3)) {
  parsonsState = advanceAssessment(content, answerQuestion(content, parsonsState, question.id, question.correctAnswer), question.id);
}
assert.equal(answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: canonicalIds.slice(1) }), parsonsState);
assert.equal(answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: canonicalIds.map(() => canonicalIds[0]) }), parsonsState);
const swappedGroup = [...canonicalIds];
[swappedGroup[5], swappedGroup[6]] = [swappedGroup[6], swappedGroup[5]];
const groupAnswered = answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: swappedGroup });
assert.equal(groupAnswered.records[3].firstCorrect, true, "Swapping append and subtract (interchangeable group) is correct");
assert(sameAnswer(q4.correctAnswer, { kind: "order", lineIds: canonicalIds }));
for (let index = 0; index < canonicalIds.length - 1; index++) {
  if (index === 5) continue; // 互換グループの入れ替えは上の検証で正解とした。
  const swapped = [...canonicalIds];
  [swapped[index], swapped[index + 1]] = [swapped[index + 1], swapped[index]];
  assert.equal(answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: swapped }).records[3].firstCorrect,
    false, `Adjacent swap must be incorrect: ${canonicalIds[index]}/${canonicalIds[index + 1]}`);
}
// グループの行が離れた位置にある並びは互換として扱わない。
const separated = [...canonicalIds];
[separated[0], separated[5]] = [separated[5], separated[0]];
assert.equal(answerQuestion(content, parsonsState, q4.id, { kind: "order", lineIds: separated }).records[3].firstCorrect, false,
  "Interchangeable lines separated by other lines are not normalized");

// 検証の負系: 壊れたコンテンツは読み込み時の検証で落とす。
assert.doesNotThrow(() => validateGreedyCoinsConsolidation({ ...content, questions: plain(content.questions) }), "A structural clone still validates");
function rejects(change) { const broken = { ...content, questions: plain(content.questions) }; change(broken); assert.throws(() => validateGreedyCoinsConsolidation(broken)); }
rejects(broken => broken.questions[3].lineIds.pop());
rejects(broken => broken.questions[3].correctAnswer.lineIds.reverse());
rejects(broken => broken.questions[3].fixedLineIds = ["define-function"]);
rejects(broken => broken.questions[3].interchangeableLineGroups = []);
rejects(broken => broken.questions[3].interchangeableLineGroups = [["append-coin", "for-coin"]]);
rejects(broken => broken.questions[1].choices[1].text = broken.questions[1].choices[0].text);
rejects(broken => broken.questions[0].correctAnswer.nodeId = "50");
rejects(broken => broken.questions[0].scene.state.remaining = 41);
rejects(broken => broken.questions[2].reviewStepIds = ["missing"]);
rejects(broken => broken.questions[3].tags = []);

// プレビューの契約: 3段組・主ボタンで進み・入力ロック・復習はフェーズ4。
const previewSource = fs.readFileSync(file("greedy-coins/consolidation/GreedyCoinsConsolidationPreview.tsx"), "utf8");
assert.match(previewSource, /height: "min\(54dvh, 600px\)", flexShrink: 0/, "figure height is fixed by the question and viewport only (#298)");
assert.match(fs.readFileSync(file("components/layouts/AssessmentLayout.tsx"), "utf8"), /flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column"/, "question body flows in the middle scroll region (#298)");
assert.match(previewSource, /borderTop: `1px solid/, "advance actions live in the fixed bottom zone (#298)");
assert.match(previewSource, /variant="contained" onClick=\{\(\) => setSession\(current => advanceAssessment/);
assert.match(previewSource, /disabled=\{attempt\?\.correct === true\}/, "inputs lock after a correct answer");
assert.match(previewSource, /content=\{greedyCoinsCodeMappingContent\}/, "review opens the phase-4 content");
assert.match(previewSource, /orderFeedback=\{\{ solutionLineIds: question\.correctAnswer\.lineIds, interchangeableLineGroups: question\.interchangeableLineGroups/, "parsons order feedback is wired with the interchangeable group");
assert(q4.definitions?.includes("amount = 払う金額") && q4.definitions?.includes("remaining = 残額"), "Parsons question defines the variables on screen");
assert.match(previewSource, /question\.definitions/, "preview renders the definitions line");
assert(fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8")
  .includes('contentId === "greedy-coins-consolidation"'), "Standalone preview is registered");
console.log("Greedy-coins consolidation verified: transfer tap from the independent 342 trace (100x3 then 10, remaining 42), counterexample greedy [4,1,1] vs optimal [3,3] refutations, faded 8-line Parsons (fixed def/return, one segment) with the append/subtract interchangeable group accepted only adjacently, soft-gate completion and first-attempt diagnosis.");
