const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const puppeteer = require("../../back/node_modules/puppeteer");
const base = path.resolve(__dirname, "../src/features/learning");
const baseUrl = process.env.LEARNING_PREVIEW_URL || "http://127.0.0.1:3100";
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if(cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file,exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
    exports,require(name){if(!name.startsWith("."))return require(name);const target=path.resolve(path.dirname(file),name);return load([target+".ts",target+".tsx"].find(candidate=>fs.existsSync(candidate)));}
  },{filename:file});return exports;
}
const units = [["bfs","bfs"],["dfs","dfs"],["bubble-sort","bubbleSort"],["binary-search","binarySearch"],["greedy-coins","greedyCoins"],["wall-extension","wallExtension"],["maze-digging","mazeDigging"]];
const stages = {"code-check":["codeCheck.content.ts","CodeCheckContent"],check:["check.content.ts","CheckContent"],consolidation:["consolidation.content.ts","ConsolidationContent"]};
(async()=>{
 const browser=await puppeteer.launch({headless:true});
 try {
  const page=await browser.newPage();const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.setViewport({width:1366,height:768});
  for(const [stage,[filename,suffix]] of Object.entries(stages))for(const [slug,camel] of units){
    if(process.env.LEARNING_TEST_STAGE && stage !== process.env.LEARNING_TEST_STAGE) continue;
    if(process.env.LEARNING_TEST_UNITS && !process.env.LEARNING_TEST_UNITS.split(",").includes(slug)) continue;
    const content=load(path.join(base,slug,stage,filename))[camel+suffix];
    assert(content,`${slug}/${stage}: content fixture exists`);
    const response=await page.goto(`${baseUrl}/learning-preview/${slug}-${stage}`,{waitUntil:"networkidle0",timeout:120000});
    assert.equal(response.status(),200);await page.waitForSelector("section");
    for(let index=0;index<content.questions.length;index++){
      await page.waitForFunction(()=>{
        return [...document.querySelectorAll('section button,section [role="button"]')].some(e=>!e.disabled&&e.getAttribute("aria-disabled")!=="true"&&e.getBoundingClientRect().height>0);
      });
      const target=await page.evaluateHandle(()=>{
        const answer=document.querySelector('[aria-label="この順序で回答する"]');
        if(answer&&!answer.disabled)return answer;
        const choice=document.querySelector('section [role="group"][aria-label*="選択肢"] button:not(:disabled)');
        if(choice)return choice;
        return [...document.querySelectorAll('section button,section [role="button"]')].find(e=>!e.disabled&&e.getAttribute("aria-disabled")!=="true"&&e.getBoundingClientRect().height>0&&!/復習|ヒント|解説|次の問題|結果を見る|もう一度|提示順|基本例/.test(e.textContent));
      });
      assert(target.asElement(),`${slug}/${stage}: answer target for question ${index+1}`);
      await target.asElement().click();await target.dispose();
      await page.waitForFunction(()=>[...document.querySelectorAll("section button")].some(e=>/^(次の問題へ|結果を見る)$/.test(e.textContent)));
      await page.waitForSelector("[data-answer-feedback]",{hidden:true});
      const next=await page.evaluateHandle(()=>[...document.querySelectorAll("section button")].find(e=>/^(次の問題へ|結果を見る)$/.test(e.textContent)));
      await next.asElement().click();await next.dispose();
    }
    await page.waitForFunction(()=>![...document.querySelectorAll("section button")].some(e=>/^(次の問題へ|結果を見る)$/.test(e.textContent)));
    assert(await page.$eval("section",e=>e.innerText.trim().length>0),"completion remains visible");
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${slug}/${stage}: no page-wide horizontal overflow`);
    const restart=await page.evaluateHandle(()=>[...document.querySelectorAll("section button")].find(e=>e.textContent==="もう一度解く"));
    if(restart.asElement()){
      await restart.asElement().click();await page.waitForFunction(()=>![...document.querySelectorAll("section button")].some(e=>e.textContent==="もう一度解く"));
    }
    await restart.dispose();
    assert.deepEqual(errors,[],`${slug}/${stage}: no unhandled browser errors`);
    console.log(`${slug}/${stage}: answered ${content.questions.length} questions through the soft gate and reached completion`);
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
