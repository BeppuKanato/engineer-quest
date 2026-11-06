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
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
  } }, { filename });
  return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const { bfsCodeCheckContent: content, validateBfsCodeCheck, fillCodeBlank } = load(`${root}/bfs/code-check/codeCheck.content.ts`);
const { bfsCode, bfsCodeLineNumber } = load(`${root}/bfs/code-mapping/bfsCode.ts`);
const { bfsCodeMappingContent: mapping } = load(`${root}/bfs/code-mapping/codeMapping.content.ts`);
const { createAssessmentState, activeQuestion, answerQuestion, advanceAssessment, assessmentComplete, validateAssessment } = load(`${root}/assessment/assessment.ts`);
const { bfsCheckContent: nodeContent } = load(`${root}/bfs/check/check.content.ts`);
const { selectReviewContent } = load(`${root}/review/reviewContent.ts`);
const { BfsCodeDisplay } = load(`${root}/bfs/code-mapping/BfsCodeDisplay.tsx`);
const { renderToStaticMarkup } = require("react-dom/server");
const { createElement } = require("react");
const plain = value => JSON.parse(JSON.stringify(value));
const choice = choiceId => ({ kind: "choice", choiceId });
const [q1, q2] = content.questions;
validateBfsCodeCheck(content);
assert.equal(content.phase, 5);
assert.equal(content.code, bfsCode, "Share the phase-4 code contract, not a copy");
assert.equal(content.code.id, "bfs-distances-deque");
assert.equal(content.code.version, 1);
assert.equal(content.questions.length, 2);
assert.deepEqual(plain(content.questions.map(question => question.lineId)), ["enqueue-neighbor", "if-undiscovered"]);
assert.deepEqual(plain(q1.choices.map(option => option.text)), ["append", "popleft", "remove"]);
assert.deepEqual(plain(q2.choices.map(option => option.text)), ["not in", "in", "=="]);
assert.equal(q1.prompt, `調べた隣の場所をキュー（待ち行列）の末尾に加えるために、${bfsCodeLineNumber(q1.lineId)}行目の空欄に入る正しいコードを選んでください。`);
assert.equal(q2.prompt, `隣の場所の距離がまだ決まっていないことを確かめるために、${bfsCodeLineNumber(q2.lineId)}行目の空欄に入る正しいコードを選んでください。`);
assert.match(content.instruction, /空欄に入るものを選ぶ/u);
assert.equal(content.reviewLabel, "💡 この処理の動きをもう一度見る");
assert.match(content.completion.caption, /次は【応用問題】（別パターンや例外ケースの3〜5問）/u);
assert(!/完璧|マスター/u.test(content.completion.caption));
const programs = [];
for (const question of content.questions) {
  assert.equal(question.requires, null, "Independent questions, no previous-answer requirement");
  assert.equal((question.prompt.match(/[。？]/gu) || []).length, 1);
  assert(!/完璧|マスター/u.test(question.correctFeedback));
  const line = bfsCode.lines.find(line => line.id === question.lineId);
  const correct = question.choices.find(option => option.id === question.correctAnswer.choiceId);
  assert(Buffer.from(fillCodeBlank(question, correct.text)).equals(Buffer.from(line.text)), "Correct option must restore the exact bytes, including indentation");
  assert.equal(new Set(question.choices.map(option => option.id)).size, question.choices.length);
  assert.equal(new Set(question.choices.map(option => option.text)).size, question.choices.length);
  for (const option of question.choices) {
    programs.push(bfsCode.lines.map(row => row.id === question.lineId ? fillCodeBlank(question, option.text) : row.text).join("\n"));
  }
  const review = selectReviewContent(mapping, question.reviewStepIds);
  review.steps.forEach((step, index) => assert.equal(step, mapping.steps.find(frame => frame.id === question.reviewStepIds[index])));
  assert.equal(review.steps.at(-1).canvas.highlights[0].id, question.reviewLineId);
  assert.equal(question.reviewLineId, question.lineId);
  const html = renderToStaticMarkup(createElement(BfsCodeDisplay, { code: bfsCode, blank: { lineId: question.lineId, ...question.blank } }));
  assert.equal((html.match(/aria-label="空欄"/g) || []).length, 1, "Only the target line is blank");
  assert.equal((html.match(/data-code-line-id=/g) || []).length, 11);
  for (const other of bfsCode.lines.filter(row => row.id !== question.lineId)) assert(html.includes(other.text), "All other source lines remain complete");
  assert(!html.includes(line.text), "The hidden answer must not leak into visible code");
}
// 誤答も全文の中で構文として成立することを確認。誤答は実行しない。
const syntax = spawnSync(process.env.PYTHON || "python3", ["-c", "import ast,json,sys\nprograms=json.load(sys.stdin)\nfor code in programs: ast.parse(code)\nprint(len(programs))"], { input: JSON.stringify(programs), encoding: "utf8" });
assert.equal(syntax.status, 0, syntax.stderr);
assert.equal(Number(syntax.stdout), 6, "All six alternatives must be parsed");

