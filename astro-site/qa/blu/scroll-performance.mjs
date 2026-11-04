import {chromium} from 'file:///C:/Users/ahmedMansour/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const results=[];
try{
 for(const mode of ['lite','full']){
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4387')?route.continue():route.abort());
  await page.goto('http://127.0.0.1:4387/en/blu/');
  await page.getByRole('button',{name:'Reject optional',exact:true}).click();
  await page.locator('#blu-effects').selectOption(mode);
  await page.waitForSelector('body[data-effects="'+mode+'"]');
  await page.waitForTimeout(1800);
  const artwork=await page.locator('.blu-medusa').first().evaluate(el=>el.tagName.toLowerCase());
  if(artwork!==((process.env.QA_PHASE||'before')==='before'?'svg':'img'))throw new Error('Unexpected build generation');
  const session=await page.context().newCDPSession(page);
  await session.send('Performance.enable');
  const before=await session.send('Performance.getMetrics');
  const frames=await page.evaluate(()=>new Promise(resolve=>{
   let previous=0;let started=0;const intervals=[];
   function frame(now){
    if(!started)started=now; if(previous)intervals.push(now-previous);
    previous=now;window.scrollBy(0,9);
    if(now-started<4000)requestAnimationFrame(frame);else resolve(intervals);
   }
   requestAnimationFrame(frame);
  }));
  const after=await session.send('Performance.getMetrics');
  const delta=name=>after.metrics.find(m=>m.name===name).value-before.metrics.find(m=>m.name===name).value;
  results.push({mode,finalMode:await page.locator('body').getAttribute('data-effects'),frames:frames.length,slowFrames:frames.filter(ms=>ms>34).length,meanMs:frames.reduce((a,b)=>a+b,0)/frames.length,taskSeconds:delta('TaskDuration'),layoutSeconds:delta('LayoutDuration'),styleSeconds:delta('RecalcStyleDuration')});
  await page.close();
 }
 console.log(JSON.stringify(results,null,2));
 await fs.writeFile(new URL('./scroll-'+(process.env.QA_PHASE||'before')+'.json',import.meta.url),JSON.stringify({environment:'Headless Edge on this host, automated four-second scroll. Not a physical user device measurement.',results},null,2)+'\n');
}finally{await browser.close()}
