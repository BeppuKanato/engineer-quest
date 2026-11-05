const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'../src'),cache=new Map();
let cleanup, state, effect;
const hookReact={useRef:value=>({current:value}),useState:value=>[value,next=>state=next],useCallback:callback=>callback,useEffect:callback=>{effect=callback;}};
function load(file){if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>{if(name==='react'&&file.endsWith('/useRewardBoundary.ts'))return hookReact;if(!name.startsWith('.'))return require(name);const base=path.resolve(path.dirname(file),name);return load([base+'.ts',base+'.tsx'].find(fs.existsSync));}},{filename:file});return exports;}
const plain=value=>JSON.parse(JSON.stringify(value));
(async()=>{
 const {presentationFor,rewardStages,phaseBoundaryAchievements}=load(root+'/features/learning/rewards/presentation.ts');
 assert.deepEqual(plain(rewardStages),['anticipation','appearance','praise']);
 const strengths=['COMMON','RARE','EPIC'].map(presentationFor);
 for(const spec of strengths){assert.equal(spec.durations.length,3);assert(spec.durations.every(n=>n>0));assert(spec.durations.reduce((a,b)=>a+b,0)<=2500);}
 assert(strengths[0].rays<strengths[1].rays&&strengths[1].rays<strengths[2].rays);assert.equal(presentationFor('future-rarity'),strengths[0]);
 const achievement={id:'phase',title:'確認できた役割',description:'初回の回答で確認',rarity:'EPIC'};
 assert.equal(phaseBoundaryAchievements('check','implementation',[achievement]).length,1);assert.equal(phaseBoundaryAchievements('implementation','implementation',[achievement]).length,0);
 const {useRewardBoundary}=load(root+'/features/learning/rewards/useRewardBoundary.ts');const boundary=useRewardBoundary();cleanup=effect();
 let resolved=false;const pending=boundary.present({phaseKey:'check',achievements:[achievement]}).then(()=>resolved=true);await Promise.resolve();assert(!resolved,'The next phase waits at a saved boundary');assert.equal(state.phaseKey,'check');boundary.finish();await pending;assert(resolved);assert.equal(state,null);
 const leaving=boundary.present({phaseKey:'implementation',achievements:[]});cleanup();await leaving;await boundary.present({phaseKey:'gone',achievements:[]});assert.equal(state.phaseKey,'implementation','Unmount does not enqueue another presentation');
 const {mergeLearningRewards,emptyLearningRewards}=load(root+'/features/learning/app/rewards.ts');
 const first=mergeLearningRewards(emptyLearningRewards,{phase:{phaseKey:'execution'},awardedCard:{id:'first'},unlockedAchievements:[achievement]});
 const second=mergeLearningRewards(first,{phase:{phaseKey:'code-check'},awardedCard:{id:'second'},unlockedAchievements:[achievement,{...achievement,id:'unit'}]});
 assert.deepEqual(plain(second.awardedCards.map(x=>x.card.id)),['first','second']);assert.deepEqual(plain(second.unlockedAchievements.map(x=>x.id)),['phase','unit']);
 const {sortKnowledgeCards}=load(root+'/features/collection/knowledgeCards.ts');
 const cards=[{id:'hidden2',catalogNumber:2,isCollected:false,rarity:'EPIC'},{id:'owned',catalogNumber:3,isCollected:true,rarity:'COMMON'},{id:'hidden1',catalogNumber:1,isCollected:false,rarity:'RARE'}];
 for(const sort of ['newest','rarity','course'])assert.deepEqual(plain(sortKnowledgeCards(cards,sort).map(x=>x.id)),['owned','hidden1','hidden2']);
 cards[0].rarity='COMMON';cards[2].rarity='EPIC';assert.deepEqual(plain(sortKnowledgeCards(cards,'rarity').map(x=>x.id)),['owned','hidden1','hidden2']);
 const {createElement}=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const {UnknownKnowledgeCard}=load(root+'/features/collection/UnknownKnowledgeCard.tsx');const hidden=renderToStaticMarkup(createElement(UnknownKnowledgeCard));assert(hidden.includes('？？？'));assert(hidden.includes('data-uncollected-card'));assert(!/<button|href=|title=/.test(hidden));
 const {FinalLearningRewards}=load(root+'/features/learning/rewards/FinalLearningRewards.tsx');const html=renderToStaticMarkup(createElement(FinalLearningRewards,{rewards:second}));assert(html.includes('この単元で獲得した実績'));assert(html.includes('data-achievement-id="phase"'));assert(html.includes('data-achievement-id="unit"'));assert(html.includes('/collection'));assert(html.includes('/achievements'));
 console.log('Learning rewards: bounded stages/rarity, phase-only boundaries, final achievements, pending/skip/unmount release, existing queue contract, neutral unknown cards and sorting passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
