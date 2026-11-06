const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ts = require('typescript');
const cache = new Map(), workers = [], timers = new Map(); let timerId = 0;
class FakeWorker {
  constructor() { this.listeners = new Map(); this.messages = []; this.terminated = false; workers.push(this); }
  addEventListener(name, listener) { if (!this.listeners.has(name)) this.listeners.set(name,new Set());this.listeners.get(name).add(listener); }
  removeEventListener(name, listener) { this.listeners.get(name)?.delete(listener); }
  postMessage(message) { this.messages.push(message); }
  terminate() { this.terminated = true; }
  emit(message) { for(const listener of [...this.listeners.get('message')??[]]) listener({data:message}); }
}
function load(filename) {
  filename = path.resolve(filename);
  if(cache.has(filename))return cache.get(filename);
  const exports={};cache.set(filename,exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,
    {exports,Worker:FakeWorker,window:{setTimeout:(callback,ms)=>{const id=++timerId;timers.set(id,{callback,ms});return id;},clearTimeout:id=>timers.delete(id)},require:name=>{
      if(!name.startsWith('.'))return require(name);
      const base=path.resolve(path.dirname(filename),name);return load([base+'.ts',base+'.tsx'].find(fs.existsSync));
    }},{filename});return exports;
}
const root=path.resolve(__dirname,'../src'),plain=value=>JSON.parse(JSON.stringify(value));
const runner=load(root+'/lib/pyodideRunner.ts');
const {bfsImplementationContent:content}=load(root+'/features/learning/bfs/implementation/implementation.content.ts');
const {runBfsFreeCode,freeDisplayCase,freeOutputLimit}=load(root+'/features/learning/bfs/implementation/freeExecution.ts');
const {FreeExecutionConsole}=load(root+'/features/learning/bfs/implementation/FreeExecutionConsole.tsx');
const {createElement}=require('react'),{renderToStaticMarkup}=require('react-dom/server');
(async()=>{
  // Real request routing: blank stdout/stderr frames are output, not completion frames.
  const observed=[];
  const promise=runner.runCourseMissionTests('code',[content.tests[0]],{onStdout:line=>observed.push(line),maxOutputChars:8});
  const worker=workers.at(-1),request=worker.messages.at(-1);let settled=false;promise.then(()=>settled=true);
  worker.emit({id:request.id+1,stdout:'PRIVATE_OTHER_REQUEST'});
  worker.emit({id:request.id,stdout:''});await Promise.resolve();assert.equal(settled,false);
  worker.emit({id:request.id,stdout:'public line'});worker.emit({id:request.id,stderr:''});worker.emit({id:request.id,stderr:'PRIVATE_STDERR'});
  worker.emit({id:request.id,done:true,results:[]});const response=await promise;
  assert.deepEqual(observed,['','public line']);assert.equal(response.stdout,'\npublic ');assert.equal(response.stderr,'\nPRIVATE');assert.equal(timers.size,0);
  const legacy=runner.runCourseMissionTests('legacy',[]);const legacyId=worker.messages.at(-1).id;
  worker.emit({id:legacyId,stdout:'one'});worker.emit({id:legacyId,stdout:'two'});worker.emit({id:legacyId,done:true,results:[]});assert.equal((await legacy).stdout,'one\ntwo');
  const beforeError=[];const failing=runner.runCourseMissionTests('fails',[],{onStdout:line=>beforeError.push(line)});const failId=worker.messages.at(-1).id;
  worker.emit({id:failId,stdout:'printed before failure'});worker.emit({id:failId,error:'ValueError: PRIVATE_EXCEPTION'});await assert.rejects(failing,/PRIVATE_EXCEPTION/);assert.deepEqual(beforeError,['printed before failure']);
  const deadline=runner.runCourseMissionTests('loop',[]);const deadlineTimer=[...timers.values()].find(timer=>timer.ms===15000);assert(deadlineTimer);deadlineTimer.callback();await assert.rejects(deadline,/タイムアウト/);assert(worker.terminated);
  const preparing=runner.preparePyodide();assert([...timers.values()].some(timer=>timer.ms===120000));const newWorker=workers.at(-1);newWorker.emit({id:newWorker.messages.at(-1).id,ready:true});await preparing;
  runner.disposePyodideRunner();assert.equal(timers.size,0);
  // Feature boundary: a new Worker, D1 only, no grading results or prior namespace reused.
  assert.equal(freeDisplayCase,content.tests[0]);assert.equal(freeDisplayCase.visibility,'display');
  const originalTests=JSON.stringify(content.tests);let disposed=0,prepared=0,runs=0,ready=false;
  runner.disposePyodideRunner=()=>{disposed++;ready=false;};
  runner.preparePyodide=async()=>{assert(disposed>0);prepared++;ready=true;};
  runner.runCourseMissionTests=async(code,tests,options)=>{
    assert(ready);assert.equal(disposed,prepared);runs++;
    assert.deepEqual(plain(tests),plain([content.tests[0]]));assert.equal(options.maxOutputChars,freeOutputLimit);
    options.onStdout('public D1'); options.onStdout('');
    return{done:true,results:[{id:'D1',actual:content.tests[0].expected,passed:true}]};
  };
  let notified=false;const success=await runBfsFreeCode('current code',()=>{notified=true;});assert(notified);assert(success.returned);assert.equal(success.error,null);assert.equal(success.stdout,'public D1\n');
  for(const [message,kind]of[['SyntaxError: PRIVATE_SYNTAX','syntax'],['ValueError: PRIVATE_RUNTIME','runtime'],['Pythonの実行がタイムアウトしました。処理を見直してください。','timeout']]){
    runner.runCourseMissionTests=async(_code,_tests,options)=>{options.onStdout('before error');throw Error(message);};
    const result=await runBfsFreeCode('error code');assert.equal(result.error,kind);assert.equal(result.stdout,'before error');assert.equal(result.returned,false);assert(!JSON.stringify(result).includes('PRIVATE_'));
  }
  runner.runCourseMissionTests=async(_code,_tests,options)=>{options.onStdout('x'.repeat(freeOutputLimit+100));options.onStdout('not retained');return{results:[{id:'D1',actual:{A:9,Z:4},passed:false}]};};
  const mismatch=await runBfsFreeCode('wrong distances');assert.equal(mismatch.error,'mismatch');assert(mismatch.returned);assert(mismatch.outputTruncated);assert.equal(mismatch.stdout.length,freeOutputLimit);
  const html=renderToStaticMarkup(createElement(FreeExecutionConsole,{result:mismatch,busy:false}));
  for(const marker of ['data-free-stdout','data-free-return','data-free-error-kind="mismatch"','項目なし','余分な項目','期待と異なる'])assert(html.includes(marker),marker);
  const errorHtml=renderToStaticMarkup(createElement(FreeExecutionConsole,{result:{stdout:'public print',outputTruncated:false,returned:false,error:'runtime'},busy:false}));assert(!errorHtml.includes('data-free-return'));assert(errorHtml.includes('public print'));
  const count=runs;await assert.rejects(()=>runBfsFreeCode('cancelled',()=>assert.fail(),()=>false),/cancelled/);assert.equal(runs,count);
  runner.preparePyodide=async()=>{throw Error('PRIVATE_PREPARATION_FAILURE');};const unavailable=await runBfsFreeCode('code');assert.equal(unavailable.error,'unavailable');assert(!JSON.stringify(unavailable).includes('PRIVATE_'));
  assert.equal(JSON.stringify(content.tests),originalTests,'Test inputs and expected outputs stay unchanged');
  console.log('BFS free execution: blank-output protocol, bounded capture, pre-error print, unchanged legacy output/deadline, fresh D1-only execution, redacted errors, mismatch formatting and cancellation passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
