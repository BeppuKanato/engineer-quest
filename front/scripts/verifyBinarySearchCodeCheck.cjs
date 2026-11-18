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
const { binarySearchCodeCheckContent: content, validateBinarySearchCodeCheck, fillCodeBlank } = load(`${root}/binary-search/code-check/codeCheck.content.ts`);
const { binarySearchCode, binarySearchCodeLineNumber, binarySearchCodeSource } = load(`${root}/binary-search/code-mapping/binarySearchCode.ts`);
const { binarySearchCodeMappingContent: mapping } = load(`${root}/binary-search/code-mapping/codeMapping.content.ts`);
const { createAssessmentState, activeQuestion, answerQuestion, advanceAssessment, assessmentComplete, validateAssessment } = load(`${root}/assessment/assessment.ts`);
const { newAnswerFeedback } = load(`${root}/assessment/answerFeedbackState.ts`);
const { binarySearchCheckContent: nodeContent } = load(`${root}/binary-search/check/check.content.ts`);
const { selectReviewContent } = load(`${root}/review/reviewContent.ts`);
const { CodeDisplay } = load(`${root}/code/CodeDisplay.tsx`);
const { renderToStaticMarkup } = require("react-dom/server");
const { createElement } = require("react");
const plain = value => JSON.parse(JSON.stringify(value));
// Reactのサーバー描画はテキスト中の & < > " ' をエスケープする。コード行の照合はエスケープ後の形で行う。
const escapeText = text => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const choice = choiceId => ({ kind: "choice", choiceId });
const byId = id => content.questions.find(question => question.id === id);
const q1 = content.questions[0];

// 基準データ §2 の原文（フェーズ4の契約がこの原文と一致することの固定）。コードブロックは12行。
const indent = depth => "    ".repeat(depth);
const baselineSource = [
  "def binary_search(values, target):",
  `${indent(1)}lo = 0`,
  `${indent(1)}hi = len(values) - 1`,
  `${indent(1)}while lo <= hi:`,
  `${indent(2)}mid = (lo + hi) // 2`,
  `${indent(2)}if values[mid] == target:`,
  `${indent(3)}return mid`,
  `${indent(2)}elif values[mid] < target:`,
  `${indent(3)}lo = mid + 1`,
  `${indent(2)}else:`,
  `${indent(3)}hi = mid - 1`,
  `${indent(1)}return -1`,
].join("\n");
assert.equal(binarySearchCodeSource, baselineSource, "The phase-4 contract must keep the baseline source byte-exact");
assert.equal(binarySearchCode.lines.length, 12, "The contract is twelve lines");

// 基準データ §3 フェーズ5（8問）。フェーズ6が前提とする対応づけ（転移の追跡・
// 不在の終わり方・Parsons の各行の意味・比べる記号の意味）を判断できる並びで、
// 対象行はコードの流れ順（2026-11-17 の基準で当初の2問から拡充）。
validateBinarySearchCodeCheck(content);
assert.equal(content.id, "binary-search-code-check");
assert.equal(content.phase, 5);
assert.equal(content.stageName, "コードの確認問題");
assert.equal(content.code, binarySearchCode, "Share the phase-4 code contract, not a copy");
assert.equal(content.code.id, "binary-search-v1");
assert.equal(content.code.version, 1);
assert.equal(content.questions.length, 8);
assert.deepEqual(plain(content.questions.map(question => question.id)),
  ["init-hi", "while-range", "mid-formula", "if-hit", "return-mid", "elif-smaller", "skip-mid", "drop-right"]);
assert.deepEqual(plain(content.questions.map(question => question.lineId)),
  ["init-hi", "while-range", "compute-mid", "if-hit", "return-mid", "elif-smaller", "drop-left", "drop-right"]);
assert.deepEqual(plain(content.questions.map(question => binarySearchCodeLineNumber(question.lineId))), [3, 4, 5, 6, 7, 8, 9, 11]);
assert.deepEqual(plain(content.questions.map(question => question.stepId)),
  ["execution-range-full", "while-range-1", "execution-probe-1-mid", "if-hit-1", "execution-found", "elif-smaller-1", "execution-probe-1-drop-left", "execution-probe-2-drop-right"]);
