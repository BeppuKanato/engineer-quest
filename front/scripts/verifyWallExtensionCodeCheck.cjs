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
const { wallExtensionCodeCheckContent: content, validateWallExtensionCodeCheck, fillCodeBlank } = load(`${root}/wall-extension/code-check/codeCheck.content.ts`);
const { wallExtensionCode, wallExtensionCodeLineNumber, wallExtensionCodeSource } = load(`${root}/wall-extension/code-mapping/wallExtensionCode.ts`);
const { wallExtensionCodeMappingContent: mapping } = load(`${root}/wall-extension/code-mapping/codeMapping.content.ts`);
const { createAssessmentState, activeQuestion, answerQuestion, advanceAssessment, assessmentComplete, validateAssessment } = load(`${root}/assessment/assessment.ts`);
const { newAnswerFeedback } = load(`${root}/assessment/answerFeedbackState.ts`);
const { wallExtensionCheckContent: nodeContent } = load(`${root}/wall-extension/check/check.content.ts`);
const { selectReviewContent } = load(`${root}/review/reviewContent.ts`);
const { CodeDisplay } = load(`${root}/code/CodeDisplay.tsx`);
const { renderToStaticMarkup } = require("react-dom/server");
const { createElement } = require("react");
const plain = value => JSON.parse(JSON.stringify(value));
// Reactのサーバー描画はテキスト中の & < > " ' をエスケープする。コード行の照合はエスケープ後の形で行う。
const escapeText = text => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const choice = choiceId => ({ kind: "choice", choiceId });
const [q1, q2] = content.questions;

// 基準データ §3 フェーズ5の確定事項（独立2問、対象行と正解）。
validateWallExtensionCodeCheck(content);
assert.equal(content.id, "wall-extension-code-check");
assert.equal(content.phase, 5);
assert.equal(content.stageName, "コードの確認問題");
assert.equal(content.code, wallExtensionCode, "Share the phase-4 code contract, not a copy");
assert.equal(content.code.id, "wall-extension-v1");
assert.equal(content.code.version, 1);
assert.equal(content.questions.length, 2);
assert.deepEqual(plain(content.questions.map(question => question.lineId)), ["for-pillar-column", "define-directions"]);
assert.deepEqual(plain(content.questions.map(question => question.stepId)), ["for-pillar-column-2-2", "define-directions"]);
assert.deepEqual(plain(content.questions.map(question => question.reviewStepIds)), [["for-pillar-row-2", "for-pillar-column-2-2"], ["for-pillar-row-exit", "define-directions"]]);
assert.deepEqual(plain(q1.choices.map(option => option.text)), ["1", "2", "3"]);
assert.deepEqual(plain(q2.choices.map(option => option.text)), ["-1", "0", "1"]);
assert.equal(q1.correctAnswer.choiceId, "step-2");
assert.equal(q2.correctAnswer.choiceId, "minus-one");
assert.equal(q1.prompt, `柱を立てる位置の間隔を決めるために、${wallExtensionCodeLineNumber(q1.lineId)}行目の空欄に入る正しいコードを選んでください。`);
assert.equal(q2.prompt, `方向の対応表で「上」への移動量を決めるために、${wallExtensionCodeLineNumber(q2.lineId)}行目の空欄に入る正しいコードを選んでください。`);
assert.equal(wallExtensionCodeLineNumber(q1.lineId), 10);
assert.equal(wallExtensionCodeLineNumber(q2.lineId), 13);
assert.match(content.instruction, /空欄に入るものを選ぶ/u);
assert.equal(content.reviewLabel, "💡 この処理の動きをもう一度見る");
assert.match(content.completion.caption, /次は【応用問題】/u);
assert(!/完璧|マスター/u.test(content.completion.caption));
// 正誤フィードバックは「なぜその値か」が一文で分かること（基準データ§3の指定）。
assert.match(q1.correctFeedback, /柱は2マスおきに立つため/u);
assert.match(q1.incorrectFeedback, /柱は2マスおきに立つので/u);
assert.match(q2.correctFeedback, /上は行が1つ減る方向なので/u);
assert.match(q2.incorrectFeedback, /上は行が1つ減る方向なので/u);
for (const question of content.questions) {
  // 理由の説明は一文に収める（不正解文の「不正解。」は見出しとして数えない）。
  assert.equal((question.correctFeedback.match(/。/gu) || []).length, 1, "Correct feedback must explain in one sentence");
  assert(question.incorrectFeedback.startsWith("不正解。"));
  assert.equal((question.incorrectFeedback.slice("不正解。".length).match(/。/gu) || []).length, 1, "Incorrect feedback must explain in one sentence");
  assert(!/完璧|マスター/u.test(question.correctFeedback + question.incorrectFeedback));
}
const programs = [];
for (const question of content.questions) {
  assert.equal(question.requires, null, "Independent questions, no previous-answer requirement");
  assert.equal((question.prompt.match(/[。？]/gu) || []).length, 1);
  const line = wallExtensionCode.lines.find(line => line.id === question.lineId);
  const correct = question.choices.find(option => option.id === question.correctAnswer.choiceId);
  // 空欄は数値部分だけ（Q1は最後の「2」、Q2は「-1」）で、前後の文は元の行のまま。
  assert.equal(line.text.slice(question.blank.start, question.blank.start + question.blank.length), correct.text,
    "The blank must cover exactly the answer token");
  assert(Buffer.from(fillCodeBlank(question, correct.text)).equals(Buffer.from(line.text)), "Correct option must restore the exact bytes, including indentation");
  assert.equal(new Set(question.choices.map(option => option.id)).size, question.choices.length);
  assert.equal(new Set(question.choices.map(option => option.text)).size, question.choices.length);
  for (const option of question.choices) {
    programs.push(wallExtensionCode.lines.map(row => row.id === question.lineId ? fillCodeBlank(question, option.text) : row.text).join("\n"));
  }
  const review = selectReviewContent(mapping, question.reviewStepIds);
  review.steps.forEach((step, index) => assert.equal(step, mapping.steps.find(frame => frame.id === question.reviewStepIds[index])));
  assert.equal(review.steps.at(-1).canvas.highlights[0].id, question.reviewLineId);
  assert.equal(question.reviewLineId, question.lineId);
  const html = renderToStaticMarkup(createElement(CodeDisplay, { code: wallExtensionCode, label: "generate_mazeのコード", blank: { lineId: question.lineId, ...question.blank } }));
  assert.equal((html.match(/aria-label="空欄"/g) || []).length, 1, "Only the target line is blank");
  assert.equal((html.match(/data-code-line-id=/g) || []).length, 21);
  for (const other of wallExtensionCode.lines.filter(row => row.id !== question.lineId)) assert(html.includes(escapeText(other.text)), "All other source lines remain complete");
  assert(!html.includes(escapeText(line.text)), "The hidden answer must not leak into visible code");
}
// 正解で埋めた全文は参照コード原文と一致し、全候補が構文として成立する（誤答は実行しない）。
assert(programs.some(program => program === wallExtensionCodeSource), "A correct fill must reproduce the contract source");
const syntax = spawnSync(process.env.PYTHON || "python3", ["-c", "import ast,json,sys\nprograms=json.load(sys.stdin)\nfor code in programs: ast.parse(code)\nprint(len(programs))"], { input: JSON.stringify(programs), encoding: "utf8" });
assert.equal(syntax.status, 0, syntax.stderr);
assert.equal(Number(syntax.stdout), 6, "All six alternatives must be parsed");

