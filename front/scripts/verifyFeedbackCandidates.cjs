const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const ts=require('typescript'), React=require('react'), {renderToStaticMarkup}=require('react-dom/server');
const source=fs.readFileSync(path.resolve(__dirname,'../src/app/component/feedbackV1.tsx'),'utf8');
const records=[], effects=[], listeners=new Map(), storage=new Map();
const candidates=[{candidateId:'candidate-1',nextStep:'図で追う',reason:'順序を確かめるため',actionLabel:'図を見る',actionHref:'/learn?phase=one'},
  {candidateId:'candidate-2',nextStep:'別の図で追う',reason:'違いを確かめるため',actionLabel:'別の図を見る',actionHref:'/learn?phase=two'},
  {candidateId:'candidate-3',nextStep:'理由を頭の中で整理する',reason:'規則を結びつけるため',actionLabel:'整理する',actionHref:null}];
const nodes=candidates.map(c=>({getAttribute:()=>c.candidateId}));
const scope={querySelectorAll:()=>nodes};
const marker={closest:()=>scope};
let mockHooks=false, observer;
const exportsObject={};
const auth={currentUser:{getIdToken:async()=>'fixture-token'}};
const document={visibilityState:'visible',addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:()=>{}};
const window={location:{origin:'https://fixture.invalid',href:'https://fixture.invalid/learn',search:''}};
const sessionStorage={setItem:(key,value)=>storage.set(key,value),getItem:key=>storage.get(key)||null,removeItem:key=>storage.delete(key)};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{
  exports:exportsObject, document, window, sessionStorage, URL, URLSearchParams, performance, crypto:require('node:crypto').webcrypto,
  IntersectionObserver:class {constructor(callback){observer={callback};}observe(){}disconnect(){}},
  require:name=>{
    if(name==='react')return {...React,
      useRef:value=>{const reference=mockHooks ? ()=>({current:marker}) : React.useRef;return reference(value);},
      useEffect:fn=>{const effect=mockHooks ? callback=>effects.push(callback) : React.useEffect;return effect(fn);},
    };
    if(name==='@/lib/firebase')return {auth};
    if(name==='firebase/auth')return {};
    if(name==='@/lib/fetcher')return {fetcher:async(url,options)=>{records.push(JSON.parse(options.body));}};
    if(name==='@/api/feedbackV1.api')return {};
    if(name==='next/link')return {__esModule:true,default:({children,...props})=>React.createElement('a',props,children)};
    return require(name);
  },
});
async function main(){
  for(const n of [1,2,3]){
    const html=renderToStaticMarkup(React.createElement(exportsObject.FeedbackCandidates,{candidates:candidates.slice(0,n)}));
    assert.equal((html.match(/<article/g)||[]).length,n);
    assert.equal((html.match(/<a /g)||[]).length,Math.min(n,2),'offline suggestion is useful text, no fake button/link');
  }
  mockHooks=true;
  exportsObject.FeedbackObservation({id:'feedback',href:candidates[0].actionHref,candidates});effects.shift()();
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(records.filter(r=>r.type==='PRESENTED').map(r=>r.data.candidateId),candidates.map(c=>c.candidateId));
  observer.callback([{target:nodes[1],isIntersecting:true}]);
  const anchor={getAttribute:name=>name==='href'?candidates[1].actionHref:null,hasAttribute:()=>false,closest:()=>({getAttribute:()=>candidates[1].candidateId})};
  listeners.get('click')({target:{closest:()=>anchor}});
  await new Promise(resolve=>setImmediate(resolve));
  const clicked=records.find(r=>r.type==='CLICKED');
  assert.equal(clicked.data.candidateId,'candidate-2');
  assert.equal(clicked.data.expected,'/learn?phase=two','phase routes remain distinguishable');
  assert.deepEqual(clicked.data.notSelectedCandidateIds,['candidate-1','candidate-3']);
  assert.equal(JSON.parse(storage.get('feedback-v1-pending')).candidateId,'candidate-2');
  const skip={getAttribute:()=>null,hasAttribute:name=>name==='data-feedback-skip',closest:()=>null};
  listeners.get('click')({target:{closest:()=>skip}});
  await new Promise(resolve=>setImmediate(resolve));
  const skipped=records.find(r=>r.type==='NAVIGATION_SELECTED');
  assert.equal(skipped.data.skipped,true);assert.equal(skipped.data.notSelectedCandidateIds.length,3);
  exportsObject.FeedbackDestination({ready:true,targetId:'two',actualRoute:'/learn?phase=two'});effects.shift()();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(records.find(r=>r.type==='ARRIVED').data.candidateId,'candidate-2');
  assert.equal(storage.has('feedback-v1-pending'),false);
  assert.deepEqual(records.filter(r=>r.type==='VIEWED').map(r=>r.data.candidateId),['candidate-2'],'offscreen candidates are not viewport-observed');
  console.log('PASS: 1–3 candidate SSR, offline text, per-candidate presentation/view/selection/skip, phase route and arrival identity');
}
void main().catch(e=>{console.error(e);process.exitCode=1;});
