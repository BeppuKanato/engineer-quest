const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
let cells = [], cursor = 0, pendingEffects = [];
const same = (a,b) => !!a && !!b && a.length === b.length && a.every((value,index)=>Object.is(value,b[index]));
const hooks = {
  ...React,
  useId() { return hooks.useRef("workspace-fixture").current; },
  useState(initial) { const index=cursor++; if(!cells[index]) cells[index]={value:typeof initial==="function"?initial():initial}; return [cells[index].value,update=>{cells[index].value=typeof update==="function"?update(cells[index].value):update;}]; },
  useRef(initial) { const index=cursor++; return cells[index] ||= {current:initial}; },
  useMemo(factory,deps) { const index=cursor++; if(!cells[index]||!same(cells[index].deps,deps)) cells[index]={deps,value:factory()}; return cells[index].value; },
  useCallback(callback,deps) { return hooks.useMemo(()=>callback,deps); },
  useEffect(effect,deps) { const index=cursor++; if(!cells[index]||!same(cells[index].deps,deps)) pendingEffects.push(()=>{cells[index]?.cleanup?.();cells[index]={deps,cleanup:effect()};}); },
};
let draft = "print('fixture')", selected = "full", disposed = 0;
const input = {useImplementationInputLevel:()=>({level:selected,code:draft,setCode:value=>{draft=value;},selectLevel:value=>{selected=value;}})};
const sounds = [];
const runner = {preparePyodide:async()=>{},disposePyodideRunner:()=>{disposed++;}};
const Editor = () => null, Results=()=>null, Hints=()=>null, Console=()=>null, TraceDialog=()=>null;
const cache = new Map();
function load(file) {
  file=path.resolve(file);if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);
  const code=ts.transpileModule(fs.readFileSync(file,"utf8"),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(code,{exports,window:{matchMedia:()=>({matches:false})},requestAnimationFrame:callback=>callback(),require(name){
    if(name==="react")return hooks;
    if(name==="@monaco-editor/react")return {__esModule:true,default:Editor};
    if(name.endsWith("/pyodideRunner"))return runner;
    if(name.endsWith("/useImplementationInputLevel"))return input;
    if(name.endsWith("/soundFeedback"))return {useSoundEffect:()=>({play:name=>sounds.push(name)})};
    if(name.endsWith("/useErrorLineDecoration"))return {useErrorLineDecoration(){}};
    if(!name.startsWith("."))return require(name);
    const target=path.resolve(path.dirname(file),name);return load([target+".ts",target+".tsx"].find(candidate=>fs.existsSync(candidate)));
  }},{filename:file});return exports;
}
const root=path.resolve(__dirname,"../src/features/learning");
const {ImplementationWorkspace}=load(root+"/implementation/ImplementationWorkspace.tsx");
const {ImplementationLevelSelector}=load(root+"/implementation/ImplementationLevelSelector.tsx");
const text={code:"Code",panel:"Run",testsTab:"Tests",consoleTab:"Console",hints:"Hints",hintNames:["1","2","3","4"],freeRun:"Free",preparing:"Preparing",running:"Free running"};
let resolveTest, progress, isCurrent, testCalls=0, freeCalls=0, traceCalls=0;
const exercise={
  label:"Fixture", text, traceText:{button:"Trace",resultButton:"Trace",loading:"Tracing",timeout:"Trace timeout",unavailable:"Trace unavailable"},
  content:{id:"fixture",caption:"Fixture",templates:{full:"full",skeleton:"skeleton","fill-in":"fill"},tests:[{id:"D1"},{id:"J1"}],
    status:{editorLoading:"Editor",timeoutNotice:"Timeout",unavailable:"Unavailable",loading:"Loading",ready:"Ready",running:"Case {current}/{total}"},
    controls:{reload:"Reload",run:"Test"},hints:{labels:["Hint 1","Hint 2","Hint 3","Hint 4"],compactLabels:["H1","H2","H3","H4"],groupLabel:"Hints"},
    result:{title:"Complete",closing:"Done",runsLabel:"Runs {count}",finalButton:"Final"}},
  Results,Hints,Console,
  runTests:(_code,_tests,onProgress,current)=>{testCalls++;progress=onProgress;isCurrent=current;return new Promise(resolve=>{resolveTest=resolve;});},
  runFreeCode:async(_code,onPrepared,current)=>{assert(current());freeCalls++;onPrepared();return {stdout:"PUBLIC_D1",outputTruncated:false,returned:true,actual:123,error:null};},
  visualDebug:{acquire:async(_code,current)=>{assert(current());traceCalls++;return {status:"ok",error:null};},convert:()=>({mode:"replay",notice:null,content:{steps:[{}]}}),Dialog:TraceDialog},
};
const events=[],completed=[],inserted=[];let finalCount=0,tree;
const props={exercise,onComplete:summary=>completed.push(summary),onLearningEvent:event=>events.push(event),onShowFinalResult:()=>{finalCount++;}};
const elements=value=>!value||typeof value!=="object"?[]:Array.isArray(value)?value.flatMap(elements):[value,...elements(value.props?.children)];
function draw(){cursor=0;pendingEffects=[];tree=elements(ImplementationWorkspace(props));pendingEffects.forEach(effect=>effect());}
const find=type=>tree.find(element=>element.type===type);
const button=label=>{const element=tree.find(element=>element.props?.children===label&&typeof element.props?.onClick==="function");assert(element,"Button "+label);return element.props;};
const tick=()=>new Promise(setImmediate);
(async()=>{
 draw();await tick();draw();
 find(Editor).props.onMount({getSelection:()=>({fixture:true}),pushUndoStop(){},executeEdits:(_id,edits)=>inserted.push(edits[0].text),focus(){}});
 draw();assert.equal(button("Test").disabled,false);
 assert.equal(tree.find(element=>element.props?.["aria-label"]==="Hint 2").props.disabled,true);
 tree.find(element=>element.props?.["aria-label"]==="Hint 1").props.onClick();draw();
 assert.equal(find(Hints).props.level,1);find(Hints).props.onInsert("token");draw();assert.deepEqual(inserted,["token"]);
 assert.equal(tree.find(element=>element.props?.["aria-label"]==="Hint 2").props.disabled,false);
 button("Free").onClick();await tick();draw();assert.equal(freeCalls,1);assert.equal(testCalls,0);assert.equal(find(Console).props.result.stdout,"PUBLIC_D1");
 button("Test").onClick();draw();assert.equal(testCalls,1);assert(isCurrent());assert.equal(button("Test").disabled,true);
 progress([{id:"D1",passed:true,actual:123}]);draw();assert.equal(find(Results).props.outcomes.length,1);
 const passed=[{id:"D1",passed:true,actual:123},{id:"J1",passed:true}];progress(passed);resolveTest(passed);await tick();draw();
 assert.equal(completed.length,1);assert.equal(completed[0].testRuns,1);assert.equal(completed[0].hintUsage[0],1);assert.equal(completed[0].inputLevel,"full");
 assert(tree.some(element=>element.props?.["data-completion-banner"]!==undefined));assert(find(Editor),"all-pass retains the editor");
 draw();assert.equal(completed.length,1,"rerenders do not repeat completion");button("Final").onClick();assert.equal(finalCount,1);
 button("Trace").onClick();await tick();draw();assert.equal(traceCalls,1);assert.equal(find(TraceDialog).props.playback.mode,"replay");
 find(TraceDialog).props.onClose();draw();assert(!find(TraceDialog));
 find(Editor).props.onChange("changed");draw();assert.equal(draft,"changed");assert.equal(find(Results).props.outcomes.length,0);
 find(ImplementationLevelSelector).props.onChange("skeleton");draw();assert.equal(selected,"skeleton");
 button("Test").onClick();draw();assert.equal(testCalls,2);assert(isCurrent());
 for(const cell of cells)cell?.cleanup?.();
 assert.equal(isCurrent(),false,"unmount cancels in-flight results");resolveTest(passed);await tick();
 assert.equal(completed.length,1,"late results cannot report another completion");
 assert(disposed>0);assert(events.some(event=>event.eventType==="implementation_complete"));assert(events.some(event=>event.eventType==="trace_result"));
 console.log("Implementation workspace: injected runners/UI, hint gating/insertion, D1 console, progress, all-pass once, retained editor, trace lifecycle, draft/level changes and unmount cancellation passed.");
})().catch(error=>{console.error(error);process.exitCode=1;});

