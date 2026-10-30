// Workerの終了後に、古いタイマーや応答が次の実行へ影響しないことを確認する。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const timers = new Map();
let timerId = 0;
const instances = [];
class FakeWorker {
  constructor() { this.listeners = { message: new Set(), error: new Set() }; instances.push(this); }
  addEventListener(type, fn) { this.listeners[type].add(fn); }
  removeEventListener(type, fn) { this.listeners[type].delete(fn); }
  postMessage(message) { this.message = message; }
  terminate() { this.terminated = true; }
  reply(data) { for (const fn of this.listeners.message) fn({ data: { id: this.message.id, ...data } }); }
}
const exportsObject = {};
const source = fs.readFileSync(path.join(__dirname, '../src/lib/pyodideRunner.ts'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
  exports: exportsObject, Worker: FakeWorker,
  window: { setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); } },
});

(async () => {
  const cancelled = exportsObject.preparePyodide().catch(error => error);
  const oldWorker = instances[0];
  exportsObject.disposePyodideRunner();
  assert.match((await cancelled).message, /中断/);
  assert.equal(timers.size, 0);
  assert.equal(oldWorker.listeners.message.size, 0);
  assert.equal(oldWorker.terminated, true);

  const ready = exportsObject.preparePyodide();
  const activeWorker = instances[1];
  oldWorker.reply({ ready: true });
  assert.equal(timers.size, 1, 'An obsolete reply must not finish a new request');
  activeWorker.reply({ ready: true });
  assert.equal((await ready).ready, true);
  assert.equal(timers.size, 0);

  const running = exportsObject.runCourseMissionTests('example', []).catch(error => error);
  [...timers.values()][0]();
  assert.match((await running).message, /タイムアウト/);
  assert.equal(activeWorker.terminated, true);
  assert.equal(timers.size, 0);
  const recovered = exportsObject.preparePyodide();
  instances[2].reply({ ready: true });
  assert.equal((await recovered).ready, true);
  exportsObject.disposePyodideRunner();
  assert.equal(timers.size, 0);
  console.log('Python runner: cancellation, obsolete replies, timeout and recovery passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