assert.deepEqual(plain(content.questions.map(question => question.reviewStepIds)), [
  ["init-lo", "execution-range-full"],
  ["execution-range-full", "while-range-1"],
  ["execution-range-full", "execution-probe-1-mid"],
  ["execution-probe-1-mid", "if-hit-1"],
  ["if-hit-3", "execution-found"],
  ["execution-probe-1-mid", "elif-smaller-1"],
  ["elif-smaller-1", "execution-probe-1-drop-left"],
  ["else-larger-2", "execution-probe-2-drop-right"],
]);
assert.deepEqual(plain(content.questions.map(question => question.choices.map(option => option.text))), [
  ["len(values) - 1", "len(values)", "0"],
  ["<=", "<", "=="],
  ["lo", "hi", "mid"],
  ["==", "<", ">"],
  ["mid", "values[mid]", "-1"],
  ["<", ">", "=="],
  ["0", "1", "2"],
  ["0", "1", "2"],
]);
assert.deepEqual(plain(content.questions.map(question => question.correctAnswer.choiceId)),
  ["last-index", "le", "hi", "eq", "mid", "lt", "one", "one"]);
for (const question of content.questions) {
  assert(question.prompt.endsWith(`${binarySearchCodeLineNumber(question.lineId)}行目の空欄に入る正しいコードを選んでください。`),
    "Prompt names the target line number derived from the line id");
}
assert.match(content.instruction, /空欄に入るものを選ぶ/u);
assert.equal(content.reviewLabel, "💡 この処理の動きをもう一度見る");
assert.match(content.completion.caption, /次は/u);
assert.match(content.completion.caption, /6問/u, "Completion announces the expanded six-question phase 6");
assert(!/完璧|マスター/u.test(content.completion.caption));
// 正誤フィードバックは「なぜその式か」が一文で分かること（基準データ§3の指定）。
const feedbackPhrases = {
  "init-hi": /len\(values\) - 1/u,
  "while-range": /lo <= hi/u,
  "mid-formula": /両端 lo と hi の中間/u,
  "if-hit": /==/u,
  "return-mid": /位置/u,
  "elif-smaller": /小さい/u,
  "skip-mid": /mid 自身も範囲から外して/u,
  "drop-right": /mid 自身も範囲から外して/u,
};
for (const question of content.questions) {
  assert.match(question.correctFeedback, feedbackPhrases[question.id]);
  assert.match(question.incorrectFeedback, feedbackPhrases[question.id]);
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
  const line = binarySearchCode.lines.find(line => line.id === question.lineId);
  const correct = question.choices.find(option => option.id === question.correctAnswer.choiceId);
  // 空欄は対象の式だけ（右端の式・比較記号・増分など）で、前後の文は元の行のまま。
  assert.equal(line.text.slice(question.blank.start, question.blank.start + question.blank.length), correct.text,
    "The blank must cover exactly the answer token");
  assert(Buffer.from(fillCodeBlank(question, correct.text)).equals(Buffer.from(line.text)), "Correct option must restore the exact bytes, including indentation");
  assert.equal(new Set(question.choices.map(option => option.id)).size, question.choices.length);
  assert.equal(new Set(question.choices.map(option => option.text)).size, question.choices.length);
  for (const option of question.choices) {
    programs.push(binarySearchCode.lines.map(row => row.id === question.lineId ? fillCodeBlank(question, option.text) : row.text).join("\n"));
  }
  const review = selectReviewContent(mapping, question.reviewStepIds);
  review.steps.forEach((step, index) => assert.equal(step, mapping.steps.find(frame => frame.id === question.reviewStepIds[index])));
  assert.equal(review.steps.at(-1).canvas.highlights[0].id, question.reviewLineId);
  assert.equal(question.reviewLineId, question.lineId);
  const html = renderToStaticMarkup(createElement(CodeDisplay, { code: binarySearchCode, label: "binary_searchのコード", blank: { lineId: question.lineId, ...question.blank } }));
  assert.equal((html.match(/aria-label="空欄"/g) || []).length, 1, "Only the target line is blank");
  assert.equal((html.match(/data-code-line-id=/g) || []).length, 12);
  for (const other of binarySearchCode.lines.filter(row => row.id !== question.lineId)) assert(html.includes(escapeText(other.text)), "All other source lines remain complete");
  assert(!html.includes(escapeText(line.text)), "The hidden answer must not leak into visible code");
}
// 正解で埋めた全文は参照コード原文と一致し、全候補が構文として成立する（誤答は実行しない）。
assert(programs.some(program => program === binarySearchCodeSource), "A correct fill must reproduce the contract source");
const syntax = spawnSync(process.env.PYTHON || "python3", ["-c", "import ast,json,sys\nprograms=json.load(sys.stdin)\nfor code in programs: ast.parse(code)\nprint(len(programs))"], { input: JSON.stringify(programs), encoding: "utf8" });
assert.equal(syntax.status, 0, syntax.stderr);
assert.equal(Number(syntax.stdout), 24, "All twenty-four alternatives must be parsed");
// 正解で埋めたプログラムは基準データの3ケース（主教材・転移・不在）を満たす。
const run = spawnSync(process.env.PYTHON || "python3", ["-c", [
  "import json,sys",
  "source=json.load(sys.stdin)",
  "ns={}",
  "exec(source, ns)",
  "f=ns['binary_search']",
  "assert f([3,7,12,19,25,31,42], 25) == 4",
  "assert f([2,5,8,12,16,23,38,56,72,91], 23) == 5",
  "assert f([3,7,12,19,25,31,42], 20) == -1",
  "print('cases-ok')",
].join("\n")], { input: JSON.stringify(binarySearchCodeSource), encoding: "utf8" });
assert.equal(run.status, 0, run.stderr);
assert.equal(run.stdout.trim(), "cases-ok");

