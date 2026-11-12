const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

let reported, effects = [];
const exportsObject = {};
const source = fs.readFileSync(path.resolve(__dirname, "../src/features/learning/assessment/useAssessmentCompletion.ts"), "utf8");
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
  exports: exportsObject,
  require(name) {
    assert.equal(name, "react");
    return { useRef: value => reported ||= {current:value}, useEffect: effect => effects.push(effect) };
  },
});
const { useAssessmentCompletion: runCompletionHook } = exportsObject;
const received = [], replacement = [];
const onComplete = summary => received.push(summary);
const evidence = [{questionId:"q", firstCorrect:false, attemptCount:2}];
function draw(complete, correct = 1, callback = onComplete, currentEvidence = evidence) {
  effects = [];
  runCompletionHook(complete, correct, 2, callback, currentEvidence);
  effects.forEach(effect => effect());
}
draw(false); assert.equal(received.length,0);
draw(true); assert.equal(received.length,1);
assert.equal(received[0].firstAttemptCorrect,1);
assert.equal(received[0].totalQuestions,2);
assert.equal(received[0].assessmentEvidence,evidence);
draw(true,2); draw(true,2,summary=>replacement.push(summary),[...evidence]);
assert.equal(received.length,1,"re-rendering must not repeat a completion");
assert.equal(replacement.length,0,"changing the callback/evidence must not repeat a completion");
draw(false); draw(true,2,summary=>replacement.push(summary));
assert.equal(replacement.length,1,"a new solve after restarting reports again");
assert.equal(replacement[0].firstAttemptCorrect,2);
console.log("Assessment completion: first completion once, evidence passed through, callback/evidence changes deduplicated, restart and recompletion reported once.");
