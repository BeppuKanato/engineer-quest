const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loader,root,React,renderToStaticMarkup}=require('./dailyReviewTestHarness.cjs');
const load=loader({'@/app/component/userSession':{useUserSession:()=>({})}});
const {ConceptProgressList}=load(path.join(root,'features/learning/app/ConceptProgressMap.tsx'));
const data={courseId:'fixture',concepts:[
 {conceptId:'reached',label:'キューの操作',state:'reached',reachedQuestions:2,totalQuestions:2,answeredQuestions:2,firstAttemptCorrect:0,firstAttemptQuestions:2,firstAttemptRate:0},
 {conceptId:'in-progress',label:'探索順序',state:'in_progress',reachedQuestions:1,totalQuestions:3,answeredQuestions:2,firstAttemptCorrect:1,firstAttemptQuestions:2,firstAttemptRate:50},
 {conceptId:'unknown',label:'距離の記録と更新',state:'unconfirmed',reachedQuestions:0,totalQuestions:4,answeredQuestions:0,firstAttemptCorrect:0,firstAttemptQuestions:0,firstAttemptRate:null},
]};
const html=renderToStaticMarkup(React.createElement(ConceptProgressList,{data}));
for(const label of ['到達','取り組み中','未確認','2/2問','1/3問','0/4問','0%（0/2問）','50%（1/2問）','—（初回の記録なし）'])assert(html.includes(label),label);
for(const state of ['reached','in_progress','unconfirmed'])assert(html.includes(`data-concept-state="${state}"`));
assert(html.includes('border-top:4px solid'),'states use color as well as text');
const overview=fs.readFileSync(path.join(root,'features/learning/app/UnitOverview.tsx'),'utf8');assert(overview.includes('<ConceptProgressMap courseId={courseId} />'));
const api=fs.readFileSync(path.join(root,'api/conceptProgress.api.ts'),'utf8');assert(api.includes('encodeURIComponent(courseId)'));assert(!/POST|completePhase|events\/batch|daily-review/.test(api));
console.log('Concept progress UI: all three states, reached with 0% first accuracy, count/coverage, no-first placeholder, color+text, overview wiring and read-only API passed.');