// 共通エンジンの進行: 誤答では設問固有の解説文、正解では正解文になり、回答では進まない。
let state = createAssessmentState(content);
assert.equal(activeQuestion(content, state), q1);
assert(!assessmentComplete(content, state));
assert.equal(answerQuestion(content, state, content.questions[1].id, content.questions[1].correctAnswer), state, "No early answer to later question");
for (const answer of [choice("missing"), { kind: "node", nodeId: "2" }, { kind: "none" }]) assert.equal(answerQuestion(content, state, q1.id, answer), state);
for (const q of content.questions) {
  assert.equal(activeQuestion(content, state).id, q.id);
  for (const option of q.choices.filter(option => option.id !== q.correctAnswer.choiceId)) {
    const before = state;
    state = answerQuestion(content, state, q.id, choice(option.id));
    const feedback = newAnswerFeedback(content, before, state);
    assert.equal(feedback.correct, false);
    assert.equal(feedback.message, q.incorrectFeedback);
    assert.equal(activeQuestion(content, state).id, q.id, "A wrong answer does not advance");
  }
  const before = state;
  state = answerQuestion(content, state, q.id, q.correctAnswer);
  assert.equal(before.records.find(record => record.questionId === q.id).solved, false, "Records are immutable");
  assert.equal(state.records.find(record => record.questionId === q.id).firstCorrect, false);
  assert.equal(state.records.find(record => record.questionId === q.id).attemptCount, 3);
  assert.equal(newAnswerFeedback(content, before, state).message, q.correctFeedback);
  assert.equal(activeQuestion(content, state).id, q.id, "A correct answer does not advance on its own");
  state = advanceAssessment(content, state, q.id);
  if (q === q1) assert.equal(answerQuestion(content, state, q1.id, q1.correctAnswer), state, "Stale answers do not spill into the next question");
}
assert(assessmentComplete(content, state));
assert.equal(activeQuestion(content, state), null);
assert(state.records.every(record => record.solved && record.firstCorrect === false && record.attemptCount === 3));
assert.equal(state.records[1].attempts.map(attempt => attempt.number).join(), "1,2,3");

// 「次の問題へ」で正解せず進める（ソフトゲート）。全問未正解でも完了し、結果は初回回答のまま。
let skipped = createAssessmentState(content);
assert.equal(advanceAssessment(content, skipped, q1.id), skipped, "Cannot advance before answering");
for (const q of content.questions) {
  const wrong = q.choices.find(option => option.id !== q.correctAnswer.choiceId);
  skipped = answerQuestion(content, skipped, q.id, choice(wrong.id));
  skipped = advanceAssessment(content, skipped, q.id);
}
assert(assessmentComplete(content, skipped), "An all-wrong run still completes");
assert(skipped.records.every(record => record.firstCorrect === false && !record.solved && record.attemptCount === 1));

const codeCheckPreviewSource = fs.readFileSync(`${root}/binary-search/code-check/BinarySearchCodeCheckPreview.tsx`, "utf8");

