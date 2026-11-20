// 実際の再生状態遷移を使い、図の先出し・正解ゲート・採点への混入を検出する。
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { load } = require('./learningModuleLoader.cjs');
const root = path.resolve(__dirname, '../src/features/learning');
const { advancePredictionPlayback: advance, initialPredictionPlayback: initial } = load(`${root}/player/predictionPlayback.ts`);
const { advancePlayback } = load(`${root}/player/playback.ts`);
const { defineLearningContent } = load(`${root}/player/content.types.ts`);
const { bfsExecutionContent: content } = load(`${root}/bfs/execution/execution.content.ts`);
const { validateBfsExecutionCanvas } = load(`${root}/bfs/execution/execution.types.ts`);
const plain = value => JSON.parse(JSON.stringify(value));
const predicted = content.steps.filter(step => step.prediction);
assert.deepEqual(plain(predicted.map(step => step.id)), ['dequeue-b', 'discover-e', 'skip-e', 'skip-b-from-e']);

for (const mode of ['correct', 'incorrect', 'skip']) {
  let state = advance(initial(), { type: 'toggle' }, content), stops = 0;
  for (let ticks = 0; ticks < 40 && state.playback.index !== content.steps.length - 1; ticks++) {
    state = advance(state, { type: 'tick' }, content);
    if (state.pendingIndex === null) continue;
    stops++;
    const target = state.pendingIndex, step = content.steps[target];
    assert.equal(state.playback.index, target - 1, 'answer snapshot/caption must stay unrevealed');
    assert.equal(state.playback.playing, false);
    for (const action of [{ type: 'tick' }, { type: 'toggle' }, { type: 'seek', index: 19 }, { type: 'answer', choiceId: 'invalid' }]) {
      assert.equal(advance(state, action, content), state, 'unanswered prediction holds its preceding snapshot');
    }
    const choice = step.prediction.choices.find(c => (c.id === step.prediction.correctChoiceId) === (mode === 'correct'));
    state = advance(state, mode === 'skip' ? { type: 'skip' } : { type: 'answer', choiceId: choice.id }, content);
    assert.equal(state.playback.index, target);
    assert.equal(state.playback.playing, true, 'wrong and skipped predictions resume too');
    assert.equal(state.feedback.correct, mode === 'skip' ? null : mode === 'correct');
    assert.equal(advance(state, { type: 'answer', choiceId: choice.id }, content), state, 'one answer only');
    const back = advance(state, { type: 'seek', index: target - 1 }, content);
    const revisit = advance(back, { type: 'seek', index: target }, content);
    assert.equal(revisit.pendingIndex, null, 'revisits do not ask resolved predictions again');
  }
  assert.equal(stops, 4);
  assert.equal(state.playback.index, 19);
  assert.equal(state.playback.playing, false);
  assert.equal(advance(state, { type: 'toggle' }, content).resolvedStepIds.length, 0, 'replay starts a new prediction pass');
}
// 任意シークでも直前の図を使う。未回答でも末尾へシークして完了できる。
const sought = advance(initial(), { type: 'seek', index: 10 }, content);
assert.equal(sought.pendingIndex, 10); assert.equal(sought.playback.index, 9);
const end = advance(initial(), { type: 'seek', index: 19 }, content);
assert.equal(end.playback.index, 19); assert.equal(end.resolvedStepIds.length, 0);
// 末尾に予想を置いた別教材でも、答えを出す前には完了しない。
const lastContent = { ...content, steps: [content.steps[0], predicted[0]] };
const lastPending = advance(initial(), { type: 'seek', index: 1 }, lastContent);
assert.equal(lastPending.playback.index, 0);
assert.equal(advance(lastPending, { type: 'skip' }, lastContent).playback.playing, false);

// 予想なしでは、既存のフェーズ1/他単元を含め全操作が以前の再生と一致する。
for (const [kind, name] of [['bfs', 'bfs'], ['dfs', 'dfs'], ['wall-extension', 'wallExtension'], ['bubble-sort', 'bubbleSort'], ['maze-digging', 'mazeDigging'], ['binary-search', 'binarySearch'], ['greedy-coins', 'greedyCoins']]) {
  const original = load(`${root}/${kind}/execution/execution.content.ts`)[`${name}ExecutionContent`];
  const without = { ...original, steps: original.steps.map(step => ({ ...step, prediction: undefined })) };
  let state = initial(), old = state.playback;
  const actions = [{ type: 'toggle' }, ...without.steps.map(() => ({ type: 'tick' })), { type: 'toggle' },
    { type: 'seek', index: 3 }, { type: 'seek', index: -1 }, { type: 'seek', index: 999 }];
  for (const action of actions) {
    state = advance(state, action, without); old = advancePlayback(old, action, without.steps.length);
    assert.deepEqual(plain(state.playback), plain(old)); assert.equal(state.pendingIndex, null);
  }
}
for (const change of [c => c.phase = 1, c => c.steps[0].prediction = c.steps[5].prediction,
  c => c.steps[5].prediction.correctChoiceId = 'missing', c => c.steps[5].prediction.choices[1].id = 'b',
  c => c.steps[5].prediction.choices = [], c => c.steps[5].prediction.prompt = '']) {
  const broken = plain(content); change(broken); assert.throws(() => defineLearningContent(broken, validateBfsExecutionCanvas), /Predictions/);
}
const archive = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../back/src/learning/feedback/materials.json'), 'utf8'));
const material = archive.revisions[archive.current['bfs-check']];
assert.equal(material.executionPredictions.length, 4);
const concepts = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../back/src/learning/feedback/concepts.json'), 'utf8')).find(u => u.kind === 'bfs');
for (const assessment of material.assessments) {
  const mapped = concepts.concepts.flatMap(c => c.questions).filter(q => q.assessmentId === assessment.id);
  assert.deepEqual(mapped.map(q => q.questionId).sort(), assessment.questions.map(q => q.id).sort(), 'concepts map only the unchanged assessment questions');
}
console.log('Prediction playback: 4 BFS pauses, preceding snapshots, right/wrong/skip continuation, seek/replay, unchanged 7-unit playback and assessment mappings passed.');
