const assert=require('node:assert/strict');
const path=require('node:path');
const {load}=require('./learningModuleLoader.cjs');
const root=path.resolve(__dirname,'../src/features/learning');
const registry=load(path.join(root,'app/unitRegistry.ts')).learningUnits;
const a=load(path.join(root,'assessment/assessment.ts'));
const archive=require('../../back/src/learning/feedback/materials.json');
let count=0;
for(const unit of registry)for(const [dir,file] of [['check','check'],['code-check','codeCheck'],['consolidation','consolidation']]){
 const content=Object.values(load(path.join(root,unit.kind,dir,file+'.content.ts'))).find(v=>v?.questions);
 let state=a.createAssessmentState(content);
 for(const q of content.questions){state=a.answerQuestion(content,state,q.id,q.correctAnswer);state=a.advanceAssessment(content,state,q.id);}
 assert(a.assessmentComplete(content,state));
 const saved=a.assessmentEvidence(content,state);
 assert.equal(saved.version,3);
 assert.equal(saved.materialVersion,archive.current[content.id]);
 assert.equal(saved.records.length,content.questions.length);
 count+=saved.records.length;
}
assert.equal(count,150);
console.log('PASS: all 150 real UI questions persist answers with the exact material revision');