// レイアウト契約（#298）: 3段組。コード窓は固定高320px（窓の内側スクロールは維持）、選択肢は下部の固定ゾーン。
assert.match(codeCheckPreviewSource, /height: 320, flexShrink: 0, overflow: "auto"/, "code window has a fixed height (#298)");
assert.doesNotMatch(codeCheckPreviewSource, /flex: 1, minHeight: 0, overflow: "auto"/, "code window no longer takes the leftover height (#298)");
assert.match(codeCheckPreviewSource, /flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column"/, "prompt and code window flow in the middle scroll region (#298)");
assert.match(codeCheckPreviewSource, /borderTop: `1px solid/, "choices live in the fixed bottom zone (#298)");
assert.match(codeCheckPreviewSource, /advanceAssessment\(binarySearchCodeCheckContent, current, question\.id\)/);
assert.match(codeCheckPreviewSource, /"結果を見る" : "次の問題へ"/);
// 単品画面の仕組みはフェーズ3単品に揃える（#181）: 再回答時は見出しに「もう一度、」が付き、
// 「もう一度解く」は回答後ボタンと同じ行に出る（別の行に独立させない）。
assert.match(codeCheckPreviewSource, /retry \? "もう一度、" : ""/, "re-answering carries the same caption cue as phase 3");
assert.equal((codeCheckPreviewSource.match(/もう一度解く/g) || []).length, 1, "the restart button appears exactly once, inside the shared action row");
const previewPageSource = fs.readFileSync(path.resolve(__dirname, "../src/app/learning-preview/[contentId]/page.tsx"), "utf8");
assert.match(previewPageSource, /contentId === "binary-search-code-check"/, "Preview page must register binary-search-code-check");
assert.equal(answerQuestion(content, state, content.questions.at(-1).id, content.questions.at(-1).correctAnswer), state);
let firstTry = createAssessmentState(content);
for (const question of content.questions) { firstTry = answerQuestion(content, firstTry, question.id, question.correctAnswer); firstTry = advanceAssessment(content, firstTry, question.id); }
assert(assessmentComplete(content, firstTry));
assert(firstTry.records.every(record => record.firstCorrect && record.attemptCount === 1));
// 設問の正解判定は他の設問の値に依存せず、共通基盤上で単独でも成立する。
const skipMid = byId("skip-mid");
const independent = { ...content, id: "standalone-question-skip-mid", questions: [skipMid] };
const independentDone = answerQuestion(independent, createAssessmentState(independent), skipMid.id, skipMid.correctAnswer);
assert(assessmentComplete(independent, advanceAssessment(independent, independentDone, skipMid.id)));
const nodeSession = createAssessmentState(nodeContent);
assert.equal(answerQuestion(nodeContent, nodeSession, nodeContent.questions[0].id, choice("hi")), nodeSession, "Choice answers cannot affect node questions");
assert.throws(() => activeQuestion(content, nodeSession), /mismatch/);

function rejects(change) {
  const broken = { ...content, questions: content.questions.map(question => ({ ...question, blank: { ...question.blank }, choices: question.choices.map(option => ({ ...option })) })) };
  change(broken, broken.questions.findIndex(question => question.id === "mid-formula"));
  assert.throws(() => validateBinarySearchCodeCheck(broken));
}
rejects((broken, i) => broken.questions[i].choices[1].text = "lo");
rejects((broken, i) => broken.questions[i].choices[1].id = "lo");
rejects((broken, i) => broken.questions[i].correctAnswer = choice("lo"));
rejects((broken, i) => broken.questions[i].blank.start++);
rejects((broken, i) => broken.questions[i].blank.length = 0);
rejects((broken, i) => broken.questions[i].blank.start = 1000);
rejects((broken, i) => broken.questions[i].lineId = "missing");
rejects((broken, i) => broken.questions[i].reviewLineId = "drop-left");
rejects((broken, i) => broken.questions[i].reviewStepIds = ["missing"]);
rejects((broken, i) => broken.questions[i].reviewStepIds = ["execution-probe-1-drop-left"]);
assert.throws(() => validateAssessment({ ...content, kind: "node-tap-check" }));
console.log("Binary-search code check: eight independent questions covering both range ends, the loop condition, the center formula, the hit test, the returned position, the branch test and both drop updates, byte-exact restoration, twenty-four Python syntax checks, baseline case execution, shared display/review identity, question-specific feedback, common retries/records and invalid-data rejection passed.");
