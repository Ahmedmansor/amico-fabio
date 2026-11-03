import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {webkit,chromium,devices}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4347',results=[];
for(const [engine,type] of [['webkit',webkit],['chromium',chromium]]){
 const browser=await type.launch();
 try{for(const mode of ['mobile','reduced','desktop']){
  const page=await browser.newPage(mode==='desktop'?{viewport:{width:1280,height:900}}:{...devices['iPhone 13'],reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.goto(origin+'/it/',{waitUntil:'networkidle'});
  const label=await page.locator('#cookie-consent-config').evaluate(n=>JSON.parse(n.textContent).messages.reject);await page.getByRole('button',{name:label,exact:true}).first().click();
  const poster=page.locator('.wf-container');await poster.evaluate(n=>n.scrollIntoView({behavior:'instant',block:'center'}));
  if(mode!=='reduced')await page.waitForFunction(()=>document.querySelector('.wf-container').dataset.posterVisible==='true');
  if(mode==='mobile'){
   await page.waitForFunction(()=>getComputedStyle(document.querySelector('.wf-foreground')).animationName==='fabio-mobile-drift');
   const before=await page.locator('.wf-foreground').evaluate(n=>n.getAnimations()[0].currentTime);
   await page.locator('.wf-portrait-viewport').tap();
   await poster.dispatchEvent('pointerdown',{pointerType:'touch',clientX:20,clientY:20,bubbles:true});
   await poster.dispatchEvent('pointermove',{pointerType:'touch',clientX:200,clientY:200,bubbles:true});
   await page.waitForTimeout(200);
   assert.equal(await poster.getAttribute('data-poster-touch'),null);
   assert.equal(await poster.evaluate(n=>n.style.getPropertyValue('--wf-rx')),'');
   assert.equal(await poster.evaluate(n=>n.style.getPropertyValue('--wf-shift-x')),'');
   assert(await page.locator('.wf-foreground').evaluate((n,before)=>n.getAnimations()[0].currentTime>before,before));
  }else if(mode==='desktop'){
   const box=await poster.boundingBox();await page.mouse.move(box.x+box.width*.6,box.y+box.height*.4);await page.mouse.move(box.x+box.width*.75,box.y+box.height*.4,{steps:3});await page.waitForFunction(()=>document.querySelector('.wf-container').style.getPropertyValue('--wf-ry')!=='');
   assert.notEqual(await poster.evaluate(n=>n.style.getPropertyValue('--wf-ry')),'');
  }else assert.equal(await page.locator('.wf-foreground').evaluate(n=>getComputedStyle(n).animationName),'none');
  results.push({engine,mode,passed:true});console.log(JSON.stringify(results.at(-1)));await page.close();
 }}finally{await browser.close();}
}
await writeFile('qa/home-refresh/portrait-touch.json',JSON.stringify({origin,results},null,2)+'\n');
