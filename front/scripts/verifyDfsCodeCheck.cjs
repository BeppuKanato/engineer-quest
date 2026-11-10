const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
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
const { dfsCodeCheckContent: content } = load(`${root}/dfs/code-check/codeCheck.content.ts`);
const { dfsCode, dfsCodeSource, dfsCodeLineNumber } = load(`${root}/dfs/code-mapping/dfsCode.ts`);
const { dfsCodeMappingContent: mapping } = load(`${root}/dfs/code-mapping/codeMapping.content.ts`);
const { CodeDisplay } = load(`${root}/code/CodeDisplay.tsx`);
const { selectReviewContent } = load(`${root}/review/reviewContent.ts`);
const { createAssessmentState, activeQuestion, answerQuestion, advanceAssessment, assessmentComplete } = load(`${root}/assessment/assessment.ts`);
const plain = value => JSON.parse(JSON.stringify(value));
const choice = choiceId => ({ kind: "choice", choiceId });

assert.equal(content.code, dfsCode);
assert.equal(content.code.id, "dfs-order-stack");
assert.equal(content.phase, 5);
assert.equal(content.questions.length, 2);
const [push, condition] = content.questions;
assert.deepEqual(plain(content.questions.map(question => question.lineId)), ["append-stack", "if-unvisited"]);
assert.deepEqual(plain(push.choices.map(option => option.text)), ["append", "pop", "remove"]);
assert.deepEqual(plain(condition.choices.map(option => option.text)), ["not in", "in", "=="]);

const programs = [];
for (const question of content.questions) {
  assert.equal(question.requires, null);
  assert(question.prompt.includes(`${dfsCodeLineNumber(question.lineId)}行目`));
  const { start, length } = question.blank;
  for (const option of question.choices) {
    const code = dfsCode.lines.map(line => line.id === question.lineId
      ? line.text.slice(0, start) + option.text + line.text.slice(start + length)
      : line.text).join("\n");
    if (option.id === question.correctAnswer.choiceId) assert.equal(code, dfsCodeSource);
    else assert.notEqual(code, dfsCodeSource);
    programs.push(code);
  }

  const review = selectReviewContent(mapping, question.reviewStepIds);
  assert.equal(review.steps.length, 2);
  for (const frame of review.steps) assert.equal(frame, mapping.steps.find(step => step.id === frame.id));
  assert.equal(review.steps.at(-1).canvas.highlights[0].id, question.lineId);
  assert.equal(review.steps.at(-1).id, question.stepId);

  const html = renderToStaticMarkup(createElement(CodeDisplay, {
    code: dfsCode, label: "dfs_orderのコード", blank: { lineId: question.lineId, ...question.blank },
  }));
  assert.equal((html.match(/aria-label="空欄"/g) || []).length, 1);
  assert.equal((html.match(/data-code-line-id=/g) || []).length, 12);
  for (const line of dfsCode.lines) assert.equal(html.includes(line.text), line.id !== question.lineId);
}
const syntax = spawnSync(process.env.PYTHON || "python3", [
  "-c", "import ast,json,sys\nfor source in json.load(sys.stdin): ast.parse(source)",
], { input: JSON.stringify(programs), encoding: "utf8" });
assert.ifError(syntax.error);
assert.equal(syntax.status, 0, syntax.stderr);
assert.equal(programs.length, 6);

let state = createAssessmentState(content);
assert.equal(advanceAssessment(content, state, push.id), state);
assert.equal(answerQuestion(content, state, condition.id, condition.correctAnswer), state);
state = answerQuestion(content, state, push.id, choice("pop"));
assert.equal(activeQuestion(content, state), push);
state = answerQuestion(content, state, push.id, push.correctAnswer);
assert.equal(state.records[0].attemptCount, 2);
assert.equal(state.records[0].firstCorrect, false);
assert.equal(state.records[0].solved, true);
state = advanceAssessment(content, state, push.id);
assert.equal(activeQuestion(content, state), condition);
assert.equal(answerQuestion(content, state, push.id, push.correctAnswer), state);
state = answerQuestion(content, state, condition.id, choice("in"));
state = advanceAssessment(content, state, condition.id);
assert(assessmentComplete(content, state));
assert.deepEqual(plain(state.records.map(record => record.firstCorrect)), [false, false]);

let skipped = createAssessmentState(content);
skipped = answerQuestion(content, skipped, push.id, choice("remove"));
skipped = advanceAssessment(content, skipped, push.id);
assert.equal(activeQuestion(content, skipped), condition);
skipped = answerQuestion(content, skipped, condition.id, condition.correctAnswer);
skipped = advanceAssessment(content, skipped, condition.id);
assert(assessmentComplete(content, skipped));
assert.deepEqual(plain(skipped.records.map(record => record.firstCorrect)), [false, true]);

console.log("DFS code check verified: independent blanks, exact code restoration, six Python syntax checks, original review frames, retries and first-attempt scoring.");
