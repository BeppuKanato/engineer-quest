const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loader,root,React,renderToStaticMarkup}=require('./dailyReviewTestHarness.cjs');
const load=loader({"./useDailyReview":{useDailyReview:()=>({review:null,loading:false,error:false})}});
const {reviewMaterials,resolveReviewMaterial,singleReviewContent,unsupportedReviewReason}=load(path.join(root,'features/learning/daily-review/reviewMaterials.tsx'));
const engine=load(path.join(root,'features/learning/assessment/assessment.ts'));
const definitions=JSON.parse(fs.readFileSync(path.resolve(root,'../../back/src/learning/feedback/concepts.json'),'utf8'));
let questions=0,requires=0;const excluded=[];const forms=new Set(),units=new Set();
for(const unit of definitions)for(const concept of unit.concepts)for(const question of concept.questions){
 const material=resolveReviewMaterial({courseId:unit.courseId,...question});if (!material) {
  const source=reviewMaterials.find(m=>m.courseId===unit.courseId&&m.phaseKey===question.phaseKey&&m.questionId===question.questionId);
  assert(source&&unsupportedReviewReason(source));excluded.push(`${unit.courseId}/${question.questionId}`);continue;
 }
 units.add(unit.courseId);questions++;
 const before=JSON.stringify(material.question);requires+=Number(!!material.question.requires);
 const content=singleReviewContent(material,'fixture');assert.equal(content.questions.length,1);assert.equal(content.questions[0].requires,null);
 let state=engine.createAssessmentState(content);state=engine.answerQuestion(content,state,material.questionId,material.question.correctAnswer);
 assert.equal(state.records.length,1);assert.equal(state.records[0].attempts.length,1);assert.equal(state.records[0].attempts[0].correct,true);
 assert.equal(before,JSON.stringify(material.question),'Source question must be unchanged');
 const kind=material.question.kind??'node';forms.add(kind);
 assert(renderToStaticMarkup(material.render({disabled:false,onAnswer(){throw new Error('SSR must not submit');}})).length>0);
}
assert.equal(reviewMaterials.length,questions+excluded.length);assert.equal(questions,148);assert.deepEqual(excluded.sort(),["course-algorithm-breadth-first-search-v1/whole-code-order","course-algorithm-wall-extension-v1/whole-code-order"]);assert.equal(units.size,7);assert.deepEqual([...forms].sort(),['choice','code-blank','node','parsons']);assert(requires>0);
assert.equal(resolveReviewMaterial({courseId:'unknown',phaseKey:'none',assessmentId:'none',questionId:'none'}),null);
// 新規フローの依存境界。既存の保存・観測コンポーネントを呼び込まない。
const dir=path.join(root,'features/learning/daily-review');
for(const file of fs.readdirSync(dir)){
 const source=fs.readFileSync(path.join(dir,file),'utf8');
 assert(!/completeLearningPhase|completePhase|onLearningEvent|useAssessmentObservation|useAssessmentCompletion|assessmentEvidence\(|useLearningVisit|feedbackV1/.test(source),file);
}
const api=fs.readFileSync(path.join(root,'api/dailyReview.api.ts'),'utf8');assert(!/learning\/|events\/|feedback/.test(api));
const home=fs.readFileSync(path.join(root,'app/home/page.tsx'),'utf8');assert(home.includes('<DailyReviewCard />'));
const {DailyReviewCardContent}=load(path.join(dir,'DailyReviewCard.tsx'));
const base={id:'fixture',date:'2026-11-19',...reviewMaterials[0],selectedAt:'2026-11-19T00:00:00Z',answeredAt:null,correct:null};
for(const correct of [true,false]){
 const html=renderToStaticMarkup(React.createElement(DailyReviewCardContent,{review:{...base,answeredAt:'2026-11-19T01:00:00Z',correct}}));
 assert(html.includes('回答済み'));assert(!html.includes('復習する'));assert(html.includes(correct?'正解でした。':'不正解でした。'));
}
console.log(`Daily review: ${units.size} units / ${questions} supported questions (+${excluded.length} hidden) / ${forms.size} formats / ${requires} prerequisites; original scenes and answers, single-question engine, completed card and isolated dependencies passed.`);
