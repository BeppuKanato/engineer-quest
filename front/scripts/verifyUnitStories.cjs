const assert=require('node:assert/strict');
const path=require('node:path');
const {loader,root,React,renderToStaticMarkup}=require('./dailyReviewTestHarness.cjs');
const load=loader();
const app=path.join(root,'features/learning/app');
const {learningUnits}=load(path.join(app,'unitRegistry.ts'));
const {missionStoryFor}=load(path.join(app,'missionStories.tsx'));
const {findUnitMission}=load(path.join(app,'missionRegistry.ts'));
const {missionThumbnailFor}=load(path.join(app,'MissionThumbnail.tsx'));
assert.equal(learningUnits.length,9);
for(const unit of learningUnits){
 const story=missionStoryFor(unit.courseId), mission=findUnitMission(unit.courseId);
 assert(mission?.title&&mission?.successCondition,unit.courseId);
 assert.equal(story?.steps.length,6,unit.courseId);
 const scenes=story.steps.map(step=>{
  assert(step.caption.trim().length>10,unit.courseId);
  const html=renderToStaticMarkup(React.createElement(React.Fragment,null,step.figure));
  assert(html.includes('<svg')&&html.includes('aria-label='),unit.courseId);
  return html;
 });
 assert.equal(new Set(scenes).size,6,unit.courseId+' must have distinct figures');
 assert.equal(scenes[0],renderToStaticMarkup(React.createElement(React.Fragment,null,missionThumbnailFor(unit.courseId))),unit.courseId+' opening figure matches thumbnail');
}
assert.equal(missionStoryFor('unknown'),null);
console.log('PASS: all nine units have six distinct illustrated story beats, matching first thumbnails and mission conditions');
