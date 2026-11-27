// サーバーレンダーによる構造検証。ブラウザ・実LLM・DBは使用しない。
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { load } = require('./learningModuleLoader.cjs');
const path = require('node:path');
const root = path.resolve(__dirname,'../src/features/learning');
const { ConceptMap } = load(`${root}/app/feedback/ConceptMap.tsx`);
const definitions = require('../../back/src/learning/feedback/concepts.json');
// CSS and generated HTML attributes are not learner-facing content. For example
// "transparent" contains the internal question ID "parent". Check visible text and
// accessible names instead, without dropping the assertions about hidden IDs.
const learnerText = html => {
  const markup = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const names = [...markup.matchAll(/\b(?:aria-label|title|alt)="([^"]*)"/g)].map(m => m[1]);
  return [markup.replace(/<[^>]*>/g, ' '), ...names].join(' ');
};
assert.ok(!learnerText('<style>.x{color:transparent}</style><p>説明</p>').includes('parent'));
assert.ok(learnerText('<p>parent</p>').includes('parent'));
assert.ok(learnerText('<button aria-label="parent">説明</button>').includes('parent'));
for (const unit of definitions) {
  const concepts = unit.concepts.map((c,i)=>({...c, state:['unobserved','confirmed','needs_check'][i%3],attemptedQuestions: i===0?0:1,totalQuestions:c.questions.length,
    evidence:c.questions.map(q=>({...q,first:{correct:false},latest:{correct:true},retried:true,sessions:2})),implementation:c.kind==='implementation'?{completed:true,testsPassed:true,testRuns:2,hintUsage:'unknown',inputLevel:'unknown'}:null}));
  const html = renderToStaticMarkup(React.createElement(ConceptMap,{snapshot:{id:'snapshot',version:1,title:unit.title,courseId:unit.courseId,relation:'unit-components',concepts}}));
  const text = learnerText(html);
  assert.equal((html.match(/<details/g)||[]).length,concepts.length);
  assert.equal((html.match(/<summary/g)||[]).length,concepts.length,'native keyboard/touch disclosure for every node');
  for(const c of concepts) {
    assert.ok(html.includes(c.label));
    if(c.kind!=='implementation')assert.ok(html.includes(`${c.attemptedQuestions}/${c.totalQuestions}問回答済み`));
    for(const q of c.questions){
      assert.ok(!text.includes(q.questionId),q.questionId);
      for(const tag of q.tags.filter(t=>/^[a-z0-9-]+$/.test(t)))assert.ok(!text.includes(tag),tag);
      assert.ok(html.includes(q.stageLabel));
    }
  }
  assert.ok(html.includes('正答は完全な理解を示すものではありません。'));
  assert.ok(html.includes('未確認') && html.includes('確認できた') && html.includes('追加確認が必要'));
  assert.ok(html.includes('初回 誤答 → 直近 正答') && html.includes('再挑戦あり'));
  assert.ok(html.includes('テスト通過・完了'));
  assert.ok(html.includes('repeat(2') && html.includes('repeat(3'),'responsive grid rules');
  assert.ok(!html.includes('理解度%'));
  const legacy=structuredClone(concepts);
  for(const c of legacy)for(const q of c.evidence){delete q.stageLabel;delete q.questionLabel;}
  const oldHtml=renderToStaticMarkup(React.createElement(ConceptMap,{snapshot:{id:'legacy',title:unit.title,concepts:legacy}}));
  for(const c of legacy)for(const q of c.evidence)assert.ok(!learnerText(oldHtml).includes(q.questionId),'old stored snapshots also hide internal IDs');
  assert.ok(!oldHtml.includes('undefined'));

}
console.log('PASS: nine-unit concept map SSR, labels/counts/evidence, keyboard disclosure, separate P7, responsive layout rules');
