import assert from 'node:assert/strict';
import {writeFile,readFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const phase=process.argv[2]||'after',origin=process.env.QA_ORIGIN||'http://127.0.0.1:4341';
const baseline=phase==='after'?JSON.parse(await readFile('qa/home-refresh/portrait-contact-before.json','utf8')):null;
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const results=[];await mkdir(`qa/home-refresh/screenshots/portrait-contact-${phase}`,{recursive:true});
try{
 for(const locale of ['it','en'])for(const width of [375,430,820,1280]){
  const page=await browser.newPage({viewport:{width,height:960},hasTouch:width<1024}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(`${origin}/${locale}/`,{waitUntil:'load'});
  await page.getByRole('button',{name:locale==='it'?'Rifiuta facoltativi':'Reject optional',exact:true}).click();
  const poster=page.locator('.wf-container');await poster.scrollIntoViewIfNeeded();
  await page.locator('.wf-figure').evaluate(n=>n.decode());await page.locator('.wf-bg').evaluate(n=>n.decode());
  await page.waitForFunction(()=>document.querySelector('.wf-container').dataset.posterVisible==='true');
  const content=await page.evaluate(()=>({title:document.querySelector('.wf-copy h2').textContent,intro:document.querySelector('.wf-copy>p:not(.home-eyebrow)').textContent,cta:document.querySelector('.wf-bio-btn').textContent.trim(),image:document.querySelector('.wf-figure').getAttribute('src'),contact:document.querySelector('.wa-contact-text,.wa-fab-label').textContent,href:document.querySelector('#whatsapp-float').getAttribute('href')}));
  if(phase==='after'){
   assert.deepEqual(content,baseline.results.find(r=>r.locale===locale&&r.width===width).content);
   const image=await page.locator('.wf-portrait-viewport').boundingBox(),button=await page.locator('.wf-bio-btn').boundingBox();
   if(width<768)assert.ok(button.y+button.height<image.y,'Mobile biography button must be above the clipped portrait');
   if(width<768){await poster.dispatchEvent('pointerdown',{pointerType:'touch',clientX:(await poster.boundingBox()).x+(await poster.boundingBox()).width*.85,clientY:(await poster.boundingBox()).y+(await poster.boundingBox()).height*.25});}
   else await poster.hover({position:{x:(await poster.boundingBox()).width*.85,y:(await poster.boundingBox()).height*.25}});
   await page.waitForFunction(()=>parseFloat(document.querySelector('.wf-container').style.getPropertyValue('--wf-ry'))>6);
   const depth=await page.locator('.wf-foreground').evaluate(n=>new DOMMatrix(getComputedStyle(n).transform).m43);assert.ok(depth>= (width<768?70:110));
   await poster.dispatchEvent('pointercancel');await page.mouse.move(0,0);
   const icon=page.locator('.floating-whatsapp-icon');assert.equal(await icon.evaluate(n=>getComputedStyle(n).animationName),'wa-contact-nudge');
   assert.equal(await page.locator('#whatsapp-float .wa-contact-text').count(),1);assert.equal(await page.locator('.wa-fab-label').count(),0);
   const first=await icon.evaluate(n=>Number(n.getAnimations()[0].currentTime));await page.waitForTimeout(160);assert.ok(await icon.evaluate((n,first)=>Number(n.getAnimations()[0].currentTime)>first,first));
   await page.locator('.wf-bio-btn').click();assert.equal(await icon.evaluate(n=>getComputedStyle(n).animationPlayState),'paused');await page.keyboard.press('Escape');
  }
  await page.screenshot({path:`qa/home-refresh/screenshots/portrait-contact-${phase}/${locale}-${width}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  results.push({locale,width,content,errors,pass:true});console.log(`${phase} ${locale} ${width}: PASS`);await page.close();
 }
 if(phase==='after'){
  const page=await browser.newPage({viewport:{width:375,height:960},reducedMotion:'reduce'});await page.goto(`${origin}/en/`);
  assert.equal(await page.locator('.floating-whatsapp-icon').evaluate(n=>getComputedStyle(n).animationName),'none');
  assert.equal(await page.locator('.wf-foreground').evaluate(n=>getComputedStyle(n).transform),'none');results.push({reducedMotion:true,pass:true});await page.close();
 }
}finally{await browser.close();}
await writeFile(process.env.QA_REPORT||`qa/home-refresh/portrait-contact-${phase}.json`,JSON.stringify({origin,results},null,2)+'\n');console.log(JSON.stringify({cases:results.length,pass:true}));
