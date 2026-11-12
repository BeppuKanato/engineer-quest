const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require("node:path");
const puppeteer = require("../../back/node_modules/puppeteer");
const out = process.env.LEARNING_LAYOUT_OUTPUT_DIR;
if (out) fs.mkdirSync(out, { recursive: true });
const baseUrl = process.env.LEARNING_PREVIEW_URL || "http://127.0.0.1:3100";
(async()=>{
 const browser=await puppeteer.launch({headless:true});
 const results=[];
 try {
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [width,height] of [[1366,768],[1536,864],[2560,1440],[799,640]]){
   await page.setViewport({width,height});
   await page.goto(`${baseUrl}/learning-preview/greedy-coins-consolidation`,{waitUntil:'networkidle0',timeout:120000});
   await page.waitForSelector('[aria-label="10円の硬貨を選ぶ"]');
   await page.click('[aria-label="10円の硬貨を選ぶ"]');
   async function next(){await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='次の問題へ'));await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='次の問題へ').click());}
   await next();await page.waitForSelector('[data-choice-id="greedy-4-1-1"]');await page.click('[data-choice-id="greedy-4-1-1"]');
   await next();await page.waitForSelector('[data-choice-id="optimal-and-reason"]');await page.click('[data-choice-id="optimal-and-reason"]');
   await next();await page.waitForSelector('[data-parsons-line-id]');
   await page.waitForSelector('[data-answer-feedback]',{hidden:true});
   await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,750)));
   if (out) await page.screenshot({path:path.join(out, `${width}x${height}.png`)});
   const metrics=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
    const group=document.querySelector('[aria-label="コード行の並び替え"]');
    const board=group.parentElement;
    const answer=document.querySelector('[aria-label="この順序で回答する"]');
    return {viewport:[innerWidth,innerHeight],section:rect(document.querySelector('section')),board:{...rect(board),scrollHeight:board.scrollHeight,clientHeight:board.clientHeight},answer:rect(answer),bodyOverflow:document.documentElement.scrollWidth>innerWidth};
   });
   assert.equal(metrics.bodyOverflow, false, "No page-wide horizontal overflow");
   assert(metrics.section.width <= 1200, "Code-order width is bounded");
   if (width >= 800 && height > 640) assert(metrics.board.scrollHeight <= metrics.board.clientHeight + 1, "Short code uses its content height without a vertical scroll window");
   // The last line remains reachable above the sticky action row on compact screens.
   await page.$eval('[data-parsons-line-id="return-result"]', e => e.scrollIntoView({block:"center"}));
   const reachable = await page.evaluate(() => {
     const last = document.querySelector('[data-parsons-line-id="return-result"]').getBoundingClientRect();
     const button = document.querySelector('[aria-label="この順序で回答する"]').getBoundingClientRect();
     return { last: {top:last.top,bottom:last.bottom}, button: {top:button.top,bottom:button.bottom}, height:innerHeight };
   });
   assert(reachable.last.top >= 0 && reachable.last.bottom <= reachable.height && reachable.last.bottom <= reachable.button.top + 1, `Last line is reachable without being covered by the answer controls: ${width} ${JSON.stringify(reachable)}`);
   // Mouse drag and keyboard activation use the real controls rather than calling handlers.
   const handles = await page.$$('[aria-label$="をドラッグして並べ替え"]');
   await handles[0].scrollIntoView();
   const beforeDrag = await page.$$eval('[data-parsons-line-id]', es => es.map(e => e.getAttribute('data-parsons-line-id')));
   const handle = await handles[0].boundingBox();
   await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
   await page.mouse.down();
   await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + 72, {steps:12});
   await page.mouse.up();
   await page.waitForFunction(before => JSON.stringify([...document.querySelectorAll('[data-parsons-line-id]')].map(e => e.getAttribute('data-parsons-line-id'))) !== JSON.stringify(before), {}, beforeDrag);
   // Up/down buttons must also change the order.

   const ids=()=>page.$$eval('[data-parsons-line-id]',es=>es.map(e=>e.getAttribute('data-parsons-line-id')));
   const initial=await ids();

   const down = await page.$('[data-parsons-line-id] button[aria-label$="を下へ"]:not(:disabled)');
   await down.focus(); await page.keyboard.press("Enter");
   assert.notDeepEqual(await ids(),initial);
   await page.evaluate(()=>document.querySelector('[aria-label="この順序で回答する"]').click());
   await page.waitForFunction(()=>document.body.innerText.includes('不正解'));
   results.push({...metrics,submitted:true});
  }
  assert.deepEqual(errors,[]);
  if (out) fs.writeFileSync(path.join(out,"metrics.json"),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