let state = createAssessmentState(content);
assert.equal(activeQuestion(content, state), q1);
assert(!assessmentComplete(content, state));
assert.equal(answerQuestion(content, state, q2.id, q2.correctAnswer), state, "No early answer to later question");
for (const answer of [choice("missing"), { kind: "node", nodeId: "A" }, { kind: "none" }]) assert.equal(answerQuestion(content, state, q1.id, answer), state);
for (const option of q1.choices.filter(option => option.id !== q1.correctAnswer.choiceId)) state = answerQuestion(content, state, q1.id, choice(option.id));
assert.equal(activeQuestion(content, state), q1);
assert.equal(state.records[0].attemptCount, 2);
const previous = state;
state = answerQuestion(content, state, q1.id, q1.correctAnswer);
assert.equal(previous.records[0].solved, false, "Records are immutable");
assert.equal(state.records[0].firstCorrect, false);
assert.equal(state.records[0].attemptCount, 3);
assert.equal(activeQuestion(content, state), q1, "A correct answer does not advance on its own");
state = advanceAssessment(content, state, q1.id);
assert.equal(activeQuestion(content, state), q2);
assert(!assessmentComplete(content, state), "One correct answer does not complete phase 5");
assert.equal(answerQuestion(content, state, q1.id, q1.correctAnswer), state, "Stale answers do not spill into question 2");
for (const option of q2.choices.filter(option => option.id !== q2.correctAnswer.choiceId)) state = answerQuestion(content, state, q2.id, choice(option.id));
assert.equal(activeQuestion(content, state), q2);
state = answerQuestion(content, state, q2.id, q2.correctAnswer);
state = advanceAssessment(content, state, q2.id);
assert(assessmentComplete(content, state));
assert.equal(activeQuestion(content, state), null);
assert(state.records.every(record => record.solved && record.firstCorrect === false && record.attemptCount === 3));
assert.equal(state.records[1].attempts.map(attempt => attempt.number).join(), "1,2,3");

// 「次の問題へ」で正解せず進める（ソフトゲート）。全問未正解でも完了し、結果は初回回答のまま。
let skipped = createAssessmentState(content);
assert.equal(advanceAssessment(content, skipped, q1.id), skipped, "Cannot advance before answering");
skipped = answerQuestion(content, skipped, q1.id, choice(q1.choices.find(option => option.id !== q1.correctAnswer.choiceId).id));
skipped = advanceAssessment(content, skipped, q1.id);
assert.equal(activeQuestion(content, skipped), q2, "Skipping question 1 reaches question 2");
skipped = answerQuestion(content, skipped, q2.id, choice(q2.choices.find(option => option.id !== q2.correctAnswer.choiceId).id));
skipped = advanceAssessment(content, skipped, q2.id);
assert(assessmentComplete(content, skipped), "An all-wrong run still completes");
assert(skipped.records.every(record => record.firstCorrect === false && !record.solved && record.attemptCount === 1));

const codeCheckPreviewSource = fs.readFileSync(`${root}/bfs/code-check/BfsCodeCheckPreview.tsx`, "utf8");
assert.match(codeCheckPreviewSource, /advanceAssessment\(content, current, question\.id\)/);
assert.match(codeCheckPreviewSource, /"結果を見る" : "次の問題へ"/);
assert.equal(answerQuestion(content, state, q2.id, q2.correctAnswer), state);
let firstTry = createAssessmentState(content);
for (const question of content.questions) { firstTry = answerQuestion(content, firstTry, question.id, question.correctAnswer); firstTry = advanceAssessment(content, firstTry, question.id); }
assert(assessmentComplete(content, firstTry));
assert(firstTry.records.every(record => record.firstCorrect && record.attemptCount === 1));
// 問2の正解判定は問1の値に依存せず、共通基盤上で単独でも成立する。
const independent = { ...content, id: "standalone-question-2", questions: [q2] };
const independentDone = answerQuestion(independent, createAssessmentState(independent), q2.id, q2.correctAnswer);
assert(assessmentComplete(independent, advanceAssessment(independent, independentDone, q2.id)));
const nodeSession = createAssessmentState(nodeContent);
assert.equal(answerQuestion(nodeContent, nodeSession, nodeContent.questions[0].id, choice("append")), nodeSession, "Choice answers cannot affect node questions");
assert.throws(() => activeQuestion(content, nodeSession), /mismatch/);

function rejects(change) {
  const broken = { ...content, questions: content.questions.map(question => ({ ...question, blank: { ...question.blank }, choices: question.choices.map(option => ({ ...option })) })) };
  change(broken);
  assert.throws(() => validateBfsCodeCheck(broken));
}
rejects(broken => broken.questions[0].choices[1].text = "append");
rejects(broken => broken.questions[0].choices[1].id = "append");
rejects(broken => broken.questions[0].correctAnswer = choice("remove"));
rejects(broken => broken.questions[0].blank.start++);
rejects(broken => broken.questions[0].blank.length = 0);
rejects(broken => broken.questions[0].blank.start = 1000);
rejects(broken => broken.questions[0].lineId = "missing");
rejects(broken => broken.questions[0].reviewLineId = "if-undiscovered");
rejects(broken => broken.questions[0].reviewStepIds = ["missing"]);
rejects(broken => broken.questions[0].reviewStepIds = ["if-a-b"]);
assert.throws(() => validateAssessment({ ...content, kind: "node-tap-check" }));
console.log("BFS code check: two independent questions, byte-exact restoration, six Python syntax checks, shared display/review identity, common retries/records and invalid-data rejection passed.");
