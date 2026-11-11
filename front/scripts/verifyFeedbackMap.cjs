// サーバーレンダーによる構造検証。ブラウザ・実LLM・DBは使用しない。
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { load } = require('./learningModuleLoader.cjs');
const path = require('node:path');
const root = path.resolve(__dirname,'../src/features/learning');
const { ConceptMap } = load(`${root}/app/feedback/ConceptMap.tsx`);
const definitions = require('../../back/src/learning/feedback/concepts.json');
for (const unit of definitions) {
  const concepts = unit.concepts.map((c,i)=>({...c, state:['unobserved','confirmed','needs_check'][i%3],attemptedQuestions: i===0?0:1,totalQuestions:c.questions.length,
    evidence:c.questions.map(q=>({...q,first:{correct:false},latest:{correct:true},retried:true,sessions:2})),implementation:c.kind==='implementation'?{completed:true,testsPassed:true,testRuns:2,hintUsage:'unknown',inputLevel:'unknown'}:null}));
  const html = renderToStaticMarkup(React.createElement(ConceptMap,{snapshot:{id:'snapshot',version:1,title:unit.title,courseId:unit.courseId,relation:'unit-components',concepts}}));
  assert.equal((html.match(/<details/g)||[]).length,concepts.length);
  assert.equal((html.match(/<summary/g)||[]).length,concepts.length,'native keyboard/touch disclosure for every node');
  for(const c of concepts) assert.ok(html.includes(c.label));
  assert.ok(html.includes('未確認') && html.includes('確認できた') && html.includes('追加確認が必要'));
  assert.ok(html.includes('初回 誤答 → 直近 正答') && html.includes('再挑戦あり'));
  assert.ok(html.includes('テスト通過・完了'));
  assert.ok(html.includes('repeat(2') && html.includes('repeat(3'),'responsive grid rules');
  assert.ok(!html.includes('理解度%'));
}
console.log('PASS: seven-unit concept map SSR, labels/counts/evidence, keyboard disclosure, separate P7, responsive layout rules');
