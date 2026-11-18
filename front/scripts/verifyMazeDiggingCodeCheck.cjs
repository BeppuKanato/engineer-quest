const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { spawnSync} = require("node:child_process");
const cache = new Map();
function load(filename) {
filename = path.resolve(filename);
if (cache.has(filename)) return cache.get(filename);
const exports = {};
cache.set(filename, exports);
const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX},
}).outputText;
vm.runInNewContext(source, { exports, require: name => {
if (!name.startsWith(".")) return require(name);
const base = path.resolve(path.dirname(filename), name);
return load([`${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file)));
}}, { filename});
return exports;
}
const root = path.resolve(__dirname, "../src/features/learning");
const { mazeDiggingCodeCheckContent: content, validateMazeDiggingCodeCheck, fillCodeBlank} = load(`${root}/maze-digging/code-check/codeCheck.content.ts`);
const { mazeDiggingCode, mazeDiggingCodeLineNumber, mazeDiggingCodeSource} = load(`${root}/maze-digging/code-mapping/mazeDiggingCode.ts`);
const { mazeDiggingCodeMappingContent: mapping} = load(`${root}/maze-digging/code-mapping/codeMapping.content.ts`);
const { createAssessmentState, activeQuestion, answerQuestion, advanceAssessment, assessmentComplete, validateAssessment} = load(`${root}/assessment/assessment.ts`);
const { newAnswerFeedback} = load(`${root}/assessment/answerFeedbackState.ts`);
const { mazeDiggingCheckContent: nodeContent} = load(`${root}/maze-digging/check/check.content.ts`);
const { selectReviewContent} = load(`${root}/review/reviewContent.ts`);
const { CodeDisplay} = load(`${root}/code/CodeDisplay.tsx`);
const { renderToStaticMarkup} = require("react-dom/server");
const { createElement} = require("react");
const plain = value => JSON.parse(JSON.stringify(value));
// Reactのサーバー描画はテキスト中の & < > " ' をエスケープする。コード行の照合はエスケープ後の形で行う。
const escapeText = text => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const choice = choiceId => ({ kind: "choice", choiceId});

// 強化後の確定事項（10問、コードの流れ順）。対象行・空欄・選択肢・正解・復習フレームを固定する。
const expected = [
{ id: "grid-size", lineId: "initialize-grid", stepId: "execution-all-walls", reviewStepIds: ["define-function", "execution-all-walls"],
purpose: "盤面のグリッドを用意するために", choices: ["size", "size - 1", "size + 1"], correctText: "size", reason: /グリッドは盤面の大きさsizeの正方形なので/u },
{ id: "dig-start-cell", lineId: "dig-start", stepId: "execution-dig-start", reviewStepIds: ["define-directions", "execution-dig-start"],
purpose: "掘り始める部屋を掘るために", choices: ["1", "0", "2"], correctText: "1", reason: /スタートの部屋は両方の位置が1のマスなので/u },
{ id: "initial-stack", lineId: "initialize-stack", stepId: "initialize-stack", reviewStepIds: ["execution-dig-start", "initialize-stack"],
purpose: "掘った部屋をためるstackの最初の状態を作るために", choices: ["(1, 1)", "(0, 0)", "(1, 0)"], correctText: "(1, 1)", reason: /スタートの部屋 \(1, 1\)/u },
{ id: "current-room-top", lineId: "current-room", stepId: "current-room-1", reviewStepIds: ["while-stack-1", "current-room-1"],
purpose: "現在マスをstackの一番上から決めるために", choices: ["-1", "0", "1"], correctText: "-1", reason: /stackの一番上（最後に入れた部屋）は、添字-1で表します/u },
{ id: "next-room-distance", lineId: "compute-next", stepId: "compute-next-1-2", reviewStepIds: ["for-direction-1-2", "compute-next-1-2"],
purpose: "掘る部屋の座標（2マス先）を求めるために", choices: ["1", "2", "3"], correctText: "2", reason: /掘るのは2マス先の部屋なので/u },
{ id: "undug-room-condition", lineId: "if-diggable", stepId: "if-diggable-1-2", reviewStepIds: ["compute-next-1-2", "if-diggable-1-2"],
purpose: "まだ掘っていない部屋かどうかを調べるために", choices: ["0", "1", "2"], correctText: "1", reason: /グリッドの1は壁のままを表すので/u },
{ id: "append-candidate-order", lineId: "append-candidate", stepId: "append-candidate-1-2", reviewStepIds: ["compute-next-1-2", "append-candidate-1-2"],
purpose: "掘れる部屋を候補に加えるために", choices: ["(nx, ny)", "(ny, nx)", "(x, y)"], correctText: "(nx, ny)", reason: /候補に加えるのは、今求めた2マス先の部屋/u },
{ id: "choose-by-step", lineId: "choose-candidate", stepId: "choose-candidate-1", reviewStepIds: ["if-candidates-1", "choose-candidate-1"],
purpose: "候補の中から掘る部屋を番号で選ぶために", choices: ["step", "step + 1", "0"], correctText: "step", reason: /使う番号はchoicesのstep番目で/u },
{ id: "between-midpoint", lineId: "dig-between", stepId: "dig-between-1", reviewStepIds: ["advance-step-1", "dig-between-1"],
purpose: "間の壁の位置を求めるために", choices: ["// 2", "/ 2", "// 3"], correctText: "// 2", reason: /間の壁は2つの部屋の中間にあるので/u },
{ id: "backtrack-pop", lineId: "pop-stack", stepId: "execution-backtrack-1", reviewStepIds: ["if-candidates-7", "else-branch-7", "pop-stack-7", "execution-backtrack-1"],
purpose: "行き止まりから戻るために", choices: ["pop", "append", "clear"], correctText: "pop", reason: /候補がないときは、stackの一番上を取り除くpopで/u },
];

validateMazeDiggingCodeCheck(content);
assert.equal(content.id, "maze-digging-code-check");
assert.equal(content.phase, 5);
assert.equal(content.stageName, "コードの確認問題");
assert.equal(content.code, mazeDiggingCode, "Share the phase-4 code contract, not a copy");
assert.equal(content.code.id, "maze-digging-v1");
assert.equal(content.code.version, 1);
assert.equal(content.questions.length, expected.length);
assert.deepEqual(plain(content.questions.map(question => question.id)), expected.map(row => row.id));
assert.deepEqual(plain(content.questions.map(question => question.lineId)), expected.map(row => row.lineId));
assert.deepEqual(plain(content.questions.map(question => question.stepId)), expected.map(row => row.stepId));
assert.deepEqual(plain(content.questions.map(question => question.reviewStepIds)), expected.map(row => row.reviewStepIds));
assert.match(content.instruction, /空欄に入るものを選ぶ/u);
assert.equal(content.reviewLabel, "💡 この処理の動きをもう一度見る");
assert.match(content.completion.caption, /次は/u);
assert.match(content.completion.caption, /7問/u);
assert(!/完璧|マスター/u.test(content.completion.caption));

const programs = [];
content.questions.forEach((question, index) => {
const spec = expected[index];
const line = mazeDiggingCode.lines.find(row => row.id === question.lineId);
assert.deepEqual(plain(question.choices.map(option => option.text)), spec.choices);
const correct = question.choices.find(option => option.id === question.correctAnswer.choiceId);
assert.equal(correct.text, spec.correctText);
assert.equal(question.prompt, `${spec.purpose}、${mazeDiggingCodeLineNumber(question.lineId)}行目の空欄に入る正しいコードを選んでください。`);
assert.equal(question.requires, null, "Independent questions, no previous-answer requirement");
assert.equal((question.prompt.match(/[。？]/gu) || []).length, 1);
// 正誤フィードバックは「なぜその値か」が一文で分かること。
assert.match(question.correctFeedback, spec.reason);
assert.match(question.incorrectFeedback, spec.reason);
assert.equal((question.correctFeedback.match(/。/gu) || []).length, 1, "Correct feedback must explain in one sentence");
assert(question.incorrectFeedback.startsWith("不正解。"));
assert.equal((question.incorrectFeedback.slice("不正解。".length).match(/。/gu) || []).length, 1, "Incorrect feedback must explain in one sentence");
assert(!/完璧|マスター/u.test(question.correctFeedback + question.incorrectFeedback));
// 空欄は正解トークンちょうどを覆い、正解を入れると元の行とバイト単位で一致する。
assert.equal(line.text.slice(question.blank.start, question.blank.start + question.blank.length), correct.text,
"The blank must cover exactly the answer token");
assert(Buffer.from(fillCodeBlank(question, correct.text)).equals(Buffer.from(line.text)), "Correct option must restore the exact bytes, including indentation");
assert.equal(new Set(question.choices.map(option => option.id)).size, question.choices.length);
assert.equal(new Set(question.choices.map(option => option.text)).size, question.choices.length);
for (const option of question.choices) {
programs.push(mazeDiggingCode.lines.map(row => row.id === question.lineId? fillCodeBlank(question, option.text): row.text).join("\n"));
}
const review = selectReviewContent(mapping, question.reviewStepIds);
review.steps.forEach((step, reviewIndex) => assert.equal(step, mapping.steps.find(frame => frame.id === question.reviewStepIds[reviewIndex])));
assert.equal(review.steps.at(-1).canvas.highlights[0].id, question.reviewLineId);
assert.equal(question.reviewLineId, question.lineId);
const html = renderToStaticMarkup(createElement(CodeDisplay, { code: mazeDiggingCode, label: "dig_mazeのコード", blank: { lineId: question.lineId,...question.blank}}));
assert.equal((html.match(/aria-label="空欄"/g) || []).length, 1, "Only the target line is blank");
assert.equal((html.match(/data-code-line-id=/g) || []).length, 22);
for (const other of mazeDiggingCode.lines.filter(row => row.id!== question.lineId)) assert(html.includes(escapeText(other.text)), "All other source lines remain complete");
assert(!html.includes(escapeText(line.text)), "The hidden answer must not leak into visible code");
});
// 両側に同じトークンがある行は、読み順で先の側だけを空欄にする（既存Q1と同じ暫定判断）。
const distance = content.questions.find(question => question.id === "next-room-distance");
const distanceLine = mazeDiggingCode.lines.find(line => line.id === distance.lineId);
assert.equal(distance.blank.start, distanceLine.text.indexOf("2 * dx"), "The blank covers the dx-side multiplier only");
assert(fillCodeBlank(distance, "1").endsWith("y + 2 * dy"), "The dy-side multiplier stays visible and unchanged");
const midpoint = content.questions.find(question => question.id === "between-midpoint");
assert(fillCodeBlank(midpoint, "/ 2").includes("[(x + nx) // 2]"), "The x-side midpoint stays visible and unchanged");
// 正解で埋めた全文は参照コード原文と一致し、全候補が構文として成立する（誤答は実行しない）。
assert(programs.some(program => program === mazeDiggingCodeSource), "A correct fill must reproduce the contract source");
const syntax = spawnSync(process.env.PYTHON || "python3", ["-c", "import ast,json,sys\nprograms=json.load(sys.stdin)\nfor code in programs: ast.parse(code)\nprint(len(programs))"], { input: JSON.stringify(programs), encoding: "utf8"});
assert.equal(syntax.status, 0, syntax.stderr);
assert.equal(Number(syntax.stdout), 30, "All thirty alternatives must be parsed");

// 全問を通す: 誤答（全ての誤選択肢）→ 正答でも進まず、進行は advance のみ。記録は初回回答から導く。
let state = createAssessmentState(content);
assert.equal(activeQuestion(content, state), content.questions[0]);
assert(!assessmentComplete(content, state));
assert.equal(answerQuestion(content, state, content.questions[1].id, content.questions[1].correctAnswer), state, "No early answer to later question");
for (const answer of [choice("missing"), { kind: "node", nodeId: "2,2"}, { kind: "none"}]) assert.equal(answerQuestion(content, state, content.questions[0].id, answer), state);
for (const question of content.questions) {
assert.equal(activeQuestion(content, state), question);
for (const option of question.choices.filter(option => option.id!== question.correctAnswer.choiceId)) {
const before = state;
state = answerQuestion(content, state, question.id, choice(option.id));
const feedback = newAnswerFeedback(content, before, state);
assert.equal(feedback.correct, false);
assert.equal(feedback.message, question.incorrectFeedback);
assert.equal(activeQuestion(content, state), question);
}
const previous = state;
state = answerQuestion(content, state, question.id, question.correctAnswer);
assert.equal(previous.records[content.questions.indexOf(question)].solved, false, "Records are immutable");
assert.equal(newAnswerFeedback(content, previous, state).message, question.correctFeedback);
assert.equal(activeQuestion(content, state), question, "A correct answer does not advance on its own");
state = advanceAssessment(content, state, question.id);
}
assert(assessmentComplete(content, state));
assert.equal(activeQuestion(content, state), null);
assert(state.records.every(record => record.solved && record.firstCorrect === false && record.attemptCount === 3));

// 「次の問題へ」で正解せず進める（ソフトゲート）。全問未正解でも完了し、結果は初回回答のまま。
let skipped = createAssessmentState(content);
assert.equal(advanceAssessment(content, skipped, content.questions[0].id), skipped, "Cannot advance before answering");
for (const question of content.questions) {
skipped = answerQuestion(content, skipped, question.id, choice(question.choices.find(option => option.id!== question.correctAnswer.choiceId).id));
skipped = advanceAssessment(content, skipped, question.id);
}
assert(assessmentComplete(content, skipped), "An all-wrong run still completes");
assert(skipped.records.every(record => record.firstCorrect === false &&!record.solved && record.attemptCount === 1));

let firstTry = createAssessmentState(content);
for (const question of content.questions) { firstTry = answerQuestion(content, firstTry, question.id, question.correctAnswer); firstTry = advanceAssessment(content, firstTry, question.id);}
assert(assessmentComplete(content, firstTry));
assert(firstTry.records.every(record => record.firstCorrect && record.attemptCount === 1));
// 1問だけを取り出しても正解判定は他問の値に依存しない。
const standalone = content.questions.find(question => question.id === "undug-room-condition");
const independent = {...content, id: "standalone-question", questions: [standalone]};
const independentDone = answerQuestion(independent, createAssessmentState(independent), standalone.id, standalone.correctAnswer);
assert(assessmentComplete(independent, advanceAssessment(independent, independentDone, standalone.id)));
const nodeSession = createAssessmentState(nodeContent);
assert.equal(answerQuestion(nodeContent, nodeSession, nodeContent.questions[0].id, choice("two")), nodeSession, "Choice answers cannot affect node questions");
assert.throws(() => activeQuestion(content, nodeSession), /mismatch/);

const codeCheckPreviewSource = fs.readFileSync(`${root}/maze-digging/code-check/MazeDiggingCodeCheckPreview.tsx`, "utf8");
// レイアウト契約（#298）: 3段組。コード窓は固定高320px（窓の内側スクロールは維持）、選択肢は下部の固定ゾーン。
assert.match(codeCheckPreviewSource, /height: 320, flexShrink: 0, overflow: "auto"/, "code window has a fixed height (#298)");
assert.doesNotMatch(codeCheckPreviewSource, /flex: 1, minHeight: 0, overflow: "auto"/, "code window no longer takes the leftover height (#298)");
assert.match(codeCheckPreviewSource, /flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column"/, "prompt and code window flow in the middle scroll region (#298)");
assert.match(codeCheckPreviewSource, /borderTop: `1px solid/, "choices live in the fixed bottom zone (#298)");
assert.match(codeCheckPreviewSource, /advanceAssessment\(mazeDiggingCodeCheckContent, current, question\.id\)/);
assert.match(codeCheckPreviewSource, /"結果を見る" : "次の問題へ"/);
// 単品画面の仕組みはフェーズ3単品に揃える（#181）: 再回答時は見出しに「もう一度、」が付き、
// 「もう一度解く」は回答後ボタンと同じ行に出る（別の行に独立させない）。
assert.match(codeCheckPreviewSource, /retry \? "もう一度、" : ""/, "re-answering carries the same caption cue as phase 3");
assert.equal((codeCheckPreviewSource.match(/もう一度解く/g) || []).length, 1, "the restart button appears exactly once, inside the shared action row");

function rejects(change) {
const broken = {...content, questions: content.questions.map(question => ({...question, blank: {...question.blank}, choices: question.choices.map(option => ({...option}))}))};
change(broken);
assert.throws(() => validateMazeDiggingCodeCheck(broken));
}
rejects(broken => broken.questions[0].choices[0].text = "size - 1");
rejects(broken => broken.questions[0].choices[1].id = "size");
rejects(broken => broken.questions[0].correctAnswer = choice("size-minus-one"));
rejects(broken => broken.questions[0].blank.start++);
rejects(broken => broken.questions[0].blank.length = 0);
rejects(broken => broken.questions[0].blank.start = 1000);
rejects(broken => broken.questions[0].lineId = "missing");
rejects(broken => broken.questions[0].reviewLineId = "if-diggable");
rejects(broken => broken.questions[0].reviewStepIds = ["missing"]);
rejects(broken => broken.questions[0].reviewStepIds = ["if-diggable-1-2"]);
assert.throws(() => validateAssessment({...content, kind: "node-tap-check"}));
console.log("Maze-digging code check: ten independent questions, byte-exact restoration, thirty Python syntax checks, shared display/review identity, question-specific feedback, common retries/records and invalid-data rejection passed.");