let state = createAssessmentState(content);
assert.equal(activeQuestion(content, state), q1);
assert(!assessmentComplete(content, state));
assert.equal(answerQuestion(content, state, q2.id, q2.correctAnswer), state, "No early answer to later question");
for (const answer of [choice("missing"), { kind: "node", nodeId: "2,2" }, { kind: "none" }]) assert.equal(answerQuestion(content, state, q1.id, answer), state);
// 誤答ではフィードバックが設問固有の解説文になり、正解では正解文になる。
for (const option of q1.choices.filter(option => option.id !== q1.correctAnswer.choiceId)) {
  const before = state;
  state = answerQuestion(content, state, q1.id, choice(option.id));
  const feedback = newAnswerFeedback(content, before, state);
  assert.equal(feedback.correct, false);
  assert.equal(feedback.message, q1.incorrectFeedback);
}
assert.equal(activeQuestion(content, state), q1);
assert.equal(state.records[0].attemptCount, 2);
const previous = state;
state = answerQuestion(content, state, q1.id, q1.correctAnswer);
assert.equal(previous.records[0].solved, false, "Records are immutable");
assert.equal(state.records[0].firstCorrect, false);
assert.equal(state.records[0].attemptCount, 3);
assert.equal(newAnswerFeedback(content, previous, state).message, q1.correctFeedback);
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

const codeCheckPreviewSource = fs.readFileSync(`${root}/wall-extension/code-check/WallExtensionCodeCheckPreview.tsx`, "utf8");
assert.match(codeCheckPreviewSource, /advanceAssessment\(wallExtensionCodeCheckContent, current, question\.id\)/);
assert.match(codeCheckPreviewSource, /"結果を見る" : "次の問題へ"/);
// 単品画面の仕組みはフェーズ3単品に揃える（#181）: 再回答時は見出しに「もう一度、」が付き、
// 「もう一度解く」は回答後ボタンと同じ行に出る（別の行に独立させない）。
assert.match(codeCheckPreviewSource, /retry \? "もう一度、" : ""/, "re-answering carries the same caption cue as phase 3");
assert.equal((codeCheckPreviewSource.match(/もう一度解く/g) || []).length, 1, "the restart button appears exactly once, inside the shared action row");
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
assert.equal(answerQuestion(nodeContent, nodeSession, nodeContent.questions[0].id, choice("step-2")), nodeSession, "Choice answers cannot affect node questions");
assert.throws(() => activeQuestion(content, nodeSession), /mismatch/);

function rejects(change) {
  const broken = { ...content, questions: content.questions.map(question => ({ ...question, blank: { ...question.blank }, choices: question.choices.map(option => ({ ...option })) })) };
  change(broken);
  assert.throws(() => validateWallExtensionCodeCheck(broken));
}
rejects(broken => broken.questions[0].choices[1].text = "1");
rejects(broken => broken.questions[0].choices[1].id = "step-1");
rejects(broken => broken.questions[0].correctAnswer = choice("step-1"));
rejects(broken => broken.questions[0].blank.start++);
rejects(broken => broken.questions[0].blank.length = 0);
rejects(broken => broken.questions[0].blank.start = 1000);
rejects(broken => broken.questions[0].lineId = "missing");
rejects(broken => broken.questions[0].reviewLineId = "define-directions");
rejects(broken => broken.questions[0].reviewStepIds = ["missing"]);
rejects(broken => broken.questions[0].reviewStepIds = ["define-directions"]);
assert.throws(() => validateAssessment({ ...content, kind: "node-tap-check" }));
console.log("Wall-extension code check: two independent questions, byte-exact restoration, six Python syntax checks, shared display/review identity, question-specific feedback, common retries/records and invalid-data rejection passed.");
