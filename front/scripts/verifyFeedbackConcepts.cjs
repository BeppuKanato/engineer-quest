const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('./learningModuleLoader.cjs');
const root = path.resolve(__dirname, '../src/features/learning');
const definitions = require('../../back/src/learning/feedback/concepts.json');
const plain = value => JSON.parse(JSON.stringify(value));
function validate(units) {
  const registry = load(`${root}/app/unitRegistry.ts`).learningUnits;
  assert.equal(units.length, registry.length);
  assert.equal(new Set(units.map(u => u.courseId)).size, units.length);
  const ids = new Set();
  let questionCount = 0;
  for (const unit of registry) {
    const definition = units.find(d => d.courseId === unit.courseId);
    assert.ok(definition, unit.kind);
    assert.deepEqual(definition.phases, plain(unit.phases.map(({id, phase, formalName}) => ({id, phase, formalName}))));
    const expected = [];
    for (const [dir, file] of [['check','check'], ['code-check','codeCheck'], ['consolidation','consolidation']]) {
      const content = Object.values(load(`${root}/${unit.kind}/${dir}/${file}.content.ts`)).find(v => v?.questions);
      expected.push(...plain(content.questions.map(q => ({phaseKey:content.id, assessmentId:content.id, questionId:q.id, tags:q.tags, stageLabel:unit.phases.find(p=>p.id===content.id).formalName, questionLabel:q.prompt}))));
    }
    const actual = definition.concepts.flatMap(c => c.questions);
    const key = q => `${q.phaseKey}/${q.assessmentId}/${q.questionId}`;
    assert.equal(new Set(actual.map(key)).size, actual.length, 'duplicate mapping');
    assert.deepEqual([...actual].sort((a,b)=>key(a).localeCompare(key(b))), expected.sort((a,b)=>key(a).localeCompare(key(b))), unit.kind);
    questionCount += actual.length;
    for (const concept of definition.concepts) {
      assert.ok(concept.label && !ids.has(concept.conceptId)); ids.add(concept.conceptId);
      assert.ok(concept.kind === 'implementation' ? concept.questions.length === 0 && unit.phases.some(p=>p.id===concept.phaseKey && p.phase===7) : concept.questions.length > 0);
    }
  }
  return {units: units.length, concepts: ids.size, questions: questionCount};
}
const counts = validate(definitions);
for (const mutation of ['missing', 'duplicate', 'unknown', 'tags']) {
  const changed = structuredClone(definitions);
  const qs = changed[0].concepts[0].questions;
  if (mutation === 'missing') qs.pop();
  if (mutation === 'duplicate') qs.push(qs[0]);
  if (mutation === 'unknown') qs[0].questionId = 'invented';
  if (mutation === 'tags') qs[0].tags = ['wrong'];
  assert.throws(()=>validate(changed), mutation);
}
console.log('PASS: registry, every question/phase/assessment/tag, stable concepts, invalid mutations', counts);
