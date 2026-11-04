// Test actual rendered motion and constant size, not only an animation clock.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
const {webkit,devices}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4348';
const shots='qa/home-refresh/screenshots/portrait-render';await mkdir(shots,{recursive:true});
const results=[];
for(const headed of [false,true]){
 const browser=await webkit.launch({headless:!headed});
 try{
  const page=await browser.newPage({...devices['iPhone 14'],reducedMotion:'no-preference'});
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.goto(origin+'/en/',{waitUntil:'networkidle'});
  const label=await page.locator('#cookie-consent-config').evaluate(n=>JSON.parse(n.textContent).messages.reject);await page.getByRole('button',{name:label,exact:true}).first().click();
  await page.locator('.wf-portrait-viewport').evaluate(n=>n.scrollIntoView({behavior:'instant',block:'center'}));
  await page.locator('.wf-figure').evaluate(n=>n.decode());
  await page.waitForFunction(()=>document.querySelector('.wf-foreground').getAnimations().length>0);
  const frames=[],rects=[];
  for(const time of [0,3500]){
   await page.evaluate(time=>{
    for(const selector of ['.wf-foreground','.wf-bg'])for(const a of document.querySelector(selector).getAnimations()){a.pause();a.currentTime=time;}
    return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   },time);
   rects.push(await page.locator('.wf-figure').evaluate(n=>n.getBoundingClientRect().toJSON()));
   const frame=await page.locator('.wf-portrait-viewport').screenshot();frames.push(await sharp(frame).ensureAlpha().raw().toBuffer());
   await writeFile(`${shots}/${headed?'headed':'headless'}-${time}.png`,frame);
  }
  assert.equal(frames[0].length,frames[1].length);let different=0;
  for(let i=0;i<frames[0].length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(frames[0][i+c]-frames[1][i+c])))>20)different++;
  const fraction=different/(frames[0].length/4),delta=rects[1].x-rects[0].x;
  assert(fraction>.01,'Portrait pixels must visibly change');assert(delta>10,'Foreground must actually move');
  assert(Math.abs(rects[1].width-rects[0].width)<.1,'No zoom during drift');assert(Math.abs(rects[1].height-rects[0].height)<.1);
  await page.locator('.wf-portrait-viewport').tap();assert.equal(await page.locator('.wf-container').getAttribute('data-poster-touch'),null);
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.wf-foreground').evaluate(n=>getComputedStyle(n).animationName),'none');
  const row={headed,device:'iPhone 14',browser:browser.version(),changedPixelFraction:Number(fraction.toFixed(4)),horizontalTravel:Number(delta.toFixed(2)),constantSize:true,noTouchZoom:true,reducedMotion:true};results.push(row);console.log(JSON.stringify(row));
 }finally{await browser.close();}
}
await writeFile('qa/home-refresh/portrait-render.json',JSON.stringify({origin,results,externalRequestsBlocked:true},null,2)+'\n');
