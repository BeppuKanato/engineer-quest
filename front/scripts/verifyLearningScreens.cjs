const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../src'), cache = new Map();
const requests = [], invalidations = [];
const storage = new Map();
const globals = { TextEncoder, Date, queueMicrotask, crypto: require('node:crypto').webcrypto,
  sessionStorage: { getItem: key => storage.get(key) ?? null, setItem: (key,value) => storage.set(key,value) },
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key,value) => storage.set(key,value) },
};
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { ...globals, exports, require: name => {
      if (name === '@/lib/fetcher') return { fetcher: async (url, options) => { requests.push({ url, options }); return { courseId: 'c', unit: {}, phase: {}, unlockedAchievements: [] }; } };
      if (name === '@/lib/clientQueryCache') return { queryTags: { courses:'courses',home:'home',collection:'collection',achievements:'achievements' }, invalidateClientQueries: tags => invalidations.push(tags), fetchClientQuery: (key, query) => query() };
      if (name === 'react') return {};
      if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
      const target = name.startsWith('@/') ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(file), name);
      return load(target+'.ts');
    } }, { filename: file });
  return exports;
}
const plain = value => JSON.parse(JSON.stringify(value));
(async () => {
  const api = load(root+'/api/learning.api.ts');
  const summary = { firstAttemptCorrect:1,totalQuestions:2,testRuns:3,hintUsage:[1,0,0,0] };
  await api.getLearningProgress('jwt','c/a'); await api.startLearningUnit('jwt','c/a','p/a');
  await api.completeLearningPhase('jwt','c/a','p/a',summary); await api.completeLearningUnit('jwt','c/a');
  await api.sendLearningEvents('jwt','session',[],true);
  assert.deepEqual(requests.map(item=>item.url), ['/learning/units/c%2Fa/progress','/learning/units/c%2Fa/start','/learning/units/c%2Fa/phases/p%2Fa/complete','/learning/units/c%2Fa/complete','/learning/events/batch']);
  assert(requests.every(item=>item.options.token==='jwt')); assert(requests.at(-1).options.keepalive);
  assert.deepEqual(JSON.parse(requests[2].options.body),{summary}); assert.equal(invalidations.length,3);
  const { learningUnits,findLearningUnit,resumePhaseIndex,savedPhaseSummaries } = load(root+'/features/learning/app/unitRegistry.ts');
  const unit = learningUnits[0]; assert.equal(unit.courseId,'course-algorithm-breadth-first-search-v1'); assert.equal(findLearningUnit('unknown'),undefined);
  const empty={courseId:unit.courseId,unit:null,phases:[]}; assert.equal(resumePhaseIndex(unit,empty),0);
  const gap={...empty,unit:{lastPhaseKey:unit.phases[6].id},phases:[{phaseKey:unit.phases[0].id,status:'COMPLETED',summary},{phaseKey:unit.phases[2].id,status:'COMPLETED',summary:{testRuns:'bad',hintUsage:[-1]}},{phaseKey:unit.phases[1].id,status:'IN_PROGRESS',summary:null}]};
  assert.equal(resumePhaseIndex(unit,gap),1,'Resume the first unfinished phase, not lastPhaseKey or a later completed phase');
  assert.deepEqual(plain(savedPhaseSummaries(unit,gap)[0]),summary); assert.deepEqual(plain(savedPhaseSummaries(unit,gap)[2]),{});
  assert.equal(resumePhaseIndex(unit,{...empty,phases:unit.phases.map(phase=>({phaseKey:phase.id,status:'COMPLETED'}))}),null);
  const draft = load(root+'/features/learning/app/codeDraft.ts');
  assert(draft.writeCodeDraft(unit.courseId,'u1','learner source')); assert.equal(draft.readCodeDraft(unit.courseId,'u1'),'learner source');
  assert.equal(draft.readCodeDraft(unit.courseId,'u2'),undefined); assert.equal(draft.readCodeDraft('another-course','u1'),undefined);
  assert(draft.codeDraftKey(unit.courseId,'u1').includes(unit.courseId)); assert(draft.writeCodeDraft(unit.courseId,'u1','')); assert.equal(draft.readCodeDraft(unit.courseId,'u1'),'');
  const {mergeLearningRewards,emptyLearningRewards}=load(root+'/features/learning/app/rewards.ts');
  const reward1=mergeLearningRewards(emptyLearningRewards,{phase:{phaseKey:'p1'},awardedCard:{id:'card1'},unlockedAchievements:[{id:'a1'}]});
  const reward2=mergeLearningRewards(reward1,{phase:{phaseKey:'p2'},awardedCard:{id:'card2'},unlockedAchievements:[{id:'a1'},{id:'a2'}]});
  assert.deepEqual(plain(reward2.awardedCards.map(item=>item.card.id)),['card1','card2']); assert.deepEqual(plain(reward2.unlockedAchievements.map(item=>item.id)),['a1','a2']);
  assert.equal(mergeLearningRewards(reward2,{phase:{phaseKey:'p1'},awardedCard:{id:'card1'},unlockedAchievements:[]}).awardedCards.length,2);
  const lifecycleWindow={}, lifecycleDocument={}; globals.window=lifecycleWindow; globals.document=lifecycleDocument;
  const {LearningEventQueue,learningSessionId,attachLearningEventQueue}=load(root+'/lib/learningEvents.ts');
  assert.equal(learningSessionId(),learningSessionId()); assert.equal(storage.get('engineer-quest:learning-session'),learningSessionId());
  const sent=[]; const send=async(token,sessionId,events,keepalive)=>{sent.push({token,sessionId,events,keepalive}); return {accepted:events.length};};
  const opts={sessionId:'tab',token:'cached-jwt',getToken:async()=>'renewed-jwt',send};
  const queue=new LearningEventQueue(opts);
  for(let i=0;i<19;i++)queue.enqueue({eventType:'view',targetId:String(i)});
  assert.equal(sent.length,0); queue.enqueue({eventType:'view',targetId:'19'}); await queue.flush(); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(sent.length,1); assert.equal(sent[0].events.length,20); assert.equal(sent[0].token,'renewed-jwt');
  assert.equal(sent[0].sessionId,'tab'); assert(sent[0].events.every(event=>!Number.isNaN(Date.parse(event.clientTimestamp))));
  assert.deepEqual(plain(sent[0].events.map(event=>event.targetId)),Array.from({length:20},(_,i)=>String(i)));
  assert.deepEqual(plain(sent[0].events.map(event=>event.payload.sequence)),Array.from({length:20},(_,i)=>i+1));
  queue.enqueue({eventType:'leave'}); await queue.flush(true); assert(sent[1].keepalive);
  let tokenRequested=false; const leaving=new LearningEventQueue({...opts,getToken:async()=>{tokenRequested=true;throw Error('offline');}});
  leaving.enqueue({eventType:'page_leave'}); await leaving.flush(true); assert.equal(tokenRequested,false,'Unload must start keepalive fetch with the cached auth header, without awaiting token refresh');
  let failures=0; const flaky=new LearningEventQueue({...opts,send:async()=>{failures++;throw Error('offline');}});
  flaky.enqueue({eventType:'answer'}); await flaky.flush(); await flaky.flush(); await flaky.flush(); assert.equal(failures,2,'Only one light retry; logging failures do not escape');
  const closed=new LearningEventQueue(opts);closed.enqueue({eventType:'old-user'});closed.close();await closed.flush();assert(!sent.some(batch=>batch.events.some(event=>event.eventType==='old-user')));
  const bytes=new LearningEventQueue(opts);for(let i=0;i<3;i++)bytes.enqueue({eventType:'code',payload:{code:'x'.repeat(19000)}});
  const offset=sent.length; await bytes.flush(true); assert(sent.slice(offset).reduce((sum,batch)=>sum+Buffer.byteLength(JSON.stringify({sessionId:batch.sessionId,events:batch.events})),0)<64000);
  await bytes.flush(); assert.equal(sent.slice(offset).flatMap(batch=>batch.events).length,3);
  // Visible dwell excludes time in background and is closed at pagehide before queue draining.
  const listeners={}, windowListeners={}, observed=[]; let now=10;
  Object.assign(lifecycleDocument,{visibilityState:'visible',addEventListener:(name,cb)=>listeners[name]=cb,removeEventListener:name=>delete listeners[name]});
  Object.assign(lifecycleWindow,{addEventListener:(name,cb)=>windowListeners[name]=cb,removeEventListener:name=>delete windowListeners[name]}); globals.performance={now:()=>now};
  let intervalMs=0, intervalTick;
  globals.window.setInterval=(callback,ms)=>{intervalMs=ms;intervalTick=callback;return 1;};
  globals.window.clearInterval=()=>{};
  const lifeQueue=new LearningEventQueue(opts), beforeLifetime=sent.length;
  const detach=attachLearningEventQueue(lifeQueue,()=>true);
  assert.equal(intervalMs,5000);lifeQueue.enqueue({eventType:'route_view'});intervalTick();await new Promise(resolve=>setImmediate(resolve));
  lifeQueue.enqueue({eventType:'route_leave'});detach();lifeQueue.enqueue({eventType:'child_dwell'});await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(plain(sent.slice(beforeLifetime).flatMap(batch=>batch.events).map(event=>event.eventType)),['route_view','route_leave','child_dwell']);
  assert(sent.at(-1).keepalive,'Route cleanup flush includes the child view cleanup event');
  const {observeLearningVisit}=load(root+'/features/learning/instrumentation/useLearningVisit.ts');
  const stop=observeLearningVisit(event=>observed.push(event),'player_step_view','s1');
  now=110;globals.document.visibilityState='hidden';listeners.visibilitychange();now=1000;globals.document.visibilityState='visible';listeners.visibilitychange();now=1050;windowListeners.pagehide();stop();
  assert.deepEqual(observed.map(event=>event.eventType),['player_step_view','player_step_dwell','player_step_dwell']);
  assert.deepEqual(observed.slice(1).map(event=>event.payload.visibleMs),[100,50]);
  console.log('Learning screens: authenticated API paths/summaries, resume gaps, account-scoped drafts, ordered reward handoff, 20-event batching, unload keepalive, one retry, byte budget and visible dwell passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
